# Seguridad de Issueflow

## Autenticación y roles

La API usa Spring Security con sesiones de servidor. `admin` tiene rol ADMIN y `usuario` tiene rol USER. Ambos consultan, crean y editan todas las incidencias del espacio compartido; solo ADMIN elimina. No existe aislamiento por propietario. El campo responsable sigue siendo texto libre.

Antes de iniciar Java, define `ISSUEFLOW_ADMIN_PASSWORD` y `ISSUEFLOW_USER_PASSWORD` con valores diferentes de al menos 12 caracteres. No hay contraseñas predeterminadas. Se aplica BCrypt con costo 12; las dos cuentas se cargan en memoria al arrancar. No se incluye registro, recuperación de contraseña ni administración de usuarios.

En PowerShell 7 puedes introducirlas sin mostrarlas en pantalla:

```powershell
$env:ISSUEFLOW_ADMIN_PASSWORD = Read-Host 'Contraseña de admin (mínimo 12 caracteres)' -MaskInput
$env:ISSUEFLOW_USER_PASSWORD = Read-Host 'Contraseña de usuario (mínimo 12 caracteres)' -MaskInput
java -jar target/issueflow-1.0.0.jar
```

Las variables deben establecerse en la terminal donde arranca Java. Spring Boot no carga archivos `.env` automáticamente. Las contraseñas incluidas en las pruebas son exclusivamente datos de prueba.

La cookie `ISSUEFLOW_SESSION` es HttpOnly y SameSite=Strict, la sesión cambia de identificador al autenticarse y caduca tras 30 minutos de inactividad. El cierre de sesión la invalida. En un despliegue HTTPS directo del backend configura `SESSION_COOKIE_SECURE=true`; el proxy aplica Secure cuando la petición entrante es HTTPS. No se guardan contraseñas ni tokens de autenticación en localStorage.

Las escrituras y el login/logout requieren un token CSRF obtenido de `/api/auth/csrf`. El cliente solicita un token antes de cada escritura; el proxy solo transmite la cookie de Issueflow y el encabezado CSRF, valida el origen y no reenvía cookies de la plataforma.

La demo alojada permite elegir un rol sin contraseña y guarda datos ficticios en este navegador. Los roles de esa demo son una simulación de interfaz, no una barrera de seguridad. El acceso real se valida en Java, cuyo despliegue externo sigue pendiente.

Antes de exponer Java a Internet faltan límites de intentos de login, HTTPS, gestión de usuarios y operación de respaldos. Esta entrega no contrata infraestructura.
