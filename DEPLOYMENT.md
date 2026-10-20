# Publicar el directorio en GitHub Pages y Render

GitHub Pages sirve los archivos de la página, pero no ejecuta Node.js ni puede
consultar el MySQL que está en tu computador. Para que el directorio funcione
sin tener ese computador encendido, la API y la base de datos deben estar
disponibles en internet.

## Abrirlo en este PC con la base local

No necesitas publicar la API para usar el directorio desde el computador que
tiene el proyecto y MySQL:

1. Abre una terminal en la carpeta del proyecto.
2. Ejecuta `node backend/server.js` y deja esa terminal abierta.
3. En el navegador de ese PC, abre <http://localhost:3000>.

No abras el enlace de GitHub Pages para este modo: GitHub solo aloja la página,
no puede consultar directamente el MySQL local. El enlace publicado funcionará
cuando se completen los pasos de alojamiento indicados abajo.

## 1. Alojar MySQL

Una opción compatible con la base actual es el
[servicio MySQL de Railway](https://docs.railway.com/databases/mysql):

1. Crea un servicio MySQL y revisa sus [planes, límites y costos actuales](https://railway.com/pricing).
2. Migra desde tu MySQL local la base de datos y la tabla `Users` (o el nombre
   que uses). No subas un volcado SQL al repositorio ni lo compartas públicamente.
3. Habilita el acceso TCP público del servicio y guarda de forma privada el host,
   puerto, usuario, contraseña y nombre de la base de datos. Railway cobra el
   tráfico de red pública; consulta su documentación antes de habilitarlo.

Render y Railway son proveedores distintos en esta configuración; la conexión
de Render al MySQL de Railway usará el endpoint TCP público de Railway.

## 2. Desplegar la API en Render

1. En Render, crea un [Blueprint](https://render.com/docs/blueprint-spec) desde
   este repositorio y usa `render.yaml`.
2. Completa `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` con los
   datos privados del servicio MySQL remoto. El puerto puede no ser `3306`.
3. Confirma `ALLOWED_ORIGINS` como el origen exacto de GitHub Pages, sin ruta.
   El valor inicial del proyecto es `https://yurinathalia.github.io`.
4. Cuando termine el despliegue, prueba `https://<servicio>.onrender.com/health`.
   Debe responder `{"status":"ok"}`.

No guardes credenciales en archivos del repositorio, en `js/config.js` ni en
GitHub Pages.

## 3. Conectar GitHub Pages con la API

Después de conocer el dominio de Render, cambia `js/config.js` a:

```js
window.DIRECTORIO_API_URL = "https://<servicio>.onrender.com";
```

Guarda, publica ese cambio en GitHub y espera a que GitHub Pages termine de
actualizarse. La aplicación del teléfono abrirá la misma página publicada y
consultará la API de Render por HTTPS; ya no dependerá de la red Wi-Fi ni de que
tu computador esté encendido.

Si la página se publica con un dominio personalizado, actualiza también
`ALLOWED_ORIGINS` en Render con ese origen exacto y sin la ruta del sitio.

## Notas

- Esta opción mantiene la base de datos MySQL y no publica una copia de los
  datos de empleados en el repositorio.
- Las consultas necesitan internet y que la API y la base de datos alojadas
  estén disponibles. Una API gratuita puede tardar en despertar o tener límites.
- La ruta `/health` confirma que la API está activa; la carga de empleados
  también requiere que Render pueda conectarse al MySQL remoto.
