# API de Issueflow

Base local: `http://127.0.0.1:8080/api`. JSON UTF-8. La API no usa autenticación en esta versión local.

## Endpoints

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/issues` | Lista paginada, 200. |
| GET | `/issues/{id}` | Detalle, 200 o 404. |
| POST | `/issues` | Crea, 201 con cabecera `Location`. |
| PUT | `/issues/{id}` | Reemplaza campos editables, 200; requiere versión. |
| DELETE | `/issues/{id}?version=0` | Elimina, 204; requiere versión. |
| GET | `/stats` | Totales globales, 200. |
| GET | `/actuator/health` | Salud; ruta fuera del prefijo `/api`. |

## Lista

Parámetros opcionales: `q` (hasta 120 caracteres), `status`, `priority`, `page` (desde 0), `size` (1–100; por defecto 10). Estados: `OPEN`, `IN_PROGRESS`, `RESOLVED`. Prioridades: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

```text
GET /api/issues?q=reporte&status=OPEN&priority=HIGH&page=0&size=8
```

```json
{
  "content": [],
  "page": 0,
  "size": 8,
  "totalElements": 0,
  "totalPages": 0
}
```

## Crear

```json
{
  "title": "Error al generar el reporte",
  "description": "Al seleccionar Descargar, la solicitud devuelve un error.",
  "status": "OPEN",
  "priority": "HIGH",
  "assignee": "Saul Ramos"
}
```

Todos esos campos deben estar presentes. Descripción y responsable pueden ser cadenas vacías. Se recortan espacios exteriores antes de validar. El título admite 3–120 caracteres, descripción 4000 y responsable 80. `id`, fechas y versión inicial son generados por el servidor.

## Actualizar

Envía los mismos campos e incluye `version` con el valor de la última lectura. No sumes la versión en el cliente.

```json
{
  "title": "Error al generar el reporte",
  "description": "Se corrigió la validación y se verificó la descarga.",
  "status": "RESOLVED",
  "priority": "HIGH",
  "assignee": "Saul Ramos",
  "version": 0
}
```

La respuesta incluye `id`, `version`, todos los campos editables y fechas ISO-8601 UTC. La versión aumenta cuando se modifica la entidad; un reemplazo idéntico puede conservarla.

## Ejemplo en PowerShell

```powershell
$base = 'http://127.0.0.1:8080/api'
$body = @{
  title = 'Error al generar el reporte'
  description = 'La descarga no se inicia.'
  status = 'OPEN'
  priority = 'HIGH'
  assignee = 'Saul Ramos'
} | ConvertTo-Json
$issue = Invoke-RestMethod "$base/issues" -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
Invoke-RestMethod "$base/issues/$($issue.id)"
Invoke-RestMethod "$base/stats"
# Cuando quieras eliminar el registro creado en este ejemplo:
Invoke-RestMethod "$base/issues/$($issue.id)?version=$($issue.version)" -Method Delete
```

## Errores

| Código | Causa |
| --- | --- |
| 400 | Validación, enum desconocido, JSON inválido, paginación inválida o versión ausente. |
| 404 | ID inexistente. |
| 409 | Versión obsoleta o modificación concurrente. |
| 502 | Solo el proxy frontend: backend inaccesible o timeout. |
| 503 | Solo el proxy frontend: API Java no configurada en modo demo. |

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Revisa los campos de la incidencia.",
  "errors": { "title": "size must be between 3 and 120" }
}
```

El mapa `errors` corresponde a la validación del cuerpo. Los mensajes de Bean Validation pueden depender del idioma del entorno. No se devuelven trazas de excepción.

El contrato [openapi.json](openapi.json) se puede importar en Postman o en un visor compatible con OpenAPI 3.1.
