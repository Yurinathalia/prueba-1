const installButton = document.querySelector("#install-app");
const installStatus = document.querySelector("#install-status");

function showInstallStatus(message) {
  if (!installStatus) return;
  installStatus.textContent = message;
  installStatus.hidden = false;
}

if (installButton && installStatus) {
  const isInstalled =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isInstalled) {
    installButton.hidden = true;
  } else {
    installButton.hidden = false;
    installButton.addEventListener("click", () => {
      const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
        (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
      showInstallStatus(isIos
        ? "Para instalar en iPhone: abre esta página en Safari, toca Compartir y elige “Añadir a pantalla de inicio”."
        : "En Chrome, toca ⋮ (arriba a la derecha) y elige “Instalar aplicación”. Si esa opción no aparece, toca “Añadir a pantalla de inicio”.");
    });
  }

  window.addEventListener("appinstalled", () => {
    installButton.hidden = true;
    showInstallStatus("La aplicación se instaló correctamente.");
  });
}

if ("serviceWorker" in navigator && window.isSecureContext) {
  const serviceWorkerUrl = new URL("../sw.js", document.currentScript.src);
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(serviceWorkerUrl).catch((error) => {
      console.error("No se pudo registrar el service worker:", error);
    });
  });
}
