// scripts/createAdmin.js
const bcrypt = require('bcrypt');
const db = require('../config/db'); // your existing db connection

async function createAdmin() {
  const name = 'Admin';
  const email = 'admin@gmail.com';
  const plainPassword = 'password123@Tvet';

  const hashed = await bcrypt.hash(plainPassword, 10);

  await db.query(
    `INSERT INTO users (name, email, password, role, active_status)
     VALUES (?, ?, ?, 'admin', 'active')`,
    [name, email, hashed]
  );

  console.log('Admin created successfully');
  process.exit(0);
}

createAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});