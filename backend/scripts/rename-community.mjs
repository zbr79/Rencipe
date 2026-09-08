import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);

  const users = mongoose.connection.collection("users");
  const recipes = mongoose.connection.collection("recipes");

  const userResult = await users.updateMany({ displayName: "Rencipe Community" }, { $set: { displayName: "Rencipe" } });
  const recipeResult = await recipes.updateMany({ sharedSource: "Rencipe Community" }, { $set: { sharedSource: "Rencipe" } });

  console.log(`Users updated: ${userResult.modifiedCount}`);
  console.log(`Recipes updated: ${recipeResult.modifiedCount}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});