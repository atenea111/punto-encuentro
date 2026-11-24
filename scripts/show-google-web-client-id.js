/**
 * Muestra el Web Client ID desde google-services.json (client_type 3).
 * Uso: node scripts/show-google-web-client-id.js
 */
const fs = require("fs")
const path = require("path")

const jsonPath = path.join(__dirname, "..", "android", "app", "google-services.json")

if (!fs.existsSync(jsonPath)) {
  console.error("No se encontró android/app/google-services.json")
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"))
const clients = data.client?.[0]?.oauth_client ?? []
const webClient = clients.find((client) => client.client_type === 3)

if (!webClient?.client_id) {
  console.error("No hay oauth_client web (client_type 3) en google-services.json")
  console.error("Creá un Web Client ID en Firebase/Google Cloud y volvé a descargar el archivo.")
  process.exit(1)
}

console.log(webClient.client_id)
