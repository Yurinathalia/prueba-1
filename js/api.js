const configuredApiBaseUrl = window.DIRECTORIO_API_URL?.trim();

function getApiBaseUrl() {
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl.replace(/\/+$/, "");
  }

  if (window.location.port === "3000") {
    return window.location.origin;
  }

  if (window.location.hostname.endsWith(".github.io")) {
    throw new Error("La página publicada no está conectada a la base de datos.");
  }

  return `http://${window.location.hostname}:3000`;
}

function showApiError(container, error) {
  if (window.location.hostname.endsWith(".github.io") && !configuredApiBaseUrl) {
    container.replaceChildren(
      document.createTextNode(
        "Para ver los datos ahora, conecta el teléfono a la misma Wi-Fi del PC y abre "
      )
    );
    const localAppLink = document.createElement("a");
    localAppLink.href = "http://10.250.108.80:3000/";
    localAppLink.textContent = "el directorio en la red local";
    container.append(
      localAppLink,
      document.createTextNode(
        ". El PC debe permanecer encendido con el servidor activo."
      )
    );
    return;
  }

  container.textContent = error.message || "No fue posible consultar los datos.";
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
