const installButton = document.querySelector("#install-app");
const installStatus = document.querySelector("#install-status");
let installPromptEvent;

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
    installButton.addEventListener("click", async () => {
      if (!installPromptEvent) {
        const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
          (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
        showInstallStatus(isIos
          ? "Para instalar en iPhone: abre esta página en Safari, toca Compartir y elige “Añadir a pantalla de inicio”."
          : "Para instalar en Android: abre esta página en Chrome, toca ⋮ y elige “Instalar aplicación” o “Añadir a pantalla de inicio”.");
        return;
      }

      const promptEvent = installPromptEvent;
      installPromptEvent = undefined;
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === "accepted") {
        installButton.hidden = true;
      } else {
        showInstallStatus("No se instaló. Puedes volver a intentarlo desde el menú del navegador.");
      }
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    if (!window.matchMedia("(max-width: 640px)").matches) return;
    event.preventDefault();
    installPromptEvent = event;
  });

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
