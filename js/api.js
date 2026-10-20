const apiBaseUrl = window.location.port === "3000"
  ? ""
  : `http://${window.location.hostname}:3000`;

async function fetchApiJson(url) {
  let response;
  try {
    response = await fetch(`${apiBaseUrl}${url}`);
  } catch {
    throw new Error(
      "No se pudo conectar con la API. En Android, conecta el teléfono a la misma red Wi-Fi del computador y abre la dirección de red del computador en el puerto 3000 (http://IP-DEL-COMPUTADOR:3000). Mantén el backend ejecutándose."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      "La API devolvió una página HTML en vez de JSON. Ejecuta «node backend/server.js» y abre la aplicación desde http://localhost:3000, no con Live Server ni como archivo local."
    );
  }

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "No fue posible consultar la API.");
  }
  return result;
}
