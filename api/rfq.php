<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    respond(405, ['ok' => false, 'code' => 'method']);
}

// Reject other origins. Do not enable wildcard CORS for the upload endpoint.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, ['https://mspsourcing.com', 'https://www.mspsourcing.com'], true)) {
    respond(403, ['ok' => false, 'code' => 'origin']);
}

ini_set('session.use_strict_mode', '1');
session_name('MSPRFQ');
session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true, 'samesite' => 'Lax',
]);
if (!session_start()) respond(503, ['ok' => false, 'code' => 'unavailable']);

$settingsPath = __DIR__ . '/private/mail.php';
$settings = is_file($settingsPath) ? require $settingsPath : [];
$ready = is_array($settings)
    && !empty($settings['host']) && !empty($settings['username']) && !empty($settings['password'])
    && filter_var($settings['username'], FILTER_VALIDATE_EMAIL)
    && filter_var($settings['recipient'] ?? '', FILTER_VALIDATE_EMAIL);

if ($method === 'GET') {
    if (empty($_SESSION['csrf']) || isset($_SESSION['sent_token']) || time() - (int)($_SESSION['issued'] ?? 0) > 7200) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $_SESSION['issued'] = time();
        unset($_SESSION['sent_token'], $_SESSION['sent_reference']);
    }
    respond(200, ['ok' => true, 'ready' => (bool)$ready, 'token' => $_SESSION['csrf'],
        'limits' => ['files' => 3, 'file_bytes' => 5242880, 'total_bytes' => 10485760]]);
}

if (!$ready) respond(503, ['ok' => false, 'code' => 'unavailable']);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 11534336) respond(413, ['ok' => false, 'code' => 'files']);
if (!isset($_POST['csrf']) || !is_string($_POST['csrf']) || empty($_SESSION['csrf'])
    || !hash_equals($_SESSION['csrf'], $_POST['csrf'])
    || time() - (int)($_SESSION['issued'] ?? 0) > 7200) {
    respond(403, ['ok' => false, 'code' => 'expired']);
}
// An identical successful request is not sent twice if a network retry occurs.
if (isset($_SESSION['sent_token']) && hash_equals($_SESSION['sent_token'], $_POST['csrf'])) {
    respond(200, ['ok' => true, 'reference' => $_SESSION['sent_reference']]);
}
if (time() - (int)$_SESSION['issued'] < 2 || !empty($_POST['website_url'])) {
    respond(422, ['ok' => false, 'code' => 'validation']);
}

function field(string $key, int $limit, bool $required = false): string {
    $value = $_POST[$key] ?? '';
    if (!is_string($value) || !preg_match('//u', $value)) respond(422, ['ok' => false, 'code' => 'validation']);
    $value = trim($value);
    if (strlen($value) > $limit || ($required && $value === '') || str_contains($value, "\0")) {
        respond(422, ['ok' => false, 'code' => 'validation']);
    }
    return $value;
}

$name = field('name', 200, true);
$company = field('company', 300);
$email = field('email', 254, true);
$phone = field('phone', 100);
$process = field('process', 100, true);
$quantity = field('quantity', 200);
$details = field('details', 12000, true);
$language = field('language', 2, true);
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strpbrk($email . $name . $company, "\r\n") !== false
    || ($_POST['consent'] ?? '') !== '1'
    || !in_array($language, ['de', 'en', 'es'], true)
    || !in_array($process, ['cnc', 'injection', 'sheet-metal', 'prototyping', 'custom'], true)) {
    respond(422, ['ok' => false, 'code' => 'validation']);
}

$attachments = [];
$total = 0;
if (isset($_FILES['files'])) {
    $files = $_FILES['files'];
    if (!isset($files['name'], $files['error'], $files['size'], $files['tmp_name'])
        || !is_array($files['name']) || !is_array($files['error']) || !is_array($files['size'])
        || !is_array($files['tmp_name']) || count($files['name']) > 3) {
        respond(422, ['ok' => false, 'code' => 'files']);
    }
    foreach ($files['name'] as $i => $original) {
        $error = $files['error'][$i] ?? UPLOAD_ERR_NO_FILE;
        if ($error === UPLOAD_ERR_NO_FILE) continue;
        if ($error !== UPLOAD_ERR_OK || !is_string($original)
            || !is_string($files['tmp_name'][$i] ?? null) || !is_uploaded_file($files['tmp_name'][$i])) {
            respond(422, ['ok' => false, 'code' => 'files']);
        }
        $tmp = $files['tmp_name'][$i];
        $size = filesize($tmp);
        $extension = strtolower(pathinfo($original, PATHINFO_EXTENSION));
        if ($size === false || $size < 1 || $size > 5242880
            || !in_array($extension, ['pdf', 'step', 'stp', 'dxf', 'dwg', 'zip'], true)) {
            respond(422, ['ok' => false, 'code' => 'files']);
        }
        $total += $size;
        if ($total > 10485760) respond(413, ['ok' => false, 'code' => 'files']);
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);
        if (in_array($mime, ['application/x-php', 'application/x-executable', 'application/x-dosexec', 'text/html', 'image/svg+xml'], true)) {
            respond(422, ['ok' => false, 'code' => 'files']);
        }
        $head = (string)file_get_contents($tmp, false, null, 0, 512);
        if (($extension === 'pdf' && !str_starts_with($head, '%PDF-'))
            || ($extension === 'zip' && !str_starts_with($head, "PK\x03\x04") && !str_starts_with($head, "PK\x05\x06"))) {
            respond(422, ['ok' => false, 'code' => 'files']);
        }
        $safeName = preg_replace('/[^A-Za-z0-9._-]/', '_', basename(str_replace('\\', '/', $original)));
        $safeName = substr(pathinfo($safeName, PATHINFO_FILENAME), 0, 100) . '.' . $extension;
        $attachments[] = [$tmp, $safeName];
    }
}

// Rate limit per source IP, using a locked file outside the web directory.
// Only a one-way identifier and timestamps are retained, never enquiry contents.
$rateDir = sys_get_temp_dir() . '/msp-rfq-' . substr(hash('sha256', __DIR__), 0, 16);
if (!is_dir($rateDir) && !@mkdir($rateDir, 0700, true) && !is_dir($rateDir)) {
    respond(503, ['ok' => false, 'code' => 'unavailable']);
}
$ipKey = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . __DIR__);
$rateFile = @fopen($rateDir . '/' . $ipKey . '.json', 'c+');
if (!$rateFile || !flock($rateFile, LOCK_EX)) respond(503, ['ok' => false, 'code' => 'unavailable']);
$attempts = json_decode((string)stream_get_contents($rateFile), true);
$attempts = is_array($attempts) ? array_values(array_filter($attempts, fn($t) => is_int($t) && $t > time() - 3600)) : [];
if (count($attempts) >= 10) {
    flock($rateFile, LOCK_UN); fclose($rateFile);
    header('Retry-After: 3600');
    respond(429, ['ok' => false, 'code' => 'rate']);
}
$attempts[] = time();
rewind($rateFile); ftruncate($rateFile, 0); fwrite($rateFile, json_encode($attempts));
flock($rateFile, LOCK_UN); fclose($rateFile);
// Opportunistic expiry of old rate-limit counters; exclude symlinks.
if (random_int(1, 20) === 1) {
    foreach (glob($rateDir . '/*.json') ?: [] as $counter) {
        if (!is_link($counter) && filemtime($counter) < time() - 86400) @unlink($counter);
    }
}

require_once __DIR__ . '/vendor/phpmailer/src/Exception.php';
require_once __DIR__ . '/vendor/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/vendor/phpmailer/src/SMTP.php';
$reference = 'MSP-' . gmdate('Ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));
try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = (string)$settings['host'];
    $mail->Port = (int)($settings['port'] ?? 465);
    $mail->SMTPAuth = true;
    $mail->Username = (string)$settings['username'];
    $mail->Password = (string)$settings['password'];
    $encryption = $settings['encryption'] ?? 'ssl';
    if (!in_array($encryption, ['ssl', 'tls'], true)) throw new RuntimeException('Invalid encryption');
    $mail->SMTPSecure = $encryption === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
    $mail->CharSet = 'UTF-8';
    $mail->Timeout = 20;
    $mail->SMTPDebug = 0;
    $mail->setFrom($mail->Username, (string)($settings['sender_name'] ?? 'MSP website'));
    $mail->addAddress((string)$settings['recipient']);
    $mail->addReplyTo($email, $name);
    $mail->Subject = $reference . ' | ' . ($company !== '' ? $company : $name);
    $mail->Body = "New website enquiry\nReference: $reference\nName: $name\nCompany: $company\nEmail: $email\nPhone: $phone\nProcess: $process\nQuantity: $quantity\nLanguage: $language\n\nProject details:\n$details\n\nPrivacy information acknowledged: yes\n";
    foreach ($attachments as [$tmp, $safeName]) $mail->addAttachment($tmp, $safeName);
    $mail->send();
    $_SESSION['sent_token'] = $_POST['csrf'];
    $_SESSION['sent_reference'] = $reference;
    respond(200, ['ok' => true, 'reference' => $reference]);
} catch (Throwable $error) {
    // Keep SMTP details and credentials out of the public response.
    error_log('MSP RFQ delivery failed: ' . $reference);
    respond(502, ['ok' => false, 'code' => 'delivery']);
}
