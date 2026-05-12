const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  if (!MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGO_URI);
    const Recipe = mongoose.model('Recipe', new mongoose.Schema({}, { strict: false }), 'recipes');
    const query = {
      $or: [
        { image: { $exists: false } },
        { image: null },
        { image: '' }
      ]
    };
    const recipes = await Recipe.find(query, 'title _id').lean();
    console.log(`Total count: ${recipes.length}`);
    recipes.forEach(r => console.log(`ID: ${r._id}, Title: ${r.title}`));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
