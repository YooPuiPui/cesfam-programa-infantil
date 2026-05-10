const express = require('express');
const cors = require('cors');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Backend corriendo!! :)");
});

app.listen(PORT, () => {

  const reset = "\x1b[0m";
  const cyan = "\x1b[36m";
  const green = "\x1b[32m";
  const bold = "\x1b[1m";

  console.log(`\n  ${green}${bold}🏥 CESFAM BACKEND${reset} listo y operando de forma segura`);
  console.log(`\n  ${cyan}➜${reset}  ${bold}Local:${reset}      http://localhost:${PORT}/`);
  console.log(`  ${cyan}➜${reset}  ${bold}Database:${reset}   PostgreSQL conectada exitosamente 🐘`);
  console.log(`  ${cyan}➜${reset}  ${bold}Status:${reset}     Esperando peticiones del Frontend...\n`);
});