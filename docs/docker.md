# Issueflow con Docker y PostgreSQL

Este entorno local ejecuta tres servicios: frontend, API Java y PostgreSQL 17. No contrata alojamiento ni modifica la demo de Sites. Requiere Docker Desktop abierto en modo contenedores Linux y Docker Compose v2.

## Primer arranque

Desde la raíz del proyecto, comprueba:

```powershell
docker version
docker compose version
Copy-Item .env.example .env
```

Edita `.env`: define `DB_PASSWORD`, `ISSUEFLOW_ADMIN_PASSWORD` e `ISSUEFLOW_USER_PASSWORD` con valores distintos. Las dos contraseñas de acceso deben tener al menos 12 caracteres. Usa valores aleatorios sin `$`, comillas ni saltos de línea para evitar interpretaciones de Compose. `.env` queda excluido de Git y de las imágenes; no compartas su contenido. No vuelvas a copiar el ejemplo sobre un `.env` ya configurado.

```powershell
docker compose config --quiet
docker compose up --build --wait --wait-timeout 300
docker compose ps
```

Abre `http://localhost:3000`. Inicia sesión con `admin` o `usuario` y la contraseña correspondiente. Si 3000 está ocupado, cambia `FRONTEND_PORT=3002` antes de arrancar y abre ese puerto. El primer build descarga imágenes y dependencias y puede tardar varios minutos.

## Qué ejecuta

| Servicio | Función | Acceso |
| --- | --- | --- |
| frontend | Build de React/Vinext ejecutado con el emulador local de Workers de Wrangler | Solo `127.0.0.1:3000` por defecto |
| backend | JAR Spring Boot 3.5 / Java 21, sesión y roles | Red interna de Compose, puerto 8080 |
| db | PostgreSQL 17 y volumen `postgres-data` | Red interna de Compose, puerto 5432 |

La API espera a que PostgreSQL esté saludable; la interfaz espera a la API. Flyway crea el esquema y Hibernate lo valida. No se importa la base H2 ni los datos de la demo automáticamente. La base de datos usa una cuenta para este entorno local; no se presenta como una configuración de mínimo privilegio lista para producción.

El frontend conserva el runtime de Sites: en Docker usa Wrangler local sobre el build compilado. Es un entorno de desarrollo e integración, no una receta de hosting público. Para producción hay que definir proveedor, HTTPS, límites de acceso, gestión de secretos y usuarios, respaldos y una estrategia de ejecución compatible con Workers.

## Probar permisos y persistencia

1. Entra como `usuario`, crea una incidencia y edítala. No debe aparecer Eliminar.
2. Cierra sesión y entra como `admin`. Confirma que puedes eliminar incidencias.
3. Crea una incidencia que quieras conservar y ejecuta `docker compose restart backend db`.
4. Espera a que los servicios estén saludables, inicia sesión de nuevo y verifica el registro.
5. `docker compose down` detiene el entorno conservando el volumen; al volver a ejecutar `up` los datos siguen ahí.

Las sesiones viven en memoria de Java: reiniciar la API cierra las sesiones, pero no elimina incidencias.

## Pruebas de integración reales con PostgreSQL

Con Docker Desktop abierto, JDK 21 y Maven instalados:

```powershell
cd backend
mvn -Ppostgres verify
```

El perfil ejecuta las pruebas habituales y `PostgresIT`, que reutiliza los nueve casos de API/persistencia con un PostgreSQL temporal de Testcontainers. Valida Flyway, CRUD, filtros, paginación y concurrencia sobre PostgreSQL. No utiliza ni borra el volumen de Compose. Si Docker no está disponible, la prueba falla; no se omite silenciosamente.

El build normal de la imagen ejecuta las 14 pruebas H2/seguridad. El perfil PostgreSQL se ejecuta desde el host, porque necesita acceso al motor Docker.

## Operación y diagnóstico

```powershell
docker compose ps
docker compose logs --tail 100 backend
docker compose logs --tail 100 frontend
docker compose exec db pg_isready -U issueflow -d issueflow
docker compose down
```

No uses `down --volumes` para detener normalmente el proyecto: elimina los datos. Cambiar `DB_PASSWORD` en `.env` no cambia la contraseña de una base ya inicializada; debe rotarse también en PostgreSQL. Cambiar las contraseñas de las cuentas requiere recrear el backend con `docker compose up -d --force-recreate backend`.

Las imágenes fijan familias de versiones, pero sus etiquetas reciben actualizaciones. Para reproducibilidad binaria estricta en producción se deben registrar digests validados.

## Estado de verificación

Validado en Docker Desktop por Saul: frontend, backend y PostgreSQL saludables; acceso, roles, cierre de sesión, persistencia tras reiniciar los tres servicios y eliminación por administrador aprobados. El perfil `mvn -Ppostgres verify` completó 9 pruebas PostgreSQL sin fallos, errores ni omisiones y terminó con `BUILD SUCCESS`. Estos resultados proceden de las salidas de ejecución compartidas por el usuario.

Referencias: [orden de arranque de Compose](https://docs.docker.com/compose/how-tos/startup-order/) e [imagen oficial PostgreSQL](https://hub.docker.com/_/postgres).
