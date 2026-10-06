const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log('Password hash:');
  console.log(hash);
}

hashPassword('123456');
