const bcrypt = require('bcrypt');

async function generateHash() {
  const hash = await bcrypt.hash('admin', 10);
  console.log(hash);
}

generateHash();
