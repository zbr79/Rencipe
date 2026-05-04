const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const ITERATIONS = 12000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";
const PRIVATE_TITLES = ["Admin Private XO Sauce Lobster", "Admin Private Sichuan Pepper Chicken"];

dotenv.config({ path: path.join(__dirname, "..", ".env") });

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return { salt, hash };
}

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["admin", "user"], default: "user", required: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
  },
  { timestamps: true }
);

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titlePinyin: String,
    titleFirstLetters: String,
    description: { type: String, required: true, trim: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    image: String,
    component: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    mainIngredients: [{ name: String, quantity: String }],
    seasonings: [{ name: String, quantity: String }],
    steps: [{ stepNumber: Number, instruction: String, image: String }],
    servings: Number,
    tags: [String],
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Recipe = mongoose.models.Recipe || mongoose.model("Recipe", recipeSchema);

function searchText(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

async function upsertUser({ username, password, displayName, email, phone, role }) {
  const { salt, hash } = hashPassword(password);
  return User.findOneAndUpdate(
    { username },
    { username, displayName, email, phone, role, passwordSalt: salt, passwordHash: hash },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
}

function privateRecipe({ title, description, image, mainIngredients, seasonings, steps, tags }) {
  return {
    title,
    titlePinyin: searchText(title),
    titleFirstLetters: title.split(/\s+/).map((word) => word[0].toLowerCase()).join(""),
    description,
    image,
    component: false,
    isPublic: false,
    mainIngredients,
    seasonings,
    steps: steps.map((instruction, index) => ({ stepNumber: index + 1, instruction })),
    servings: 2,
    tags,
    likes: 0,
    views: 0,
    ratingAverage: 0,
    ratingCount: 0,
  };
}

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Set it in backend/.env before setup.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const admin = await upsertUser({
    username: "admin",
    password: "admin",
    displayName: "admin",
    email: "admin@rencipe.demo",
    phone: "(555) 010-0001",
    role: "admin",
  });
  const testUser = await upsertUser({
    username: "testuser1",
    password: "testuser1",
    displayName: "Test User 1",
    email: "testuser1@rencipe.demo",
    phone: "(555) 010-0002",
    role: "user",
  });

  const publishResult = await Recipe.updateMany(
    { title: { $nin: PRIVATE_TITLES } },
    { $set: { isPublic: true, authorId: admin._id } }
  );

  const privateSeeds = [
    privateRecipe({
      title: PRIVATE_TITLES[0],
      description: "Admin-only Cantonese seafood recipe used to verify private search visibility.",
      image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=1200&q=80",
      mainIngredients: [
        { name: "Lobster tails", quantity: "2" },
        { name: "Egg noodles", quantity: "300g" },
      ],
      seasonings: [
        { name: "XO sauce", quantity: "3 tbsp" },
        { name: "Ginger", quantity: "20g" },
      ],
      steps: ["Blanch lobster until just cooked.", "Stir-fry noodles with XO sauce and ginger.", "Toss lobster through the noodles and serve hot."],
      tags: ["Private", "Cantonese", "Seafood", "Admin Draft"],
    }),
    privateRecipe({
      title: PRIVATE_TITLES[1],
      description: "Admin-only spicy Sichuan chicken recipe used to verify private search visibility.",
      image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=1200&q=80",
      mainIngredients: [
        { name: "Chicken thighs", quantity: "600g" },
        { name: "Dried chilies", quantity: "16" },
      ],
      seasonings: [
        { name: "Sichuan peppercorn", quantity: "1 tbsp" },
        { name: "Chili oil", quantity: "2 tbsp" },
      ],
      steps: ["Marinate chicken pieces.", "Bloom chilies and peppercorn in hot oil.", "Stir-fry chicken until glossy and spicy."],
      tags: ["Private", "Sichuan", "Spicy", "Admin Draft"],
    }),
  ];

  for (const recipe of privateSeeds) {
    await Recipe.findOneAndUpdate(
      { title: recipe.title },
      { ...recipe, authorId: admin._id },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  const [totalRecipes, publicRecipes, privateRecipes] = await Promise.all([
    Recipe.countDocuments(),
    Recipe.countDocuments({ isPublic: true }),
    Recipe.countDocuments({ isPublic: false }),
  ]);

  console.log(`Admin ready: ${admin.username}/admin (${admin._id})`);
  console.log(`Test user ready: ${testUser.username}/testuser1 (${testUser._id})`);
  console.log(`Published existing recipes: ${publishResult.modifiedCount}`);
  console.log(`Total recipes: ${totalRecipes}`);
  console.log(`Public recipes: ${publicRecipes}`);
  console.log(`Private recipes: ${privateRecipes}`);
  console.log(`Private demo titles: ${PRIVATE_TITLES.join(", ")}`);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
