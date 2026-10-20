const configuredApiBaseUrl = window.DIRECTORIO_API_URL?.trim();

function getApiBaseUrl() {
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl.replace(/\/+$/, "");
  }

  if (window.location.port === "3000") {
    return window.location.origin;
  }

  if (window.location.hostname.endsWith(".github.io")) {
    throw new Error(
      "Esto no depende de que uses PC o teléfono: el enlace de GitHub Pages solo contiene la página. Para abrir el directorio en este PC con su base de datos local, ejecuta «node backend/server.js» desde la carpeta del proyecto y entra a http://localhost:3000. El enlace de GitHub funcionará cuando se configure una API alojada en internet."
    );
  }

  return `http://${window.location.hostname}:3000`;
}

async function fetchApiJson(url) {
  const apiBaseUrl = getApiBaseUrl();
  const requestUrl = new URL(url, `${apiBaseUrl}/`);
  let response;
  try {
    response = await fetch(requestUrl);
  } catch {
    const guidance = configuredApiBaseUrl
      ? "Verifica que el backend esté activo, que js/config.js tenga su URL HTTPS y que ALLOWED_ORIGINS incluya el origen de GitHub Pages."
      : "Para usar el PC, ejecuta «node backend/server.js» desde la carpeta del proyecto y abre http://localhost:3000. Para usar otro dispositivo, ambos deben poder comunicarse con el PC por la red.";
    throw new Error(
      `No se pudo conectar con la API en ${requestUrl.origin}. ${guidance}`
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      `La dirección ${requestUrl.origin} no devolvió JSON. Verifica que js/config.js apunte al backend y no a la página de GitHub.`
    );
  }

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "No fue posible consultar la API.");
  }
  return result;
}
