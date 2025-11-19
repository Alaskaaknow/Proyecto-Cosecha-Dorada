// backend/seed.js
const pool = require("./db");
const bcrypt = require("bcryptjs");

async function seed() {
  const username = "operador";
  const plain = "Secreto123";
  const role = "operador";
  const hash = await bcrypt.hash(plain, 10);

  try {
    const [res] = await pool.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", [username, hash, role]);
    console.log("Usuario creado:", res.insertId);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
