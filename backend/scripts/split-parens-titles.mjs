import mongoose from "mongoose";
import dotenv from "dotenv";
import RecipeModule from "../dist/models/Recipe.js";

const Recipe = RecipeModule.default || RecipeModule;

dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const PARENS_PATTERN = /^(.*?)\s*\((.*)\)\s*$/;

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);

  const recipes = await Recipe.find({});
  let split = 0;
  for (const recipe of recipes) {
    const match = PARENS_PATTERN.exec(recipe.title || "");
    if (!match) continue;
    const primary = match[1].trim();
    const secondary = match[2].trim();
    if (!primary || !secondary) continue;
    recipe.title = primary;
    recipe.subtitle = secondary;
    await recipe.save();
    split++;
    console.log(`  ${primary} | ${secondary}`);
  }
  console.log(`Split ${split} recipes: primary name + second name.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});