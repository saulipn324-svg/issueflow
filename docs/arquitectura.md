# Arquitectura y decisiones

## Flujo completo

```mermaid
flowchart LR
  A[React / TypeScript] --> B[Proxy HTTP de Vinext]
  B --> C[Spring MVC / DTOs]
  C --> D[Servicio transaccional]
  D --> E[Spring Data JPA]
  E --> F[(H2 en archivo)]
  G[Flyway] --> F
```

En modo demo, React utiliza un adaptador de `localStorage` y no recorre este flujo. Ambos modos usan el mismo modelo y validaciones de la interfaz.

## Por qué esta estructura

- **Un monolito backend pequeño:** una sola entidad y un dominio acotado no justifican microservicios. La separación controlador/servicio/repositorio permite evolucionar sin introducir infraestructura innecesaria.
- **DTOs de entrada y salida:** los clientes no asignan `id`, fechas o versiones nuevas directamente a la entidad. El servicio controla los cambios.
- **H2 en archivo:** arranque reproducible sin depender de una base instalada. La persistencia sobrevive al reinicio del proceso.
- **Flyway y `ddl-auto: validate`:** el esquema está versionado y Hibernate comprueba que coincida; no altera tablas automáticamente.
- **Proxy de origen único:** el navegador llama a su propio servidor y no necesita CORS abierto. La URL Java se configura en el servidor, no en un campo editable por el visitante.
- **Control optimista:** `@Version` y el parámetro de versión evitan sobrescribir cambios obsoletos en actualización y eliminación.

## Responsabilidades

| Componente | Responsabilidad |
| --- | --- |
| `IssueController` | Rutas, validación de parámetros y códigos HTTP. |
| `IssueService` | Transacciones, reglas de actualización, consultas, estadísticas. |
| `IssueRepository` | Persistencia y especificaciones JPA. |
| `IssueRequest` | Validación y normalización de texto. |
| `IssueResponse` | Contrato estable de salida. |
| `ApiExceptionHandler` | Errores Problem Details y conflictos. |
| `lib/issues.ts` | Tipos y validación del frontend, adaptador de demo y cliente HTTP. |
| `app/page.tsx` | Estado visual, formularios, filtros y diálogos. |
| `app/api/backend/[...path]` | Proxy a rutas permitidas de la API, sin redirecciones y con timeout. |

## Modelo de datos

`issues`: identificador numérico, versión, título, descripción, estado, prioridad, responsable, creación y última actualización.

Los estados y prioridades son enums en Java y tipos restringidos en TypeScript. La base incluye restricciones `CHECK`. Hay índices por estado/prioridad y por fecha/ID. Las consultas usan parámetros JPA; `%` y `_` se tratan como caracteres literales en la búsqueda.

La lista se pagina en el servidor. Las estadísticas son globales. El primer criterio de ordenación es `updatedAt DESC`; el ID desempata, haciendo estable el orden.

## Errores y concurrencia

Una actualización incluye la versión que leyó el cliente. Si difiere, la API responde 409 y no aplica los cambios. También se comprueba la versión al eliminar. La columna JPA protege frente a una modificación concurrente ocurrida después de la comprobación del servicio.

La demo realiza una comprobación básica de versión al leer/escribir. `localStorage` no proporciona transacciones entre pestañas: la demo no sustituye las garantías de concurrencia de la API.

Las peticiones de listado se cancelan al cambiar filtros para evitar que una respuesta antigua reemplace resultados recientes. Los errores de almacenamiento no provocan un borrado automático.

## Límites conocidos

- Sin autenticación ni autorización; despliegue Java pensado para desarrollo local.
- Sin auditoría histórica ni relaciones entre usuarios e incidencias.
- La búsqueda usa `LIKE`; para gran volumen se evaluaría búsqueda indexada específica del motor.
- Cuatro consultas calculan las estadísticas; no representan una instantánea atómica si hay cambios simultáneos.
- No se ejecutaron pruebas de carga ni de PostgreSQL.
- Herramienta WebMCP opcional: `start_issue_creation` prepara el formulario; no guarda datos. Su disponibilidad depende del navegador.

## Evolución propuesta

Autenticación y roles, catálogo de usuarios, historial de cambios, PostgreSQL validado, observabilidad, contenedores y CI. Cada incorporación debe resolver una necesidad concreta, con sus pruebas correspondientes.
