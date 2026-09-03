# Manual de usuario

## Registrar una incidencia

1. Selecciona **Nueva incidencia**.
2. Escribe un título de entre 3 y 120 caracteres.
3. Añade contexto, pasos para reproducir el problema y el resultado esperado en la descripción (hasta 4000 caracteres).
4. Define estado, prioridad y responsable. El responsable es opcional y admite 80 caracteres.
5. Selecciona **Crear incidencia**. Aparece una confirmación y se actualizan la tabla y los indicadores.

Si falla el guardado, el formulario conserva lo escrito y muestra el motivo. Los botones se deshabilitan mientras se procesa la operación.

## Consultar y filtrar

La búsqueda consulta título, descripción y responsable, sin distinguir mayúsculas. Se puede combinar con estado y prioridad. Las coincidencias de acentos son literales. El buscador no busca por número de incidencia.

La tabla muestra ocho registros por página y ordena por última actualización, del más reciente al más antiguo. Los indicadores superiores siempre representan el total global, no solo los resultados filtrados.

## Editar y resolver

Selecciona el título para abrir el detalle y después **Editar**. Cambia el estado a **En progreso** al iniciar la atención, o a **Resuelta** al terminar. También puedes volver a **Abierta** si el problema reaparece. La versión actual no restringe las transiciones.

El estado y la prioridad no son equivalentes: una incidencia puede seguir abierta con prioridad baja, o estar en progreso con prioridad crítica.

## Eliminar

En el detalle selecciona **Eliminar** y confirma. La eliminación es permanente. Si cambió la versión desde que abriste el detalle, actualiza el registro antes de intentarlo otra vez.

## Modos y persistencia

- **DEMO LOCAL:** datos ficticios en este navegador. No se envían a Java ni a otros visitantes. Restaurar ejemplos reemplaza todos los datos de la demo, previa confirmación.
- **CONECTADO A SPRING BOOT:** datos en el backend y su base de datos. La demo y la API tienen registros independientes.

Las fechas se muestran en UTC para mantener un criterio consistente. La interfaz se adapta a pantallas pequeñas; la tabla se puede desplazar horizontalmente. Los formularios y diálogos ofrecen etiquetas y acciones accesibles por teclado.

## Acceso al espacio

En la demo, elige Administrador o Usuario. El administrador puede eliminar y restaurar ejemplos; el usuario conserva las funciones de consulta, creación y edición. Usa Cerrar sesión para volver al selector. La selección de rol no se conserva al recargar la demo.

Con Java configurado aparece un formulario de usuario y contraseña. Usa las cuentas configuradas al arrancar el backend. Al recargar se recupera la sesión vigente. Si caduca, se vuelve al acceso. Una operación rechazada no se repite automáticamente.
