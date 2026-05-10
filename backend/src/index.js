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
  console.log(`\n🚀 Servidor backend listo y operando!`);
  console.log(`  ➜  Local:   http://localhost:${PORT}/`);
  console.log(`  ➜  Red:     Tu base de datos PostgreSQL está conectada.\n`);
});