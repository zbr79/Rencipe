const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const ITERATIONS = 12000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

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
    isPublic: { type: Boolean, default: true },
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
const Cart = mongoose.models.CartSeed || mongoose.model("CartSeed", new mongoose.Schema({}, { strict: false, collection: "carts" }));
const Favorite = mongoose.models.FavoriteSeed || mongoose.model("FavoriteSeed", new mongoose.Schema({}, { strict: false, collection: "favorites" }));
const MealPlan = mongoose.models.MealPlanSeed || mongoose.model("MealPlanSeed", new mongoose.Schema({}, { strict: false, collection: "mealplans" }));

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return { salt, hash };
}

async function upsertUser({ username, password, displayName, email, phone, role }) {
  const { salt, hash } = hashPassword(password);
  return User.findOneAndUpdate(
    { username },
    { username, displayName, email, phone, role, passwordSalt: salt, passwordHash: hash },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
}

function searchText(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function firstLetters(title) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toLowerCase())
    .join("");
}

const imageByTheme = {
  dimSum: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80",
  chicken: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1200&q=80",
  fish: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
  pork: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
  noodles: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
  rice: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
  soup: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
  tofu: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80",
  seafood: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=1200&q=80",
  korean: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1200&q=80",
  spicy: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=1200&q=80",
  vegetables: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
  dessert: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=1200&q=80",
};

function recipe(input) {
  const viewCount = typeof input.views === "number" ? 10 + (input.views % 16) : 0;
  return {
    title: input.title,
    titlePinyin: searchText(input.title),
    titleFirstLetters: firstLetters(input.title),
    description: input.description,
    image: input.image || imageByTheme[input.theme || "rice"],
    component: Boolean(input.component),
    isPublic: true,
    mainIngredients: input.mainIngredients,
    seasonings: input.seasonings,
    steps: input.steps.map((instruction, index) => ({ stepNumber: index + 1, instruction })),
    servings: input.servings || 4,
    tags: input.tags,
    likes: input.likes || 0,
    views: viewCount,
    ratingAverage: input.ratingAverage || 0,
    ratingCount: input.ratingCount || 0,
  };
}

const asianRecipes = [
  recipe({
    title: "Cantonese White Cut Chicken",
    description: "Poached chicken served with ginger scallion oil, a classic Cantonese dinner centerpiece.",
    theme: "chicken",
    mainIngredients: [{ name: "Whole chicken", quantity: "1" }, { name: "Ginger", quantity: "60g" }, { name: "Scallions", quantity: "6" }],
    seasonings: [{ name: "Salt", quantity: "2 tsp" }, { name: "Neutral oil", quantity: "4 tbsp" }],
    steps: ["Poach the chicken gently until cooked through.", "Rest, chop, and keep the skin glossy.", "Spoon hot ginger scallion oil over the chicken."],
    tags: ["Cantonese", "Chinese", "Chicken", "Dinner"],
    likes: 28,
    views: 180,
    ratingAverage: 4.9,
    ratingCount: 16,
  }),
  recipe({
    title: "Soy Sauce Chicken",
    description: "Cantonese soy-braised chicken with glossy skin and a sweet-savory aroma.",
    theme: "chicken",
    mainIngredients: [{ name: "Chicken legs", quantity: "6" }, { name: "Ginger", quantity: "40g" }],
    seasonings: [{ name: "Light soy sauce", quantity: "120ml" }, { name: "Dark soy sauce", quantity: "2 tbsp" }, { name: "Rock sugar", quantity: "25g" }],
    steps: ["Simmer soy sauce, ginger, and sugar into a braising liquid.", "Braise chicken until tender.", "Rest, slice, and spoon sauce over the top."],
    tags: ["Cantonese", "Chinese", "Chicken", "Family dinner"],
    likes: 22,
    views: 143,
    ratingAverage: 4.7,
    ratingCount: 11,
  }),
  recipe({
    title: "Cantonese Steamed Fish",
    description: "Whole fish steamed with ginger, scallions, and hot soy oil for a light seafood main.",
    theme: "fish",
    mainIngredients: [{ name: "Whole fish", quantity: "1" }, { name: "Ginger", quantity: "30g" }, { name: "Scallions", quantity: "4" }],
    seasonings: [{ name: "Soy sauce", quantity: "3 tbsp" }, { name: "Hot oil", quantity: "2 tbsp" }],
    steps: ["Steam fish until just opaque.", "Top with ginger and scallions.", "Pour over hot oil and soy sauce."],
    tags: ["Cantonese", "Chinese", "Seafood", "Healthy"],
    likes: 31,
    views: 201,
    ratingAverage: 4.9,
    ratingCount: 18,
  }),
  recipe({
    title: "Char Siu Pork",
    description: "Cantonese barbecue pork with honey glaze, red bean curd, and roasted edges.",
    theme: "pork",
    mainIngredients: [{ name: "Pork shoulder", quantity: "900g" }, { name: "Honey", quantity: "3 tbsp" }],
    seasonings: [{ name: "Hoisin sauce", quantity: "3 tbsp" }, { name: "Soy sauce", quantity: "2 tbsp" }, { name: "Five-spice", quantity: "1 tsp" }],
    steps: ["Marinate pork overnight.", "Roast and baste until lacquered.", "Slice thinly for rice plates or noodles."],
    tags: ["Cantonese", "Chinese", "Pork", "Rice"],
    likes: 35,
    views: 225,
    ratingAverage: 4.9,
    ratingCount: 21,
  }),
  recipe({
    title: "Beef Chow Fun",
    description: "Wok-seared rice noodles with beef, bean sprouts, scallions, and soy sauce.",
    theme: "noodles",
    mainIngredients: [{ name: "Fresh rice noodles", quantity: "600g" }, { name: "Beef flank", quantity: "350g" }, { name: "Bean sprouts", quantity: "200g" }],
    seasonings: [{ name: "Soy sauce", quantity: "3 tbsp" }, { name: "Shaoxing wine", quantity: "1 tbsp" }],
    steps: ["Marinate sliced beef briefly.", "Sear beef over high heat.", "Toss noodles, sprouts, and sauce until smoky."],
    tags: ["Cantonese", "Chinese", "Noodles", "Quick"],
    likes: 26,
    views: 166,
    ratingAverage: 4.8,
    ratingCount: 14,
  }),
  recipe({
    title: "Clay Pot Rice with Lap Cheong",
    description: "Crispy-bottomed rice cooked with Cantonese sausage, mushrooms, and soy drizzle.",
    theme: "rice",
    mainIngredients: [{ name: "Jasmine rice", quantity: "2 cups" }, { name: "Lap cheong", quantity: "3 links" }, { name: "Shiitake mushrooms", quantity: "120g" }],
    seasonings: [{ name: "Soy sauce", quantity: "2 tbsp" }, { name: "Sesame oil", quantity: "1 tsp" }],
    steps: ["Par-cook rice in a clay pot.", "Add sausage and mushrooms on top.", "Finish until the bottom forms a crisp crust."],
    tags: ["Cantonese", "Chinese", "Rice", "Dinner"],
    likes: 19,
    views: 119,
    ratingAverage: 4.6,
    ratingCount: 9,
  }),
  recipe({
    title: "Wonton Noodle Soup",
    description: "Thin egg noodles with shrimp-pork wontons in a clear Cantonese broth.",
    theme: "soup",
    mainIngredients: [{ name: "Egg noodles", quantity: "400g" }, { name: "Shrimp", quantity: "250g" }, { name: "Ground pork", quantity: "250g" }],
    seasonings: [{ name: "White pepper", quantity: "1 tsp" }, { name: "Chicken broth", quantity: "1.5L" }],
    steps: ["Fold shrimp-pork wontons.", "Simmer broth and cook noodles separately.", "Assemble with wontons and greens."],
    tags: ["Cantonese", "Chinese", "Noodles", "Soup"],
    likes: 24,
    views: 156,
    ratingAverage: 4.8,
    ratingCount: 12,
  }),
  recipe({
    title: "Har Gow Shrimp Dumplings",
    description: "Translucent Cantonese shrimp dumplings with bouncy filling.",
    theme: "dimSum",
    mainIngredients: [{ name: "Shrimp", quantity: "350g" }, { name: "Wheat starch wrappers", quantity: "24" }],
    seasonings: [{ name: "Sesame oil", quantity: "1 tsp" }, { name: "White pepper", quantity: "1/2 tsp" }],
    steps: ["Season chopped shrimp.", "Wrap in thin dumpling skins.", "Steam until translucent and glossy."],
    tags: ["Cantonese", "Chinese", "Dim Sum", "Seafood"],
    likes: 30,
    views: 194,
    ratingAverage: 4.9,
    ratingCount: 15,
  }),
  recipe({
    title: "Siu Mai Pork Dumplings",
    description: "Open-top dim sum dumplings filled with pork, shrimp, mushroom, and roe.",
    theme: "dimSum",
    mainIngredients: [{ name: "Ground pork", quantity: "350g" }, { name: "Shrimp", quantity: "180g" }, { name: "Dumpling wrappers", quantity: "24" }],
    seasonings: [{ name: "Oyster sauce", quantity: "1 tbsp" }, { name: "Sesame oil", quantity: "1 tsp" }],
    steps: ["Mix pork, shrimp, and mushrooms.", "Shape open-top dumplings.", "Steam until juicy and cooked through."],
    tags: ["Cantonese", "Chinese", "Dim Sum", "Pork"],
    likes: 27,
    views: 178,
    ratingAverage: 4.8,
    ratingCount: 13,
  }),
  recipe({
    title: "Black Bean Steamed Pork Ribs",
    description: "Cantonese dim sum ribs steamed with garlic, fermented black beans, and taro.",
    theme: "pork",
    mainIngredients: [{ name: "Pork ribs", quantity: "700g" }, { name: "Fermented black beans", quantity: "2 tbsp" }, { name: "Taro", quantity: "250g" }],
    seasonings: [{ name: "Garlic", quantity: "5 cloves" }, { name: "Oyster sauce", quantity: "1 tbsp" }],
    steps: ["Marinate ribs with black beans and garlic.", "Layer over taro.", "Steam until tender and savory."],
    tags: ["Cantonese", "Chinese", "Dim Sum", "Pork"],
    likes: 23,
    views: 149,
    ratingAverage: 4.7,
    ratingCount: 10,
  }),
  recipe({
    title: "Salt and Pepper Squid",
    description: "Crisp squid tossed with garlic, scallions, and white pepper.",
    theme: "seafood",
    mainIngredients: [{ name: "Squid", quantity: "600g" }, { name: "Scallions", quantity: "3" }],
    seasonings: [{ name: "White pepper", quantity: "1 tsp" }, { name: "Salt", quantity: "1 tsp" }],
    steps: ["Score and coat squid lightly.", "Fry until crisp.", "Toss with garlic, scallions, salt, and pepper."],
    tags: ["Cantonese", "Chinese", "Seafood", "Quick"],
    likes: 20,
    views: 127,
    ratingAverage: 4.6,
    ratingCount: 8,
  }),
  recipe({
    title: "Century Egg Pork Congee",
    description: "Silky rice porridge with pork, century egg, ginger, and scallions.",
    theme: "soup",
    mainIngredients: [{ name: "Rice", quantity: "1 cup" }, { name: "Lean pork", quantity: "250g" }, { name: "Century eggs", quantity: "2" }],
    seasonings: [{ name: "Ginger", quantity: "20g" }, { name: "Salt", quantity: "to taste" }],
    steps: ["Simmer rice until creamy.", "Add marinated pork and century egg.", "Finish with ginger and scallions."],
    tags: ["Cantonese", "Chinese", "Breakfast", "Soup"],
    likes: 17,
    views: 102,
    ratingAverage: 4.5,
    ratingCount: 7,
  }),
  recipe({
    title: "Hong Kong Egg Tarts",
    description: "Flaky pastry shells filled with smooth custard for a bakery-style dessert.",
    theme: "dessert",
    mainIngredients: [{ name: "Tart shells", quantity: "12" }, { name: "Eggs", quantity: "4" }, { name: "Milk", quantity: "240ml" }],
    seasonings: [{ name: "Sugar", quantity: "80g" }, { name: "Vanilla", quantity: "1 tsp" }],
    steps: ["Prepare tart shells.", "Whisk custard until smooth.", "Bake until the filling is just set."],
    tags: ["Cantonese", "Chinese", "Dessert", "Bakery"],
    likes: 32,
    views: 210,
    ratingAverage: 4.9,
    ratingCount: 19,
  }),
  recipe({
    title: "Mapo Tofu",
    description: "Sichuan tofu with fermented bean paste, ground pork, chili oil, and numbing peppercorn.",
    theme: "tofu",
    mainIngredients: [{ name: "Soft tofu", quantity: "600g" }, { name: "Ground pork", quantity: "180g" }],
    seasonings: [{ name: "Doubanjiang", quantity: "2 tbsp" }, { name: "Sichuan peppercorn", quantity: "1 tsp" }, { name: "Chili oil", quantity: "2 tbsp" }],
    steps: ["Brown pork with doubanjiang.", "Simmer tofu gently in the sauce.", "Finish with chili oil and ground peppercorn."],
    tags: ["Sichuan", "Chinese", "Spicy", "Tofu"],
    likes: 34,
    views: 230,
    ratingAverage: 4.9,
    ratingCount: 20,
  }),
  recipe({
    title: "Dan Dan Noodles",
    description: "Sichuan noodles with sesame paste, chili oil, minced pork, and preserved mustard greens.",
    theme: "noodles",
    mainIngredients: [{ name: "Wheat noodles", quantity: "400g" }, { name: "Ground pork", quantity: "220g" }],
    seasonings: [{ name: "Chili oil", quantity: "3 tbsp" }, { name: "Sesame paste", quantity: "2 tbsp" }, { name: "Black vinegar", quantity: "1 tbsp" }],
    steps: ["Cook noodles until springy.", "Brown pork with preserved vegetables.", "Toss noodles with spicy sesame sauce."],
    tags: ["Sichuan", "Chinese", "Spicy", "Noodles"],
    likes: 29,
    views: 188,
    ratingAverage: 4.8,
    ratingCount: 15,
  }),
  recipe({
    title: "Kung Pao Chicken",
    description: "Sichuan chicken stir-fry with dried chilies, peanuts, and a glossy sweet-sour sauce.",
    theme: "spicy",
    mainIngredients: [{ name: "Chicken thigh", quantity: "600g" }, { name: "Peanuts", quantity: "80g" }, { name: "Dried chilies", quantity: "12" }],
    seasonings: [{ name: "Soy sauce", quantity: "2 tbsp" }, { name: "Black vinegar", quantity: "1 tbsp" }, { name: "Sugar", quantity: "1 tbsp" }],
    steps: ["Marinate diced chicken.", "Bloom chilies and peppercorn.", "Stir-fry chicken with sauce and peanuts."],
    tags: ["Sichuan", "Chinese", "Spicy", "Chicken"],
    likes: 25,
    views: 171,
    ratingAverage: 4.7,
    ratingCount: 12,
  }),
  recipe({
    title: "Twice-Cooked Pork",
    description: "Sichuan pork belly stir-fried with leeks, doubanjiang, and sweet bean sauce.",
    theme: "pork",
    mainIngredients: [{ name: "Pork belly", quantity: "650g" }, { name: "Leeks", quantity: "250g" }],
    seasonings: [{ name: "Doubanjiang", quantity: "2 tbsp" }, { name: "Sweet bean sauce", quantity: "1 tbsp" }],
    steps: ["Simmer pork belly, cool, and slice thinly.", "Render slices until curled.", "Stir-fry with sauces and leeks."],
    tags: ["Sichuan", "Chinese", "Spicy", "Pork"],
    likes: 21,
    views: 135,
    ratingAverage: 4.7,
    ratingCount: 9,
  }),
  recipe({
    title: "Fish-Fragrant Eggplant",
    description: "Sichuan eggplant in a garlicky, sweet-sour chili sauce with no fish required.",
    theme: "vegetables",
    mainIngredients: [{ name: "Chinese eggplant", quantity: "600g" }, { name: "Garlic", quantity: "5 cloves" }],
    seasonings: [{ name: "Doubanjiang", quantity: "1 tbsp" }, { name: "Black vinegar", quantity: "1 tbsp" }, { name: "Sugar", quantity: "1 tbsp" }],
    steps: ["Sear eggplant until soft.", "Cook garlic and doubanjiang until fragrant.", "Toss with sweet-sour sauce."],
    tags: ["Sichuan", "Chinese", "Spicy", "Vegetarian"],
    likes: 18,
    views: 124,
    ratingAverage: 4.6,
    ratingCount: 8,
  }),
  recipe({
    title: "Kimchi Jjigae",
    description: "Korean kimchi stew with pork belly, tofu, scallions, and a spicy-sour broth.",
    theme: "korean",
    mainIngredients: [{ name: "Aged kimchi", quantity: "450g" }, { name: "Pork belly", quantity: "250g" }, { name: "Tofu", quantity: "300g" }],
    seasonings: [{ name: "Gochugaru", quantity: "1 tbsp" }, { name: "Gochujang", quantity: "1 tbsp" }],
    steps: ["Saute pork belly and kimchi.", "Add broth and simmer until deep red.", "Add tofu and scallions before serving."],
    tags: ["Korean", "Spicy", "Soup", "Dinner"],
    likes: 30,
    views: 205,
    ratingAverage: 4.9,
    ratingCount: 17,
  }),
  recipe({
    title: "Bibimbap Rice Bowl",
    description: "Korean rice bowl with seasoned vegetables, egg, beef, and gochujang sauce.",
    theme: "rice",
    mainIngredients: [{ name: "Cooked rice", quantity: "4 cups" }, { name: "Beef", quantity: "350g" }, { name: "Mixed vegetables", quantity: "600g" }],
    seasonings: [{ name: "Gochujang", quantity: "3 tbsp" }, { name: "Sesame oil", quantity: "1 tbsp" }],
    steps: ["Prepare seasoned vegetables separately.", "Cook beef until savory.", "Assemble over rice with egg and gochujang."],
    tags: ["Korean", "Rice", "Vegetable", "Dinner"],
    likes: 33,
    views: 216,
    ratingAverage: 4.9,
    ratingCount: 18,
  }),
  recipe({
    title: "Bulgogi Beef",
    description: "Thin-sliced Korean beef marinated with pear, soy sauce, garlic, and sesame.",
    theme: "pork",
    mainIngredients: [{ name: "Thin beef slices", quantity: "700g" }, { name: "Asian pear", quantity: "1/2" }],
    seasonings: [{ name: "Soy sauce", quantity: "4 tbsp" }, { name: "Garlic", quantity: "4 cloves" }, { name: "Sesame oil", quantity: "1 tbsp" }],
    steps: ["Blend pear with soy, garlic, and sesame oil.", "Marinate beef briefly.", "Sear quickly and serve with rice."],
    tags: ["Korean", "Beef", "Rice", "Family dinner"],
    likes: 28,
    views: 173,
    ratingAverage: 4.8,
    ratingCount: 14,
  }),
  recipe({
    title: "Japchae Glass Noodles",
    description: "Korean sweet potato noodles tossed with vegetables, sesame oil, and soy sauce.",
    theme: "noodles",
    mainIngredients: [{ name: "Glass noodles", quantity: "350g" }, { name: "Spinach", quantity: "150g" }, { name: "Mushrooms", quantity: "150g" }],
    seasonings: [{ name: "Soy sauce", quantity: "3 tbsp" }, { name: "Sesame oil", quantity: "2 tbsp" }],
    steps: ["Cook glass noodles until chewy.", "Stir-fry vegetables separately.", "Toss everything with soy and sesame oil."],
    tags: ["Korean", "Noodles", "Vegetable", "Quick"],
    likes: 21,
    views: 131,
    ratingAverage: 4.7,
    ratingCount: 10,
  }),
  recipe({
    title: "Tteokbokki Rice Cakes",
    description: "Chewy Korean rice cakes simmered in a sweet-spicy gochujang sauce.",
    theme: "spicy",
    mainIngredients: [{ name: "Rice cakes", quantity: "500g" }, { name: "Fish cakes", quantity: "200g" }],
    seasonings: [{ name: "Gochujang", quantity: "3 tbsp" }, { name: "Gochugaru", quantity: "1 tbsp" }, { name: "Sugar", quantity: "1 tbsp" }],
    steps: ["Simmer sauce with water and gochujang.", "Add rice cakes and fish cakes.", "Cook until thick and glossy."],
    tags: ["Korean", "Spicy", "Street food", "Quick"],
    likes: 26,
    views: 169,
    ratingAverage: 4.8,
    ratingCount: 13,
  }),
  recipe({
    title: "Kimchi Fried Rice",
    description: "Korean fried rice with chopped kimchi, egg, sesame oil, and roasted seaweed.",
    theme: "rice",
    mainIngredients: [{ name: "Cooked rice", quantity: "4 cups" }, { name: "Kimchi", quantity: "300g" }, { name: "Eggs", quantity: "4" }],
    seasonings: [{ name: "Kimchi juice", quantity: "4 tbsp" }, { name: "Sesame oil", quantity: "1 tbsp" }],
    steps: ["Stir-fry kimchi until caramelized.", "Add rice and kimchi juice.", "Top with fried eggs and seaweed."],
    tags: ["Korean", "Spicy", "Rice", "Quick"],
    likes: 23,
    views: 147,
    ratingAverage: 4.7,
    ratingCount: 11,
  }),
  recipe({
    title: "Kimbap Rolls",
    description: "Korean seaweed rice rolls with vegetables, egg, and pickled radish.",
    theme: "korean",
    mainIngredients: [{ name: "Seaweed sheets", quantity: "6" }, { name: "Seasoned rice", quantity: "4 cups" }, { name: "Pickled radish", quantity: "120g" }],
    seasonings: [{ name: "Sesame oil", quantity: "1 tbsp" }, { name: "Salt", quantity: "to taste" }],
    steps: ["Season rice and prepare fillings.", "Roll tightly in seaweed.", "Slice into bite-size pieces."],
    tags: ["Korean", "Rice", "Lunch", "Vegetable"],
    likes: 19,
    views: 116,
    ratingAverage: 4.6,
    ratingCount: 9,
  }),
];

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Set it in backend/.env before seeding demo data.");
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

  const deleteResult = await Recipe.deleteMany({});
  await Promise.all([
    Cart.updateMany({}, { $set: { recipes: [] } }),
    Favorite.updateMany({}, { $set: { recipes: [] } }),
    MealPlan.updateMany({}, { $set: { recipes: [], days: [] } }),
  ]);

  const documents = asianRecipes.map((seed, index) => ({
    ...seed,
    authorId: index % 6 === 0 ? testUser._id : admin._id,
  }));

  await Recipe.insertMany(documents);

  const totalRecipes = await Recipe.countDocuments();
  console.log(`Deleted old recipes: ${deleteResult.deletedCount}`);
  console.log(`Inserted Asian demo recipes: ${documents.length}`);
  console.log(`Total recipes: ${totalRecipes}`);
  console.log("Primary cuisines: Cantonese, Sichuan, Korean");

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});