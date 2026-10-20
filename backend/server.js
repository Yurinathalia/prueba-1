const path = require("node:path");
const net = require("node:net");
const os = require("node:os");
const express = require("express");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const projectRoot = path.resolve(__dirname, "..");
const tableName = process.env.USERS_TABLE || "Users";
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "prueba_1",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let schemaPromise;

async function loadUserSchema() {
  const databaseName = process.env.DB_NAME || "prueba_1";
  const [tables] = await pool.execute(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND LOWER(TABLE_NAME) = LOWER(?) AND TABLE_TYPE = 'BASE TABLE' LIMIT 1",
    [databaseName, tableName]
  );

  if (!tables.length) {
    throw new Error(`No se encontró la tabla "${tableName}" en la base de datos "${databaseName}".`);
  }

  const actualTableName = tables[0].TABLE_NAME;
  const [columnRows] = await pool.query(`SHOW COLUMNS FROM ${mysql.escapeId(actualTableName)}`);
  const columns = columnRows.map((column) => column.Field);

  function resolveColumn(configuredName, candidates, label) {
    const requestedName = configuredName && columns.find(
      (column) => column.toLowerCase() === configuredName.toLowerCase()
    );
    if (configuredName && !requestedName) {
      throw new Error(`La columna configurada para ${label} no existe en la tabla ${actualTableName}.`);
    }

    const foundName = requestedName || columns.find(
      (column) => candidates.includes(column.toLowerCase())
    );
    if (!foundName) {
      throw new Error(
        `No se pudo identificar la columna de ${label}. Configure ${label === "nombre" ? "USER_NAME_COLUMN" : "USER_ROLE_COLUMN"} en backend/.env.`
      );
    }
    return foundName;
  }

  return {
    table: actualTableName,
    columns,
    name: resolveColumn(process.env.USER_NAME_COLUMN, [
      "nombre", "nombres", "name", "first_name", "full_name", "fullname", "nombre_completo"
    ], "nombre"),
    role: resolveColumn(process.env.USER_ROLE_COLUMN, [
      "cargo", "puesto", "position", "job_title", "role"
    ], "cargo")
  };
}

function getUserSchema() {
  if (!schemaPromise) {
    schemaPromise = loadUserSchema().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  return schemaPromise;
}

function sendApiError(res, error) {
  console.error("Error en la API del directorio:", error);
  res.status(500).json({ error: error.message || "Error al consultar la base de datos." });
}

function isLocalDevelopmentOrigin(origin) {
  if (!origin) return false;

  let parsedOrigin;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }

  if (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") {
    return false;
  }

  const hostname = parsedOrigin.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "::1") {
    return true;
  }

  if (net.isIP(hostname) !== 4) {
    return false;
  }

  const octets = hostname.split(".").map(Number);
  return octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    octets[0] === 127;
}

function isAllowedOrigin(origin) {
  return isLocalDevelopmentOrigin(origin) || allowedOrigins.has(origin);
}

app.use("/styles", express.static(path.join(projectRoot, "styles")));
app.use("/js", express.static(path.join(projectRoot, "js")));
app.use("/assets", express.static(path.join(projectRoot, "assets")));
app.use("/pages", express.static(path.join(projectRoot, "pages")));

app.get("/manifest.webmanifest", (req, res) => {
  res.sendFile(path.join(projectRoot, "manifest.webmanifest"));
});

app.get("/sw.js", (req, res) => {
  res.set("Service-Worker-Allowed", "/");
  res.type("application/javascript");
  res.sendFile(path.join(projectRoot, "sw.js"));
});

app.use("/api", (req, res, next) => {
  const origin = req.get("Origin");
  const isAllowed = isAllowedOrigin(origin);

  if (isAllowed) {
    res.set("Access-Control-Allow-Origin", origin);
    res.vary("Origin");
  }

  if (req.method === "OPTIONS") {
    if (!isAllowed) {
      return res.sendStatus(403);
    }
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.sendStatus(204);
  }

  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(projectRoot, "index.html"));
});

app.get("/api/users", async (req, res) => {
  const search = String(req.query.q || "").trim();

  try {
    const schema = await getUserSchema();
    const table = mysql.escapeId(schema.table);
    const nameColumn = mysql.escapeId(schema.name);
    const query = search
      ? `SELECT * FROM ${table} WHERE LOWER(COALESCE(${nameColumn}, '')) LIKE LOWER(?) ORDER BY ${nameColumn}`
      : `SELECT * FROM ${table} ORDER BY ${nameColumn}`;
    const [users] = search
      ? await pool.execute(query, [`%${search}%`])
      : await pool.query(query);
    res.json({
      users,
      columns: schema.columns,
      nameColumn: schema.name,
      roleColumn: schema.role
    });
  } catch (error) {
    sendApiError(res, error);
  }
});

app.get("/api/stats/roles", async (req, res) => {
  try {
    const schema = await getUserSchema();
    const table = mysql.escapeId(schema.table);
    const roleColumn = mysql.escapeId(schema.role);
    const [roles] = await pool.execute(
      `SELECT COALESCE(NULLIF(TRIM(${roleColumn}), ''), 'Sin cargo') AS role, COUNT(*) AS count FROM ${table} GROUP BY COALESCE(NULLIF(TRIM(${roleColumn}), ''), 'Sin cargo') ORDER BY count DESC, role ASC`
    );
    const normalizedRoles = roles.map((item) => ({
      role: String(item.role),
      count: Number(item.count)
    }));
    res.json({
      roles: normalizedRoles,
      total: normalizedRoles.reduce((total, item) => total + item.count, 0)
    });
  } catch (error) {
    sendApiError(res, error);
  }
});

app.use((req, res) => {
  res.status(404).send("Página no encontrada.");
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
  console.log(`Directorio disponible en http://localhost:${port}`);
  const interfaces = Object.values(os.networkInterfaces()).flat();
  const lanAddress = interfaces.find((address) =>
    address &&
    address.family === "IPv4" &&
    !address.internal &&
    isLocalDevelopmentOrigin(`http://${address.address}`)
  );
  if (lanAddress) {
    console.log(`Acceso desde la red Wi-Fi: http://${lanAddress.address}:${port}`);
  } else {
    console.warn("No se encontró una dirección IPv4 privada para acceso desde el teléfono.");
  }
});