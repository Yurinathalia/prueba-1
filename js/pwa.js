if ("serviceWorker" in navigator && window.isSecureContext) {
  const serviceWorkerUrl = new URL("../sw.js", document.currentScript.src);
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(serviceWorkerUrl).catch((error) => {
      console.error("No se pudo registrar el service worker:", error);
    });
  });
}
