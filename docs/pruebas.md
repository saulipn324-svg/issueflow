# Pruebas y verificación

## Resultado de esta entrega

- **Backend:** 14 pruebas JUnit/MockMvc ejecutadas correctamente con H2 en memoria y migración Flyway.
- **PostgreSQL:** 9 pruebas PostgresIT aprobadas, 0 fallos, 0 errores y 0 omitidas; `mvn -Ppostgres verify` terminó con `BUILD SUCCESS`, según la salida compartida por Saul el 2 de septiembre de 2026.
- **Docker Compose:** los tres servicios quedaron saludables; el script verificó login, roles, cierre de sesión, persistencia tras reinicio y eliminación por ADMIN. Saul confirmó además el acceso con ambas cuentas.
- **Demo:** 6 pruebas con Node Test Runner aprobadas.
- **TypeScript:** comprobación estática aprobada.
- **Integración HTTP real:** creación, búsqueda/filtros, validación, control de origen del proxy, actualización, conflicto de versión y eliminación verificados a través del servidor frontend conectado a Spring Boot.
- **Persistencia:** se creó una incidencia, se reinició Java, se comprobó que conservaba sus datos y versión, y se eliminó el registro de prueba.

El entorno aislado de Windows presentó `AccessDeniedException` en la resolución de rutas de Java y al cerrar archivos ZIP del compilador. Se pudo generar el JAR y ejecutar la aplicación. Las catorce pruebas se ejecutaron mediante JUnit Console sobre las clases compiladas; no se presenta `mvn verify` como aprobado en ese entorno. La ejecución alternativa terminó con 14/14 pruebas exitosas y un aviso del cargador de clases durante el cierre del contexto. En un entorno normal el comando previsto sigue siendo `mvn verify`.

## Cobertura de los casos

| Área | Casos |
| --- | --- |
| CRUD API | Creación, detalle, actualización, eliminación, ID inexistente. |
| Validaciones | Título vacío/corto, descripción larga, enum inválido, paginación inválida. |
| Consultas | Búsqueda sin distinguir mayúsculas, `%` literal, prioridad y estado, paginación. |
| Concurrencia | Versión obligatoria y rechazo de cambios/eliminaciones obsoletos. |
| Estadísticas | Totales después de resolver y eliminar. |
| Salud | Endpoint disponible sin detalles internos. |
| Demo | CRUD persistido, versiones, filtros, datos corruptos, lista vacía, validación. |

## Cómo repetirlas

```powershell
# backend/
mvn verify

# frontend/
npm test
npm run typecheck
npm run build
```

## Recorrido manual recomendado

1. Crear una incidencia y confirmar que aparece.
2. Recargar y comprobar persistencia según el modo.
3. Filtrar por prioridad y buscar por responsable.
4. Editar el estado a resuelta y comprobar los indicadores.
5. Cancelar una eliminación; después confirmar otra.
6. En modo Java, detener la API y comprobar el mensaje de conexión.
7. Revisar el flujo por teclado y en una pantalla móvil.

## Límites de validación

No se ejecutaron pruebas visuales automatizadas en navegador, pruebas de carga, auditoría de accesibilidad . No había un contexto WebMCP compatible disponible para validar su registro en navegador; la herramienta opcional no es necesaria para usar la aplicación.

La demo y el backend son implementaciones de persistencia diferentes: una prueba de `localStorage` no se considera una prueba de Java o de la base de datos.

## Seguridad verificada

Se ejecutaron cinco pruebas adicionales de Spring Security: rechazo anónimo, contraseña incorrecta y CSRF ausente, permisos DELETE por rol, creación/edición con USER, y login real con rotación e invalidación de sesión. Además se comprobó por HTTP el recorrido proxy → Java, las cookies, los roles y el cierre de sesión. El resultado no implica pruebas de carga ni resistencia a fuerza bruta.

## Docker y PostgreSQL

Docker Compose y PostgresIT fueron ejecutados por Saul en su PowerShell local y sus resultados se incorporan como evidencia aportada por el usuario. PostgresIT completó 9 casos en 21.09 segundos; el comando Maven completo terminó en 1:23 min. Las comprobaciones de Docker y PostgreSQL son independientes de las 14 pruebas H2/seguridad.

## Automatización

El workflow Issueflow CI repite las pruebas en GitHub Actions. El resultado local no se presenta como una ejecución aprobada en GitHub: el estado de cada ejecución se consulta en Actions. Consulta [CI](ci.md).
