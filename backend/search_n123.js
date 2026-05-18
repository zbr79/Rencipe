const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  process.exit(1);
}

const RecipeSchema = new mongoose.Schema({
  title: String,
  deletedAt: Date,
  trashExpiresAt: Date,
  isPublic: Boolean,
  kind: String
}, { strict: false, collection: 'recipes' });

const MealSchema = new mongoose.Schema({
  name: String,
  deletedAt: Date,
  trashExpiresAt: Date,
  isPublic: Boolean,
  kind: String,
  recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }]
}, { strict: false, collection: 'meals' });

const Recipe = mongoose.model('Recipe', RecipeSchema);
const Meal = mongoose.model('Meal', MealSchema);

async function run() {
  try {
    await mongoose.connect(mongoUri);

    const recipes = await Recipe.find({ title: /N123/i }).lean();
    const meals = await Meal.find({ name: /N123/i }).lean();

    console.log('--- Recipes ---');
    recipes.forEach(r => {
      console.log(JSON.stringify({
        collection: 'Recipe',
        id: r._id,
        title: r.title,
        deletedAt: r.deletedAt,
        trashExpiresAt: r.trashExpiresAt,
        isPublic: r.isPublic,
        kind: r.kind
      }, null, 2));
    });

    console.log('\n--- Meals ---');
    for (const m of meals) {
      const recipeIdsCount = Array.isArray(m.recipes) ? m.recipes.length : 0;
      let missingRecipes = false;

      if (Array.isArray(m.recipes)) {
        for (const rid of m.recipes) {
            if (rid) {
                const exists = await Recipe.exists({ _id: rid });
                if (!exists) {
                    missingRecipes = true;
                    break;
                }
            } else {
                missingRecipes = true;
                break;
            }
        }
      }

      console.log(JSON.stringify({
        collection: 'Meal',
        id: m._id,
        name: m.name,
        deletedAt: m.deletedAt,
        trashExpiresAt: m.trashExpiresAt,
        isPublic: m.isPublic,
        kind: m.kind,
        recipeIdsCount: recipeIdsCount,
        hasMissingRecipes: missingRecipes
      }, null, 2));
    }

  } catch (err) {

  } finally {
    await mongoose.disconnect();
  }
}

run();
