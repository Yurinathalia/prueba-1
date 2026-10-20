const chartContainer = document.querySelector("#estadisticas-cargos");
const chartStatus = document.querySelector("#estado-estadisticas");

if (chartContainer && chartStatus) {
  async function loadRoleStatistics() {
    try {
      const result = await fetchApiJson("/api/stats/roles");

      chartContainer.replaceChildren();
      const maxCount = Math.max(...result.roles.map((item) => item.count), 0);

      for (const item of result.roles) {
        const row = document.createElement("div");
        row.className = "barra-fila";
        row.setAttribute("role", "listitem");

        const label = document.createElement("span");
        label.className = "barra-cargo";
        label.textContent = item.role;

        const track = document.createElement("div");
        track.className = "barra-fondo";
        track.setAttribute("role", "img");
        track.setAttribute("aria-label", `${item.count} usuarios`);

        const bar = document.createElement("div");
        bar.className = "barra-valor";
        bar.style.width = `${maxCount === 0 ? 0 : (item.count / maxCount) * 100}%`;
        track.append(bar);

        const count = document.createElement("span");
        count.className = "barra-cantidad";
        count.textContent = String(item.count);

        row.append(label, track, count);
        chartContainer.append(row);
      }

      chartStatus.textContent = result.roles.length
        ? `${result.total} usuario(s) en ${result.roles.length} cargo(s).`
        : "No hay usuarios registrados para mostrar.";
    } catch (error) {
      console.error("Error al cargar las estadísticas:", error);
      showApiError(chartStatus, error);
      chartStatus.classList.add("error");
    }
  }

  loadRoleStatistics();
}
