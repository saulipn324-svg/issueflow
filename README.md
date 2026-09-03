# Issueflow

Gestor de incidencias de **Saul Ramos Sanchez**. Permite registrar problemas, asignar responsables, definir prioridades y seguir su resolución.

## Ejecutar con Docker

El entorno local con PostgreSQL y Docker Compose está preparado. Consulta [Docker y PostgreSQL](docs/docker.md) para configurar las contraseñas, arrancar los tres servicios y ejecutar las pruebas contra PostgreSQL. El arranque, acceso por roles y persistencia tras reiniciar fueron verificados en Docker Desktop; las 9 pruebas PostgreSQL terminaron sin fallos.

## Integración continua

[GitHub Actions](https://github.com/saulipn324-svg/issueflow/actions) ejecuta pruebas Java/PostgreSQL, pruebas de frontend, comprobación de tipos y compilación. Consulta [el flujo CI](docs/ci.md) para ver activadores y resultados.

## Qué incluye

- Inicio y cierre de sesión, roles ADMIN/USER y protección CSRF.
- Crear, consultar, editar y eliminar incidencias, con confirmación antes de eliminar.
- Estados: abierta, en progreso y resuelta. Se permite reabrir incidencias.
- Prioridades: baja, media, alta y crítica.
- Búsqueda por título, descripción y responsable; filtros combinados y paginación.
- Indicadores globales por estado y orden por última actualización.
- Validación en frontend y backend; respuestas de error estructuradas.
- Persistencia con H2 en archivo, migraciones Flyway y control de concurrencia optimista.
- Demo independiente con datos ficticios guardados en el navegador.

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

## Tecnologías

| Capa | Implementación |
| --- | --- |
| Interfaz | React 19, TypeScript, Tailwind CSS 4, componentes shadcn/Base UI |
| Servidor de interfaz | Vinext sobre Vite; proxy HTTP de origen único |
| API | Java 21, Spring Boot 3.5.16, Spring MVC, Bean Validation |
| Persistencia | Spring Data JPA / Hibernate, H2, Flyway |
| Pruebas | JUnit 5, MockMvc, AssertJ; Node Test Runner para la demo |

Spring Boot 3.5 admite Java 21. Consulta los [requisitos oficiales](https://docs.spring.io/spring-boot/3.5/system-requirements.html).

## Dos formas de ejecutarlo

**Demo local:** solo requiere el frontend. Usa `localStorage`, incluye seis ejemplos ficticios y no llama a Java. Sus datos no se comparten entre usuarios y pueden desaparecer si borras los datos del navegador. No ofrece garantías de concurrencia multiusuario.

**Aplicación completa:** el frontend envía las operaciones a Spring Boot, que guarda los datos en una base H2 en disco. Empieza sin incidencias; los ejemplos de la demo no se importan automáticamente. El indicador superior muestra el modo activo.

## Requisitos

- Node.js 24 LTS y npm.
- JDK 21 para la API y Maven 3.9.x. `JAVA_HOME` debe apuntar al directorio del JDK, no a su carpeta `bin`.
- No necesitas instalar una base de datos para empezar.

Comprueba `node --version`, `npm --version`, `java -version` y `mvn -version`.

## Inicio rápido: aplicación completa en Windows

Abre **dos terminales** en la carpeta del proyecto.

Terminal 1:

```powershell
cd backend
mvn verify
$env:ISSUEFLOW_ADMIN_PASSWORD = Read-Host 'Contraseña de admin (mínimo 12 caracteres)' -MaskInput
$env:ISSUEFLOW_USER_PASSWORD = Read-Host 'Contraseña de usuario (mínimo 12 caracteres)' -MaskInput
java -jar target/issueflow-1.0.0.jar
```

La API escucha por defecto en `http://127.0.0.1:8080`. Comprueba `http://127.0.0.1:8080/actuator/health`.

Terminal 2:

```powershell
cd frontend
npm ci
$env:ISSUEFLOW_API_BASE = 'http://127.0.0.1:8080/api'
npm run dev
```

Abre la URL que imprime Vite, normalmente `http://localhost:3000`. Debe aparecer **CONECTADO A SPRING BOOT**. Si cambias la variable, reinicia el frontend.

Para macOS/Linux, el equivalente es `ISSUEFLOW_API_BASE=http://127.0.0.1:8080/api npm run dev`.

## Inicio rápido: demo sin Java

```powershell
cd frontend
npm ci
Remove-Item Env:ISSUEFLOW_API_BASE -ErrorAction SilentlyContinue
npm run dev
```

La cabecera debe indicar **DEMO LOCAL**. Puedes restaurar los ejemplos desde el enlace bajo la tabla; se pide confirmación.

## Validación y compilación

```powershell
# En backend
mvn verify

# En frontend
npm test
npm run typecheck
npm run build
```

La compilación del frontend usa el runtime de Sites/Cloudflare. Para probar ese artefacto localmente utiliza `npm run start`; para trabajar conectado a Java, el flujo de desarrollo de arriba es el recomendado.

## Documentación

- [Integración continua](docs/ci.md)
- [Docker y PostgreSQL](docs/docker.md)
- [Seguridad y roles](docs/seguridad.md)
- [Manual de usuario](docs/manual.md)
- [Arquitectura y decisiones](docs/arquitectura.md)
- [Contrato de la API](docs/api.md)
- [OpenAPI 3.1 importable](docs/openapi.json)
- [Plan y resultados de pruebas](docs/pruebas.md)
- [Guion para presentar el proyecto](docs/presentacion.md)

El frontend incluye una guía navegable en `/guia.html` y el contrato descargable en `/openapi.json`.

## Estructura

```text
issueflow/
  backend/
    pom.xml
    src/main/java/com/saul/issueflow/
    src/main/resources/db/migration/
    src/test/java/com/saul/issueflow/
  frontend/
    app/page.tsx
    app/api/config/route.ts
    app/api/backend/[...path]/route.ts
    lib/issues.ts
    tests/issues.test.mjs
    public/
  docs/
```

## Configuración y datos

| Variable | Valor por defecto | Uso |
| --- | --- | --- |
| `ISSUEFLOW_API_BASE` | Sin definir | En el frontend; sin valor activa la demo. Con valor apunta a la API Java, incluido `/api`. |
| `PORT` | `8080` | Puerto de Spring Boot. |
| `SERVER_ADDRESS` | `127.0.0.1` | Interfaz de escucha de Spring Boot. |
| `DB_URL` | `jdbc:h2:file:./data/issueflow;DB_CLOSE_ON_EXIT=FALSE` | Conexión JDBC. |
| `DB_USERNAME` | `sa` | Usuario de la base local. |
| `DB_PASSWORD` | Vacío | Contraseña de la base local. |

Los datos están en `backend/data/` si inicias Java desde `backend`. Detén la API antes de copiar esa carpeta para hacer una copia de seguridad. No subas datos locales ni contraseñas al repositorio.

Compose configura PostgreSQL, su driver y Flyway. El perfil `mvn -Ppostgres verify` prueba la migración y el contrato con Testcontainers; su ejecución terminó con 9 pruebas aprobadas y `BUILD SUCCESS`. H2 sigue disponible para el modo local sin contenedores.

## Alcance de esta versión

Es un proyecto de portafolio para uso local y demostración. Incluye autenticación por sesión y autorización por rol. No incluye registro de usuarios, adjuntos, notificaciones ni historial de auditoría. El responsable es texto libre, no una cuenta. El backend se limita a loopback de forma predeterminada. Antes de exponerlo como servicio compartido, incorpora HTTPS, límites de intentos de acceso y uso y operaciones de respaldo.

La demo alojada no ejecuta la JVM ni demuestra persistencia del backend: muestra la interfaz y sus interacciones. El backend Java completo se entrega en el código fuente y se ejecuta con las instrucciones anteriores.

## Solución de problemas

- **JAVA_HOME incorrecto:** apunta al JDK instalado; abre otra terminal y verifica `mvn -version`.
- **La API no responde:** revisa la terminal Java y el endpoint de salud. El proxy devuelve un error visible; no cambia silenciosamente a la demo.
- **Puerto ocupado:** cambia `PORT` y ajusta `ISSUEFLOW_API_BASE`; usa la URL que imprima Vite para el frontend.
- **409 al guardar:** otra operación cambió la incidencia. Cierra el formulario, actualiza la tabla y vuelve a abrirla antes de editar.
- **Datos de demo ilegibles o almacenamiento bloqueado:** la interfaz informa el error. Restaurar ejemplos reemplaza solo los datos de Issueflow, con confirmación.
- **AccessDeniedException de Java dentro de un entorno aislado:** ejecuta `mvn verify` en tu terminal local normal. No desactives permisos o seguridad global del equipo.

## Generar el ejecutable

Ejecuta `mvn verify` desde `backend/` para generar el JAR. El binario precompilado se distribuye únicamente en el ZIP de entrega.
