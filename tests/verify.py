"""Offline integration checks: local PHP + local TLS SMTP; no external mail sent."""
from pathlib import Path
from email.parser import BytesParser
from email.policy import default
import json, os, socket, socketserver, ssl, subprocess, tempfile, threading, time, urllib.parse
import urllib.request, urllib.error, http.cookiejar, uuid

class Response:
    def __init__(self, status, body): self.status_code, self.text = status, body.decode()
    def json(self): return json.loads(self.text)

class Session:
    def __init__(self):
        self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def request(self, method, url, data=None, files=None, headers=None, timeout=30):
        headers=dict(headers or {})
        body=None
        if files:
            boundary='msp'+uuid.uuid4().hex
            parts=[]
            for key,value in (data or {}).items():
                parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
            for key,(name,content,mime) in files.items():
                parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"; filename="{name}"\r\nContent-Type: {mime}\r\n\r\n'.encode()+content+b'\r\n')
            body=b''.join(parts)+f'--{boundary}--\r\n'.encode()
            headers['Content-Type']='multipart/form-data; boundary='+boundary
        elif data is not None:
            body=urllib.parse.urlencode(data).encode()
            headers['Content-Type']='application/x-www-form-urlencoded'
        request=urllib.request.Request(url,data=body,headers=headers,method=method)
        try:
            with self.opener.open(request,timeout=timeout) as r: return Response(r.status,r.read())
        except urllib.error.HTTPError as e: return Response(e.code,e.read())
    def get(self,url,**kwargs): return self.request('GET',url,**kwargs)
    def post(self,url,**kwargs): return self.request('POST',url,**kwargs)
    def put(self,url,**kwargs): return self.request('PUT',url,**kwargs)

ROOT = Path(__file__).resolve().parents[1]
PHP = os.environ['MSP_TEST_PHP']
EXT = os.environ['MSP_TEST_EXT']
messages = []
reject = False

class SMTP(socketserver.StreamRequestHandler):
    def handle(self):
        self.wfile.write(b'220 localhost SMTP test\r\n')
        auth = 0
        while True:
            line = self.rfile.readline()
            if not line: break
            command = line.upper()
            if auth:
                auth -= 1
                self.wfile.write(b'334 UGFzc3dvcmQ6\r\n' if auth else b'235 Authenticated\r\n')
            elif command.startswith(b'EHLO'):
                self.wfile.write(b'250-localhost\r\n250-AUTH LOGIN\r\n250 SIZE 20000000\r\n')
            elif command.startswith(b'AUTH LOGIN'):
                auth = 2
                self.wfile.write(b'334 VXNlcm5hbWU6\r\n')
            elif command.startswith(b'DATA'):
                self.wfile.write(b'354 End with dot\r\n')
                data = b''
                while True:
                    part = self.rfile.readline()
                    if part == b'.\r\n' or not part: break
                    data += part[1:] if part.startswith(b'..') else part
                if reject:
                    self.wfile.write(b'550 Test rejection\r\n')
                else:
                    messages.append(data)
                    self.wfile.write(b'250 Accepted\r\n')
            elif command.startswith(b'QUIT'):
                self.wfile.write(b'221 Bye\r\n'); break
            else:
                self.wfile.write(b'250 OK\r\n')

class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

def run():
    global reject
    config = ROOT/'api/private/mail.php'
    assert not config.exists(), 'Test refuses to overwrite mailbox configuration'
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        cert, key = tmp/'cert.pem', tmp/'key.pem'
        subprocess.run(['openssl','req','-x509','-newkey','rsa:2048','-nodes','-keyout',str(key),'-out',str(cert),'-days','1','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        smtp = Server(('127.0.0.1',0), SMTP)
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(cert,key)
        smtp.socket = ctx.wrap_socket(smtp.socket,server_side=True)
        threading.Thread(target=smtp.serve_forever,daemon=True).start()
        sock = socket.socket(); sock.bind(('127.0.0.1',0)); port=sock.getsockname()[1];sock.close()
        cmd=[PHP,'-n','-d','extension_dir='+EXT,'-d','extension=ctype','-d','extension=fileinfo','-d','extension=mbstring','-d','openssl.cafile='+str(cert),'-d','upload_max_filesize=5M','-d','post_max_size=12M','-d','session.save_path='+str(tmp),'-S',f'127.0.0.1:{port}','-t',str(ROOT)]
        log=(tmp/'php.log').open('w')
        proc=subprocess.Popen(cmd,stdout=log,stderr=log)
        url=f'http://127.0.0.1:{port}/api/rfq.php'
        session=Session()
        try:
            for _ in range(50):
                try:
                    response=session.get(url,timeout=1)
                    break
                except urllib.error.URLError: time.sleep(.1)
            else: raise AssertionError('PHP server did not start')
            assert response.status_code==200, response.text
            assert response.json()['ready'] is False
            assert session.post(url).status_code==503
            assert session.put(url).status_code==405
            assert session.get(url,headers={'Origin':'https://other.example'}).status_code==403
            for path in ['/en/','/de/','/es/','/en/request-a-quote/','/de/anfrage/','/es/solicitar-presupuesto/','/en/privacy/','/de/datenschutz/','/es/privacidad/']:
                assert session.get(urllib.parse.urljoin(url,path)).status_code==200, path
            # Configuration only exists during these tests and uses fake credentials.
            config.write_text("<?php return "+"['host'=>'127.0.0.1','port'=>"+str(smtp.server_address[1])+",'encryption'=>'ssl','username'=>'pedro@mspsourcing.com','password'=>'test-only','recipient'=>'pedro@mspsourcing.com'];")
            init=session.get(url).json(); assert init['ready']
            payload=dict(name='Prueba Álvarez',company='Test GmbH',email='contact@example.invalid',phone='',process='cnc',quantity='10',details='Local integration test',language='es',consent='1',csrf=init['token'])
            assert session.post(url,data={**payload,'csrf':'bad'}).status_code==403
            time.sleep(2.1)
            assert session.post(url,data={**payload,'email':'invalid'}).status_code==422
            assert session.post(url,data={**payload,'consent':'0'}).status_code==422
            assert session.post(url,data={**payload,'company':'Injected\r\nBcc:bad@example.invalid'}).status_code==422
            assert session.post(url,data={**payload,'website_url':'spam'}).status_code==422
            assert session.post(url,data=payload,files={'files[]':('evil.php',b'<?php echo 1;','text/plain')}).status_code==422
            assert session.post(url,data=payload,files={'files[]':('fake.pdf',b'<html>not a pdf</html>','application/pdf')}).status_code==422
            response=session.post(url,data=payload,files={'files[]':('test.pdf',b'%PDF-1.4\n%test\n%%EOF','application/pdf')})
            assert response.status_code==200,response.text
            assert response.json()['ok'] and len(messages)==1
            message=BytesParser(policy=default).parsebytes(messages[0])
            assert message['Reply-To'].addresses[0].addr_spec=='contact@example.invalid'
            assert message['From'].addresses[0].addr_spec=='pedro@mspsourcing.com'
            assert message['To'].addresses[0].addr_spec=='pedro@mspsourcing.com'
            assert list(message.iter_attachments())[0].get_filename()=='test.pdf'
            assert 'Local integration test' in message.get_body(preferencelist=('plain',)).get_content()
            assert session.post(url,data=payload).json()['reference']==response.json()['reference']
            assert len(messages)==1, 'Duplicate request sent another message'
            oldtoken=payload['csrf']
            payload['csrf']=session.get(url).json()['token']
            assert payload['csrf']!=oldtoken
            time.sleep(2.1)
            reject=True
            response=session.post(url,data=payload)
            assert response.status_code==502 and response.json()['code']=='delivery',response.text
            assert len(messages)==1
            assert 'test-only' not in response.text
            print(json.dumps({'result':'PASS','checks':'pages, disabled SMTP, origin, methods, CSRF, consent, header injection, honeypot, extension/MIME validation, TLS SMTP success, PDF attachment, reply-to, idempotency, token renewal, SMTP rejection','external_emails_sent':0}))
        finally:
            config.unlink(missing_ok=True)
            proc.terminate();proc.wait(timeout=5)
            smtp.shutdown();smtp.server_close();log.close()

if __name__=='__main__': run()
