const form = document.querySelector('.rfq-form');
const lang = document.documentElement.lang;
const copy = {
  en: {
    loading: 'Preparing the form…', ready: 'Up to 3 files, 5 MB each and 10 MB in total. PDF, STEP, STP, DXF, DWG or ZIP.',
    unavailable: 'Online submission is not available yet. Please email pedro@mspsourcing.com. Your enquiry has not been sent.',
    sending: 'Sending your enquiry…', success: 'Your enquiry has been submitted. Reference: ',
    files: 'Please use up to 3 PDF, STEP, STP, DXF, DWG or ZIP files: 5 MB each and 10 MB in total.',
    expired: 'The form session has expired. Refresh this page before submitting again.',
    validation: 'Please check the required fields and privacy acknowledgement, and try again.',
    rate: 'Too many attempts. Please try again later or email pedro@mspsourcing.com.',
    delivery: 'We could not confirm delivery. Your entries are preserved. Please try again or email pedro@mspsourcing.com.',
    method: 'Please refresh the page and try again.', origin: 'Please use the form on mspsourcing.com.',
  },
  de: {
    loading: 'Formular wird vorbereitet…', ready: 'Bis zu 3 Dateien, je 5 MB und insgesamt 10 MB. PDF, STEP, STP, DXF, DWG oder ZIP.',
    unavailable: 'Der Onlineversand ist noch nicht verfügbar. Bitte schreiben Sie an pedro@mspsourcing.com. Ihre Anfrage wurde nicht gesendet.',
    sending: 'Ihre Anfrage wird gesendet…', success: 'Ihre Anfrage wurde übermittelt. Referenz: ',
    files: 'Bitte maximal 3 PDF-, STEP-, STP-, DXF-, DWG- oder ZIP-Dateien auswählen: je 5 MB, insgesamt 10 MB.',
    expired: 'Die Sitzung ist abgelaufen. Bitte laden Sie diese Seite vor dem erneuten Absenden neu.',
    validation: 'Bitte prüfen Sie die Pflichtfelder und die Datenschutzbestätigung und versuchen Sie es erneut.',
    rate: 'Zu viele Versuche. Bitte versuchen Sie es später erneut oder schreiben Sie an pedro@mspsourcing.com.',
    delivery: 'Die Zustellung konnte nicht bestätigt werden. Ihre Eingaben bleiben erhalten. Bitte versuchen Sie es erneut oder schreiben Sie an pedro@mspsourcing.com.',
    method: 'Bitte laden Sie die Seite neu und versuchen Sie es erneut.', origin: 'Bitte verwenden Sie das Formular auf mspsourcing.com.',
  },
  es: {
    loading: 'Preparando el formulario…', ready: 'Hasta 3 archivos, 5 MB por archivo y 10 MB en total. PDF, STEP, STP, DXF, DWG o ZIP.',
    unavailable: 'El envío por formulario todavía no está disponible. Escribe a pedro@mspsourcing.com. Tu consulta no se ha enviado.',
    sending: 'Enviando tu consulta…', success: 'Tu consulta se ha enviado. Referencia: ',
    files: 'Selecciona hasta 3 archivos PDF, STEP, STP, DXF, DWG o ZIP: 5 MB por archivo y 10 MB en total.',
    expired: 'La sesión ha caducado. Actualiza esta página antes de volver a enviar.',
    validation: 'Revisa los campos obligatorios y la confirmación de privacidad e inténtalo de nuevo.',
    rate: 'Demasiados intentos. Prueba más tarde o escribe a pedro@mspsourcing.com.',
    delivery: 'No hemos podido confirmar la entrega. Se conservan los datos que has escrito. Reintenta el envío o escribe a pedro@mspsourcing.com.',
    method: 'Actualiza la página e inténtalo de nuevo.', origin: 'Utiliza el formulario en mspsourcing.com.',
  },
};

if (form) {
  const text = copy[lang] || copy.en;
  const status = form.querySelector('.rfq-status');
  const button = form.querySelector('[type="submit"]');
  const endpoint = new URL('../../api/rfq.php', import.meta.url);
  let token = '';
  let available = false;
  let submitting = false;
  const show = (message, kind = '') => {
    status.textContent = message;
    status.dataset.kind = kind;
  };
  button.disabled = true;
  show(text.loading);
  try {
    const response = await fetch(endpoint, { credentials: 'same-origin', cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.ok || !result.ready || !result.token) throw new Error('Unavailable');
    token = result.token;
    available = true;
    button.disabled = false;
    show(text.ready);
  } catch {
    show(text.unavailable, 'error');
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    if (!available) { show(text.unavailable, 'error'); return; }
    if (!form.reportValidity()) return;
    const files = Array.from(form.querySelector('[type="file"]').files);
    if (files.length > 3 || files.some(file => file.size < 1 || file.size > 5 * 1024 * 1024 || !/\.(pdf|step|stp|dxf|dwg|zip)$/i.test(file.name))
      || files.reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024) {
      show(text.files, 'error'); return;
    }
    const body = new FormData(form);
    body.set('csrf', token);
    body.set('language', copy[lang] ? lang : 'en');
    submitting = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    show(text.sending);
    try {
      const response = await fetch(endpoint, { method: 'POST', body, credentials: 'same-origin' });
      const result = await response.json();
      if (!response.ok || !result.ok) { show(text[result.code] || text.delivery, 'error'); return; }
      form.reset();
      available = false;
      show(text.success + result.reference, 'success');
      status.focus();
    } catch {
      show(text.delivery, 'error');
    } finally {
      submitting = false;
      form.removeAttribute('aria-busy');
      button.disabled = !available;
    }
  });
}
