# Pruebas y verificación

## Resultado de esta entrega

- **Backend:** 9 pruebas JUnit/MockMvc ejecutadas correctamente con H2 en memoria y migración Flyway.
- **Demo:** 6 pruebas con Node Test Runner aprobadas.
- **TypeScript:** comprobación estática aprobada.
- **Integración HTTP real:** creación, búsqueda/filtros, validación, control de origen del proxy, actualización, conflicto de versión y eliminación verificados a través del servidor frontend conectado a Spring Boot.
- **Persistencia:** se creó una incidencia, se reinició Java, se comprobó que conservaba sus datos y versión, y se eliminó el registro de prueba.

El entorno aislado de Windows presentó `AccessDeniedException` en la resolución de rutas de Java y al cerrar archivos ZIP del compilador. Se pudo generar el JAR y ejecutar la aplicación. Las nueve pruebas se ejecutaron mediante JUnit Console sobre las clases compiladas; no se presenta `mvn verify` como aprobado en ese entorno. La ejecución alternativa terminó con 9/9 pruebas exitosas y un aviso del cargador de clases durante el cierre del contexto. En un entorno normal el comando previsto sigue siendo `mvn verify`.

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

No se ejecutaron pruebas visuales automatizadas en navegador, pruebas de carga, auditoría de accesibilidad ni pruebas contra PostgreSQL. No había un contexto WebMCP compatible disponible para validar su registro en navegador; la herramienta opcional no es necesaria para usar la aplicación.

La demo y el backend son implementaciones de persistencia diferentes: una prueba de `localStorage` no se considera una prueba de Java o de la base de datos.
