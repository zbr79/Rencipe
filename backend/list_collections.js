const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function run() {
  await mongoose.connect(mongoUri);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(collections.map(c => c.name));
  await mongoose.disconnect();
}
run();
