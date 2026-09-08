import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("Missing MONGO_URI");
  process.exit(1);
}

const CANONICAL = {
  noodles: "Noodles",
  vegetarian: "Vegetarian",
  vegetable: "Vegetables",
  vegetables: "Vegetables",
  vegan: "Vegan",
  fish: "Fish",
  healthy: "Healthy",
  spicy: "Spicy",
  chicken: "Chicken",
  beef: "Beef",
  pork: "Pork",
  seafood: "Seafood",
  soup: "Soup",
  rice: "Rice",
  dinner: "Dinner",
  lunch: "Lunch",
  breakfast: "Breakfast",
  quick: "Quick",
  easy: "Easy",
  dessert: "Dessert",
  curry: "Curry",
  steamed: "Steamed",
  fried: "Fried",
  sandwich: "Sandwich",
  dumplings: "Dumplings",
  tofu: "Tofu",
  family: "Family",
  egg: "Egg",
  cabbage: "Cabbage",
  duck: "Duck",
  side: "Side Dish",
};

const REMOVE = new Set(["servings", "serving"]);

function shouldRemove(tag) {
  const lower = tag.toLowerCase();
  if (REMOVE.has(lower)) return true;
  return /\d+\s*servings?/.test(lower);
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of tags) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed || shouldRemove(trimmed)) continue;
    let tag = CANONICAL[trimmed.toLowerCase()] || trimmed;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

async function main() {
  const conn = await mongoose.createConnection(uri).asPromise();
  const recipes = conn.collection("recipes");
  const all = await recipes.find({}, { projection: { title: 1, tags: 1 } }).toArray();

  let updated = 0;
  for (const recipe of all) {
    const next = normalizeTags(recipe.tags);
    const before = JSON.stringify(recipe.tags || []);
    const after = JSON.stringify(next);
    if (before !== after) {
      await recipes.updateOne({ _id: recipe._id }, { $set: { tags: next } });
      console.log(`UPDATED ${recipe.title}: [${(recipe.tags || []).join(", ")}] -> [${next.join(", ")}]`);
      updated++;
    }
  }
  console.log(`\nDone. updated=${updated} of ${all.length}`);
  await conn.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
