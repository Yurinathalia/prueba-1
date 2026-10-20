const searchForm = document.querySelector("#form-busqueda");
const searchInput = document.querySelector("#busqueda-nombre");
const searchStatus = document.querySelector("#estado-busqueda");
const resultsContainer = document.querySelector("#resultados-usuarios");

if (searchForm && searchInput && searchStatus && resultsContainer) {
  let debounceTimer;
  let activeRequest = 0;

  function formatFieldName(field) {
    return field
      .replace(/[_-]+/g, " ")
      .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, "$1 $2")
      .replace(/^./, (firstLetter) => firstLetter.toLocaleUpperCase("es"));
  }

  function formatFieldValue(value) {
    if (value === null || value === undefined || value === "") {
      return "Sin dato";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  function showResults(users, columns, nameColumn) {
    resultsContainer.replaceChildren();

    for (const user of users) {
      const card = document.createElement("article");
      card.className = "usuario-card";

      const name = document.createElement("h2");
      name.textContent = formatFieldValue(user[nameColumn]);
      card.append(name);

      const details = document.createElement("dl");
      details.className = "usuario-datos";
      for (const column of columns) {
        if (column === nameColumn) continue;

        const label = document.createElement("dt");
        label.textContent = formatFieldName(column);

        const value = document.createElement("dd");
        value.textContent = formatFieldValue(user[column]);

        details.append(label, value);
      }

      card.append(details);
      resultsContainer.append(card);
    }
  }

  async function searchUsers() {
    const name = searchInput.value.trim();
    const requestId = ++activeRequest;
    resultsContainer.replaceChildren();
    searchStatus.classList.remove("error");

    searchStatus.textContent = name
      ? "Buscando usuarios…"
      : "Cargando todos los usuarios…";

    try {
      const query = name ? `?q=${encodeURIComponent(name)}` : "";
      const result = await fetchApiJson(`/api/users${query}`);
      if (requestId !== activeRequest) return;

      showResults(result.users, result.columns, result.nameColumn);
      searchStatus.textContent = name
        ? result.users.length
          ? `${result.users.length} usuario(s) encontrado(s).`
          : "No se encontraron usuarios con ese nombre."
        : `${result.users.length} usuario(s) en el directorio.`;
    } catch (error) {
      if (requestId !== activeRequest) return;
      console.error("Error al buscar usuarios:", error);
      searchStatus.textContent = error.message || "No fue posible consultar los usuarios.";
      searchStatus.classList.add("error");
    }
  }

  searchInput.addEventListener("input", () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(searchUsers, 250);
  });

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    window.clearTimeout(debounceTimer);
    searchUsers();
  });

  searchUsers();
}