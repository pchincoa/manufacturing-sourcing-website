# Validación del paquete para Hostinger

Fecha: 26 de octubre de 2026.

- Sintaxis PHP de la aplicación y PHPMailer: comprobada con PHP 8.3.
- Sintaxis JavaScript y enlaces internos: comprobados.
- Páginas en alemán, inglés y español: comprobadas por HTTP.
- Vista del formulario revisada en navegador.
- Endpoint sin configuración: indica que el envío no está disponible.
- Prueba de integración con servidor SMTP TLS local: mensaje y PDF aceptados, destinatario y Reply-To correctos.
- Repetición de una solicitud ya aceptada: no duplica el mensaje.
- Credenciales/configuración de prueba: eliminadas y excluidas del ZIP.
- Rechazo SMTP: devuelve error sin afirmar que la consulta se envió.
- Se han comprobado origen, CSRF, campos requeridos, consentimiento, honeypot, extensiones y contenido de los adjuntos.

No se han enviado correos a destinatarios externos. La entrega real en Hostinger requiere configurar el buzón y realizar una prueba en la instalación. Las reglas Apache y los límites PHP deben verificarse en ese hosting. El estado noindex se conserva hasta completar la revisión comercial y los datos legales del sitio.

Dependencia incluida: PHPMailer 7.1.1, descargada de la etiqueta oficial v7.1.1 del repositorio PHPMailer/PHPMailer, con sus fuentes y licencia LGPL-2.1.
