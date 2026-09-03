# Integración continua

El flujo `.github/workflows/ci.yml` comprueba Issueflow con GitHub Actions al recibir pushes a `main`, pull requests hacia `main` o una ejecución manual mediante **Actions → Issueflow CI → Run workflow**.

## Comprobaciones

| Trabajo | Entorno | Comandos |
| --- | --- | --- |
| Java 21 y PostgreSQL | Ubuntu 24.04, Temurin 21, Docker | `mvn --batch-mode --no-transfer-progress -Ppostgres verify` |
| React y TypeScript | Ubuntu 24.04, Node.js 24 | `npm ci`, `npm run typecheck`, `npm test`, `npm run build` |

El backend ejecuta 14 pruebas H2/seguridad y 9 pruebas PostgreSQL con Testcontainers. La base PostgreSQL se crea temporalmente en el runner; no se conecta con la instalación local ni con el volumen de Compose. El frontend ejecuta los 6 casos de la demo y compila el build para Workers.

Los trabajos se ejecutan en paralelo. Un fallo hace fallar el trabajo. Los resultados XML de Surefire/Failsafe se conservan durante 7 días en el artefacto `backend-test-reports`, incluso cuando una prueba falla. El flujo no publica sitios, imágenes ni paquetes.

## Permisos y credenciales

El flujo requiere únicamente lectura del código y no utiliza secretos de producción ni el archivo `.env`. Las contraseñas ficticias de las pruebas se definen dentro de los tests. Las nuevas ejecuciones de la misma rama cancelan las anteriores para evitar trabajo duplicado; cada trabajo tiene un límite de 15 minutos.

El estado verde confirma las comprobaciones de este flujo; no incluye el recorrido visual ni el reinicio del conjunto Compose, que se verificaron por separado. Para impedir merges con pruebas fallidas deben configurarse reglas de protección de rama; añadir el workflow por sí solo no las activa.

## Revisar una ejecución

Abre [Actions de Issueflow](https://github.com/saulipn324-svg/issueflow/actions), selecciona la ejecución y revisa ambos trabajos. Si falla una prueba Java, abre los logs o descarga `backend-test-reports`. Si falla una descarga de dependencias, confirma que es un problema transitorio antes de reintentar.

Referencias: [Java con Maven](https://docs.github.com/en/actions/tutorials/build-and-test-code/java-with-maven) y [Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs).
