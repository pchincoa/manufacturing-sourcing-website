# MSP · Instalación en Hostinger

Este paquete conserva la web existente en inglés, alemán y español. El dominio configurado es https://mspsourcing.com y el buzón previsto es pedro@mspsourcing.com.

## 1. Subir los archivos

En el sitio **mspsourcing.com** de tu plan Premium, abre **File Manager** y entra en **public_html**. Sube el ZIP y extráelo ahí. El archivo `index.html` y las carpetas `en`, `de`, `es`, `assets`, `config` y `api` deben quedar directamente dentro de `public_html`, sin otra carpeta contenedora.

Si Hostinger ha creado una página de bienvenida `default.php` o `index.php`, elimina únicamente esa página de bienvenida de este sitio vacío. No modifiques carpetas de las otras webs. Activa HTTPS para el dominio y comprueba las tres versiones.

La web necesita PHP 8.1 o posterior con las extensiones estándar OpenSSL, fileinfo, ctype y filter. El paquete incluye PHPMailer 7.1.1 y su licencia: no tienes que instalar Composer.

## 2. Crear y configurar el correo

Primero crea el buzón **pedro@mspsourcing.com** desde Emails. Completa los registros de correo que indique Hostinger y comprueba que puedes enviar y recibir mensajes desde webmail.

En File Manager abre `public_html/api/private/`. Copia `mail.example.php` a **mail.php** y edita esa copia:

- `username`: dirección completa del buzón.
- `password`: contraseña del buzón, introducida directamente en Hostinger.
- `recipient`: dirección que recibirá las consultas.
- `host`, `port`, `encryption`: usa los valores que muestre tu panel de correo. La plantilla propone `smtp.hostinger.com`, `465`, `ssl`.

Guarda los cambios. No envíes la contraseña por chat ni la subas a GitHub. `mail.php` está excluido del repositorio y la carpeta privada lleva una regla que deniega el acceso web.

Mientras no exista una configuración completa, el formulario muestra que el envío no está disponible y ofrece la dirección de correo. No confirma envíos ficticios. Tener configurados esos campos tampoco garantiza que las credenciales sean correctas: hay que realizar la prueba del apartado siguiente.

## 3. Probar antes del uso comercial

1. Abre la web con HTTPS. Comprueba el menú, los idiomas y los enlaces.
2. Envía una consulta de prueba con un PDF pequeño y una dirección tuya como contacto.
3. Confirma que llega a la bandeja de MSP, con el adjunto y una referencia `MSP-…`.
4. Usa Responder y comprueba que se dirige al contacto indicado en el formulario.
5. Repite la prueba en alemán y español. Un error de SMTP debe mostrarse como error y conservar los campos.

Se aceptan hasta 3 archivos PDF, STEP/STP, DXF, DWG o ZIP, 5 MB por archivo y 10 MB en total. Los archivos se procesan temporalmente para adjuntarlos al correo; no se publican ni se guardan en una carpeta descargable. No se reenvían automáticamente a WCD. Trata los adjuntos recibidos como documentos externos y revísalos antes de abrirlos o compartirlos.

La referencia confirma que el servidor SMTP aceptó el mensaje. La entrega efectiva se comprueba en la bandeja de entrada; puede existir filtrado posterior de correo.

## 4. Antes de promocionar e indexar

Se conserva el estado `noindex` de la versión original. La información de privacidad incluida describe el flujo técnico, pero hay que completar los datos identificativos del negocio y la información legal aplicable antes de dar por finalizada la publicación comercial. No se ha inventado una dirección postal ni una entidad mercantil.

El paquete no incluye el workspace interno de inteligencia comercial ni su base de datos. Los contactos de este formulario llegan al buzón; la integración con esa base sería un cambio posterior.

## Cambios futuros

El código se conserva en una rama de GitHub para revisión. Cada actualización que quieras publicar debe trasladarse a Hostinger. Al actualizar, conserva tu `api/private/mail.php`: no viene en el ZIP ni se sobrescribe. No hay sincronización automática con el hosting.
