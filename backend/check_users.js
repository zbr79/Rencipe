const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
async function run() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) { console.error('No MONGO_URI'); process.exit(1); }
    await mongoose.connect(mongoUri);
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    users.forEach(u => {
      console.log(JSON.stringify({
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        email: u.email,
        language: u.language,
        languageLocked: u.languageLocked,
        projectMode: u.projectMode
      }, null, 2));
    });
    console.log('\nDoes demo account exist?', users.some(u => u.username === 'demo'));
    await mongoose.connection.close();
  } catch (err) { console.error(err); process.exit(1); }
}
run();
