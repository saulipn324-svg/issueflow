# Cómo presentar Issueflow en una entrevista

## Resumen de 30 segundos

«Issueflow es un gestor de incidencias que desarrollé con React y TypeScript en la interfaz, y Java con Spring Boot en el backend. Implementé CRUD, filtros, paginación, validación y persistencia con migraciones. También contemplé conflictos de edición mediante versiones optimistas y pruebas de la API.»

## Demostración de cinco minutos

1. Aclara si muestras la demo de navegador o la aplicación conectada a Java.
2. Crea una incidencia con prioridad alta y responsable.
3. Encuéntrala con el buscador y el filtro de prioridad.
4. Ábrela, cambia su estado y explica cómo se actualizan los indicadores.
5. Muestra un error de validación y la confirmación de eliminación.
6. Abre el contrato OpenAPI y explica la respuesta 409.

## Decisiones que puedes defender

- Un solo servicio es suficiente para este alcance; no lo presentes como arquitectura de microservicios.
- Los DTOs separan el contrato de la entidad de persistencia.
- Flyway mantiene el esquema reproducible.
- La validación del frontend ayuda al usuario, pero la del backend es la autoridad.
- `@Version` protege frente a cambios perdidos entre clientes.
- Una demo local facilita explorar la interfaz, pero no prueba por sí misma la ejecución del backend.

## Qué estudiar en el código

Sigue una creación desde el formulario hasta `IssueController`, `IssueService`, `IssueRepository` y la tabla SQL. Después reproduce una edición obsoleta para entender la concurrencia optimista. Usa las pruebas como ejemplos ejecutables, y adapta este guion a lo que puedas explicar con seguridad.

## Siguiente entrega razonable

Añadir gestión de usuarios y responsables vinculados a cuentas, validar PostgreSQL y automatizar las comprobaciones en CI. Evita afirmar que esas capacidades ya están implementadas.

## Demostrar permisos

Entra como usuario, crea y edita una incidencia. Explica por qué no aparece Eliminar. Después entra como administrador y elimínala. Enseña SecurityTest: una petición DELETE directa con rol USER obtiene 403 aunque se manipule la interfaz. Explica la diferencia entre sesión de servidor, CSRF y una simulación local de roles.
