const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DEFAULT_AUTHOR_ID = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");

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

const Recipe = mongoose.models.Recipe || mongoose.model("Recipe", recipeSchema);
const MealPlan = mongoose.models.MealPlanSeed || mongoose.model("MealPlanSeed", new mongoose.Schema({}, { strict: false, collection: "mealplans" }));
const WeeklyPlan = mongoose.models.WeeklyPlanSeed || mongoose.model("WeeklyPlanSeed", new mongoose.Schema({}, { strict: false, collection: "weeklyplans" }));

function searchText(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const imageByTheme = {
  pasta: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?auto=format&fit=crop&w=1200&q=80",
  salmon: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
  rice: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
  eggs: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80",
  soup: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
  cake: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=1200&q=80",
  shrimp: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=1200&q=80",
  vegetables: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
  chicken: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1200&q=80",
  meat: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
  tofu: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80",
  buns: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80",
  salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
  default: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
};

function image(query) {
  const text = query.toLowerCase();
  if (text.includes("pasta") || text.includes("tomato basil")) return imageByTheme.pasta;
  if (text.includes("salmon")) return imageByTheme.salmon;
  if (text.includes("rice") || text.includes("fried")) return imageByTheme.rice;
  if (text.includes("egg")) return imageByTheme.eggs;
  if (text.includes("soup") || text.includes("stew")) return imageByTheme.soup;
  if (text.includes("cake")) return imageByTheme.cake;
  if (text.includes("shrimp")) return imageByTheme.shrimp;
  if (text.includes("tofu")) return imageByTheme.tofu;
  if (text.includes("bun")) return imageByTheme.buns;
  if (text.includes("salad") || text.includes("cucumber")) return imageByTheme.salad;
  if (text.includes("chicken") || text.includes("turkey")) return imageByTheme.chicken;
  if (text.includes("pork") || text.includes("rib") || text.includes("beef") || text.includes("abalone")) return imageByTheme.meat;
  if (text.includes("vegetable") || text.includes("broccoli") || text.includes("carrot") || text.includes("cabbage") || text.includes("cauliflower") || text.includes("beans") || text.includes("corn")) return imageByTheme.vegetables;
  return imageByTheme.default;
}

function recipe(input) {
  return {
    title: input.title,
    titlePinyin: searchText(input.title),
    titleFirstLetters: input.title
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0].toLowerCase())
      .join(""),
    description: input.description,
    authorId: DEFAULT_AUTHOR_ID,
    image: input.image || image(input.imageQuery || input.title),
    component: Boolean(input.component),
    isPublic: true,
    mainIngredients: input.mainIngredients || [],
    seasonings: input.seasonings || [],
    steps: (input.steps || []).map((instruction, index) => ({
      stepNumber: index + 1,
      instruction,
    })),
    servings: input.servings || 4,
    tags: input.tags || [],
    likes: input.likes ?? 0,
    views: input.views ?? 0,
    ratingAverage: input.ratingAverage ?? 0,
    ratingCount: input.ratingCount ?? 0,
  };
}

const translatedExistingRecipes = {
  "水煮蛋": [
    recipe({
      title: "Boiled Egg Prep Cups",
      description: "Simple boiled eggs for breakfast bowls, rice bowls, or snack prep.",
      component: true,
      imageQuery: "boiled eggs",
      mainIngredients: [{ name: "Eggs", quantity: "8" }],
      seasonings: [{ name: "Salt", quantity: "to taste" }],
      steps: ["Bring water to a gentle boil.", "Lower in the eggs and cook for 9 to 10 minutes.", "Cool in ice water, peel, and store for meal prep."],
      servings: 4,
      tags: ["Breakfast", "Meal prep", "Component"],
    }),
    recipe({
      title: "Jammy Boiled Eggs",
      description: "Soft-centered eggs that work well with noodles, salads, and rice bowls.",
      component: true,
      imageQuery: "soft boiled eggs",
      mainIngredients: [{ name: "Eggs", quantity: "6" }],
      seasonings: [{ name: "Black pepper", quantity: "to taste" }],
      steps: ["Boil water and add eggs carefully.", "Cook for 7 minutes for a jammy center.", "Cool, peel, and halve before serving."],
      servings: 3,
      tags: ["Breakfast", "Protein", "Component"],
    }),
  ],
  "荷包蛋": [
    recipe({
      title: "Poached Egg Toast",
      description: "A quick poached egg component for toast, greens, or grain bowls.",
      component: true,
      imageQuery: "poached egg toast",
      mainIngredients: [{ name: "Eggs", quantity: "4" }],
      seasonings: [{ name: "White vinegar", quantity: "1 tbsp" }, { name: "Salt", quantity: "to taste" }],
      steps: ["Simmer water with vinegar.", "Crack eggs into the water and cook until whites are set.", "Drain and season before serving."],
      servings: 4,
      tags: ["Breakfast", "Protein", "Component"],
    }),
    recipe({
      title: "Poached Egg Rice Bowl",
      description: "A light egg topping for meal-prep rice bowls.",
      component: true,
      imageQuery: "poached egg rice bowl",
      mainIngredients: [{ name: "Eggs", quantity: "4" }, { name: "Cooked rice", quantity: "4 cups" }],
      seasonings: [{ name: "Soy sauce", quantity: "2 tbsp" }, { name: "Sesame oil", quantity: "1 tsp" }],
      steps: ["Poach eggs until the whites are firm.", "Serve over warm rice with soy sauce and sesame oil."],
      servings: 4,
      tags: ["Rice bowl", "Protein", "Component"],
    }),
  ],
  "排骨饭": [
    recipe({
      title: "Pork Rib Rice Bowl",
      description: "Tender pork ribs served over rice for a filling meal-prep base.",
      component: true,
      imageQuery: "pork ribs rice bowl",
      mainIngredients: [{ name: "Pork ribs", quantity: "800g" }, { name: "Cooked rice", quantity: "4 cups" }],
      seasonings: [{ name: "Soy sauce", quantity: "3 tbsp" }, { name: "Garlic", quantity: "4 cloves" }],
      steps: ["Brown the ribs on all sides.", "Braise with soy sauce and garlic until tender.", "Serve with rice and spoon the sauce over the top."],
      servings: 4,
      tags: ["Meal prep", "Protein", "Rice"],
    }),
    recipe({
      title: "Five-Spice Pork Rib Rice",
      description: "A warm rice bowl with five-spice ribs and a savory glaze.",
      component: true,
      imageQuery: "braised pork ribs rice",
      mainIngredients: [{ name: "Pork ribs", quantity: "900g" }, { name: "Jasmine rice", quantity: "4 cups cooked" }],
      seasonings: [{ name: "Five-spice powder", quantity: "1 tsp" }, { name: "Oyster sauce", quantity: "2 tbsp" }],
      steps: ["Season ribs with five-spice powder.", "Braise with oyster sauce until glossy.", "Serve over jasmine rice."],
      servings: 4,
      tags: ["Meal prep", "Protein", "Rice"],
    }),
  ],
  "韩式蔬菜饭": [
    recipe({
      title: "Korean Vegetable Rice Bowl",
      description: "A colorful vegetable rice bowl with a light gochujang finish.",
      component: true,
      imageQuery: "korean vegetable rice bowl",
      mainIngredients: [{ name: "Cooked rice", quantity: "4 cups" }, { name: "Mixed vegetables", quantity: "500g" }],
      seasonings: [{ name: "Gochujang", quantity: "2 tbsp" }, { name: "Sesame oil", quantity: "1 tbsp" }],
      steps: ["Saute vegetables until just tender.", "Season with gochujang and sesame oil.", "Serve over rice."],
      servings: 4,
      tags: ["Vegetable", "Rice", "Component"],
    }),
    recipe({
      title: "Gochujang Vegetable Rice",
      description: "A spicy rice component for flexible lunch or dinner planning.",
      component: true,
      imageQuery: "gochujang vegetables rice",
      mainIngredients: [{ name: "Rice", quantity: "4 cups cooked" }, { name: "Carrots", quantity: "150g" }, { name: "Spinach", quantity: "150g" }],
      seasonings: [{ name: "Gochujang", quantity: "2 tbsp" }, { name: "Toasted sesame seeds", quantity: "1 tbsp" }],
      steps: ["Cook rice and keep warm.", "Saute vegetables until tender-crisp.", "Fold in gochujang and sesame seeds."],
      servings: 4,
      tags: ["Vegetable", "Rice", "Component"],
    }),
  ],
  "包菜": [
    recipe({
      title: "Garlic Cabbage Stir-Fry",
      description: "A fast cabbage side with garlic and a crisp finish.",
      component: true,
      imageQuery: "cabbage stir fry",
      mainIngredients: [{ name: "Cabbage", quantity: "500g" }, { name: "Garlic", quantity: "4 cloves" }],
      seasonings: [{ name: "Salt", quantity: "to taste" }, { name: "Oil", quantity: "1 tbsp" }],
      steps: ["Slice cabbage into bite-size pieces.", "Saute garlic in oil.", "Add cabbage and cook until tender-crisp."],
      servings: 4,
      tags: ["Vegetable", "Side", "Component"],
    }),
    recipe({
      title: "Sesame Cabbage Slaw",
      description: "A chilled cabbage side with sesame dressing.",
      component: true,
      imageQuery: "cabbage slaw sesame",
      mainIngredients: [{ name: "Cabbage", quantity: "450g" }, { name: "Carrot", quantity: "100g" }],
      seasonings: [{ name: "Rice vinegar", quantity: "2 tbsp" }, { name: "Sesame oil", quantity: "1 tbsp" }],
      steps: ["Shred cabbage and carrot.", "Whisk vinegar with sesame oil.", "Toss and chill before serving."],
      servings: 4,
      tags: ["Vegetable", "Side", "Component"],
    }),
  ],
  "菜花": [
    recipe({
      title: "Roasted Cauliflower",
      description: "Golden cauliflower florets for bowls, plates, and meal prep.",
      component: true,
      imageQuery: "roasted cauliflower",
      mainIngredients: [{ name: "Cauliflower", quantity: "1 head" }],
      seasonings: [{ name: "Olive oil", quantity: "2 tbsp" }, { name: "Salt", quantity: "to taste" }],
      steps: ["Cut cauliflower into florets.", "Toss with oil and salt.", "Roast until browned at the edges."],
      servings: 4,
      tags: ["Vegetable", "Side", "Component"],
    }),
    recipe({
      title: "Garlic Cauliflower Stir-Fry",
      description: "A stovetop cauliflower side with garlic and pepper.",
      component: true,
      imageQuery: "garlic cauliflower",
      mainIngredients: [{ name: "Cauliflower", quantity: "500g" }, { name: "Garlic", quantity: "3 cloves" }],
      seasonings: [{ name: "Black pepper", quantity: "to taste" }, { name: "Soy sauce", quantity: "1 tbsp" }],
      steps: ["Blanch cauliflower briefly.", "Stir-fry garlic until fragrant.", "Add cauliflower and season."],
      servings: 4,
      tags: ["Vegetable", "Side", "Component"],
    }),
  ],
  "蔬菜包": [
    recipe({
      title: "Vegetable Buns",
      description: "Soft steamed buns filled with seasoned vegetables.",
      component: true,
      imageQuery: "vegetable buns",
      mainIngredients: [{ name: "Steamed buns", quantity: "8" }, { name: "Mixed vegetables", quantity: "400g" }],
      seasonings: [{ name: "Soy sauce", quantity: "2 tbsp" }, { name: "Sesame oil", quantity: "1 tbsp" }],
      steps: ["Prepare a vegetable filling.", "Fill buns and seal tightly.", "Steam until fluffy and hot."],
      servings: 4,
      tags: ["Vegetable", "Component", "Side"],
    }),
    recipe({
      title: "Steamed Vegetable Buns",
      description: "A freezer-friendly side for fast lunch planning.",
      component: true,
      imageQuery: "steamed vegetable buns",
      mainIngredients: [{ name: "Bun dough", quantity: "8 pieces" }, { name: "Cabbage filling", quantity: "400g" }],
      seasonings: [{ name: "White pepper", quantity: "1 tsp" }, { name: "Salt", quantity: "to taste" }],
      steps: ["Fill dough with cabbage mixture.", "Proof briefly.", "Steam until cooked through."],
      servings: 4,
      tags: ["Vegetable", "Component", "Side"],
    }),
  ],
  "扬州炒饭": [
    recipe({
      title: "Yangzhou Fried Rice",
      description: "Classic fried rice with egg, vegetables, and a savory finish.",
      component: true,
      imageQuery: "yangzhou fried rice",
      mainIngredients: [{ name: "Cooked rice", quantity: "4 cups" }, { name: "Eggs", quantity: "3" }, { name: "Mixed vegetables", quantity: "250g" }],
      seasonings: [{ name: "Soy sauce", quantity: "2 tbsp" }, { name: "Oil", quantity: "2 tbsp" }],
      steps: ["Scramble eggs and set aside.", "Stir-fry rice and vegetables.", "Fold eggs back in and season."],
      servings: 4,
      tags: ["Rice", "Meal prep", "Component"],
    }),
    recipe({
      title: "Shrimp Fried Rice",
      description: "A complete rice component with shrimp, egg, and vegetables.",
      component: true,
      imageQuery: "shrimp fried rice",
      mainIngredients: [{ name: "Cooked rice", quantity: "4 cups" }, { name: "Shrimp", quantity: "300g" }, { name: "Eggs", quantity: "2" }],
      seasonings: [{ name: "Soy sauce", quantity: "2 tbsp" }, { name: "Green onion", quantity: "2 stalks" }],
      steps: ["Sear shrimp until pink.", "Add rice and stir-fry until hot.", "Fold in egg and green onion."],
      servings: 4,
      tags: ["Rice", "Seafood", "Component"],
    }),
    recipe({
      title: "Egg Fried Rice",
      description: "A quick egg fried rice side for weekly meal plans.",
      component: true,
      imageQuery: "egg fried rice",
      mainIngredients: [{ name: "Cooked rice", quantity: "4 cups" }, { name: "Eggs", quantity: "3" }],
      seasonings: [{ name: "Soy sauce", quantity: "2 tbsp" }, { name: "Sesame oil", quantity: "1 tsp" }],
      steps: ["Scramble eggs until just set.", "Add rice and seasonings.", "Stir-fry until evenly hot."],
      servings: 4,
      tags: ["Rice", "Quick", "Component"],
    }),
  ],
  "部队锅": [
    recipe({
      title: "Korean Army Stew",
      description: "A hearty family-style stew with cabbage, sausage, tofu, potato, and a spicy broth.",
      component: false,
      imageQuery: "korean army stew",
      mainIngredients: [{ name: "Cabbage", quantity: "300g" }, { name: "Spam", quantity: "200g" }, { name: "Sausage", quantity: "200g" }, { name: "Tofu", quantity: "300g" }, { name: "Potato", quantity: "2" }],
      seasonings: [{ name: "Korean chili flakes", quantity: "6 tbsp" }, { name: "Minced garlic", quantity: "2 tbsp" }, { name: "Soy sauce", quantity: "1 tbsp" }, { name: "Sugar", quantity: "2 tbsp" }],
      steps: ["Arrange cabbage, sausage, tofu, potato, meatballs, beans, and bacon in a wide pot.", "Mix chili flakes, garlic, soy sauce, sugar, chicken powder, beef powder, and oyster sauce.", "Add broth, simmer until the vegetables are tender, and serve hot."],
      servings: 5,
      tags: ["Korean", "Stew", "Family dinner"],
    }),
  ],
  "混合时蔬": [
    recipe({
      title: "Mixed Seasonal Vegetables",
      description: "A colorful vegetable component with broccoli, carrot, mushrooms, and garlic.",
      component: true,
      imageQuery: "mixed vegetables",
      mainIngredients: [{ name: "Broccoli", quantity: "150g" }, { name: "Carrot", quantity: "100g" }, { name: "Mushrooms", quantity: "150g" }],
      seasonings: [{ name: "Salt", quantity: "to taste" }, { name: "Garlic", quantity: "3 cloves" }],
      steps: ["Wash and cut all vegetables.", "Saute garlic in hot oil.", "Add vegetables and cook until bright and tender."],
      servings: 4,
      tags: ["Vegetable", "Healthy", "Component"],
    }),
  ],
  "青豆": [
    recipe({
      title: "Garlic Green Beans",
      description: "A crisp green bean side that works well in lunch boxes.",
      component: true,
      imageQuery: "garlic green beans",
      mainIngredients: [{ name: "Green beans", quantity: "300g" }, { name: "Garlic", quantity: "3 cloves" }],
      seasonings: [{ name: "Salt", quantity: "to taste" }, { name: "Oil", quantity: "1 tbsp" }],
      steps: ["Wash and drain the green beans.", "Mince garlic and saute until fragrant.", "Add beans and cook until tender-crisp."],
      servings: 4,
      tags: ["Vegetable", "Easy", "Component"],
    }),
  ],
  "韩式辣酱蔬菜": [
    recipe({
      title: "Gochujang Vegetables",
      description: "Mixed vegetables tossed in a Korean chili paste sauce.",
      component: true,
      imageQuery: "gochujang vegetables",
      mainIngredients: [{ name: "Carrot", quantity: "150g" }, { name: "Lettuce", quantity: "200g" }, { name: "Onion", quantity: "100g" }],
      seasonings: [{ name: "Gochujang", quantity: "3 tbsp" }, { name: "Minced garlic", quantity: "2 tbsp" }],
      steps: ["Slice all vegetables.", "Saute garlic until fragrant.", "Add vegetables and toss with gochujang."],
      servings: 4,
      tags: ["Vegetable", "Quick", "Component"],
    }),
  ],
  "蒜香玉米牛肉": [
    recipe({
      title: "Garlic Corn Beef",
      description: "Tender beef with sweet corn and garlic for a protein-rich meal-plan component.",
      component: true,
      imageQuery: "beef corn garlic",
      mainIngredients: [{ name: "Beef", quantity: "600g" }, { name: "Corn kernels", quantity: "200g" }, { name: "Garlic", quantity: "4 cloves" }],
      seasonings: [{ name: "Salt", quantity: "to taste" }, { name: "Black pepper", quantity: "to taste" }],
      steps: ["Cut beef and season with salt.", "Mince garlic and drain corn.", "Sear beef, add garlic and corn, and cook until glossy."],
      servings: 4,
      tags: ["Protein", "Quick", "Component"],
    }),
  ],
  "蒜蓉豉汁排骨": [
    recipe({
      title: "Garlic Black Bean Pork Ribs",
      description: "Tender pork ribs with garlic and fermented black beans.",
      component: true,
      imageQuery: "black bean pork ribs",
      mainIngredients: [{ name: "Pork ribs", quantity: "800g" }, { name: "Minced garlic", quantity: "5 tbsp" }, { name: "Fermented black beans", quantity: "3 tbsp" }],
      seasonings: [{ name: "Soy sauce", quantity: "2 tbsp" }, { name: "Oil", quantity: "2 tbsp" }],
      steps: ["Wash and drain the ribs.", "Brown ribs until both sides are golden.", "Add garlic black bean sauce and simmer until tender."],
      servings: 4,
      tags: ["Protein", "Easy", "Component"],
    }),
  ],
  "包菜排骨饭": [
    recipe({
      title: "Cabbage Pork Rib Rice Prep",
      description: "A six-serving lunch-prep recipe with pork ribs, cabbage, rice, and a garlic black bean marinade.",
      component: true,
      imageQuery: "pork ribs cabbage rice",
      mainIngredients: [{ name: "Pork ribs", quantity: "900g" }, { name: "Cabbage", quantity: "500g" }, { name: "Rice", quantity: "6 cups cooked" }],
      seasonings: [{ name: "Minced garlic", quantity: "84g" }, { name: "Fermented black beans", quantity: "12g" }, { name: "Oyster sauce", quantity: "12g" }],
      steps: ["Cut ribs into small pieces, wash twice, then clean with flour and salt.", "Season ribs with salt, MSG, sugar, oyster sauce, black beans, garlic, peanut butter, and starch.", "Steam or cook with cabbage and portion over rice for six lunch boxes."],
      servings: 6,
      tags: ["Meal prep", "Lunch", "Protein"],
    }),
  ],
  "黑森林蛋糕": [
    recipe({
      title: "Black Forest Cake",
      description: "Rich chocolate cake layered with cherries and whipped cream.",
      component: false,
      imageQuery: "black forest cake",
      mainIngredients: [{ name: "Chocolate cake layers", quantity: "2" }, { name: "Cherries", quantity: "2 cups" }],
      seasonings: [{ name: "Whipped cream", quantity: "2 cups" }, { name: "Chocolate shavings", quantity: "1 cup" }],
      steps: ["Bake chocolate cake layers.", "Fill with cherries and whipped cream.", "Decorate with chocolate shavings."],
      servings: 8,
      tags: ["Dessert", "Chocolate"],
    }),
  ],
  "蒜蓉蒸虾": [
    recipe({
      title: "Garlic Steamed Shrimp",
      description: "Fresh shrimp steamed with garlic for a clean seafood dish.",
      component: false,
      imageQuery: "garlic steamed shrimp",
      mainIngredients: [{ name: "Shrimp", quantity: "500g" }, { name: "Garlic", quantity: "5 cloves" }],
      seasonings: [{ name: "Soy sauce", quantity: "1 tbsp" }, { name: "Oil", quantity: "1 tbsp" }],
      steps: ["Arrange shrimp on a plate.", "Top with garlic and seasonings.", "Steam for 8 minutes and serve hot."],
      servings: 4,
      tags: ["Seafood", "Quick"],
    }),
  ],
  "青菜豆腐汤": [
    recipe({
      title: "Greens and Tofu Soup",
      description: "A light soup with tender greens and soft tofu.",
      component: false,
      imageQuery: "tofu greens soup",
      mainIngredients: [{ name: "Leafy greens", quantity: "250g" }, { name: "Soft tofu", quantity: "300g" }],
      seasonings: [{ name: "Salt", quantity: "to taste" }, { name: "White pepper", quantity: "to taste" }],
      steps: ["Bring broth to a simmer.", "Add tofu and greens.", "Season and serve when greens are tender."],
      servings: 4,
      tags: ["Soup", "Light"],
    }),
  ],
  "红烧鸡翅": [
    recipe({
      title: "Braised Chicken Wings",
      description: "Savory-sweet chicken wings braised until glossy and tender.",
      component: false,
      imageQuery: "braised chicken wings",
      mainIngredients: [{ name: "Chicken wings", quantity: "800g" }],
      seasonings: [{ name: "Soy sauce", quantity: "3 tbsp" }, { name: "Rock sugar", quantity: "20g" }],
      steps: ["Blanch chicken wings.", "Brown wings with sugar and soy sauce.", "Simmer until the sauce coats the wings."],
      servings: 4,
      tags: ["Chicken", "Dinner"],
    }),
  ],
  "番茄意面": [
    recipe({
      title: "Tomato Basil Pasta",
      description: "Simple tomato pasta with basil and olive oil.",
      component: false,
      imageQuery: "tomato pasta basil",
      mainIngredients: [{ name: "Pasta", quantity: "400g" }, { name: "Tomatoes", quantity: "500g" }],
      seasonings: [{ name: "Olive oil", quantity: "2 tbsp" }, { name: "Basil", quantity: "1 handful" }],
      steps: ["Boil pasta until al dente.", "Cook tomatoes into a quick sauce.", "Toss pasta with sauce and basil."],
      servings: 4,
      tags: ["Pasta", "Quick"],
    }),
  ],
  "鲍鱼东坡肉": [
    recipe({
      title: "Abalone Dongpo Pork",
      description: "A rich braised pork dish finished with abalone for a special dinner.",
      component: false,
      imageQuery: "dongpo pork",
      mainIngredients: [{ name: "Pork belly", quantity: "800g" }, { name: "Abalone", quantity: "4 pieces" }],
      seasonings: [{ name: "Soy sauce", quantity: "4 tbsp" }, { name: "Shaoxing wine", quantity: "3 tbsp" }],
      steps: ["Sear pork belly until browned.", "Braise slowly with soy sauce and wine.", "Add abalone near the end and simmer until glossy."],
      servings: 4,
      tags: ["Pork", "Special dinner"],
    }),
  ],
};

const placeholderRecipes = [
  recipe({
    title: "Lemon Herb Chicken Bowl",
    description: "A bright chicken meal-prep bowl with rice, greens, and lemon herb dressing.",
    component: false,
    imageQuery: "lemon herb chicken bowl",
    mainIngredients: [{ name: "Chicken breast", quantity: "600g" }, { name: "Brown rice", quantity: "4 cups cooked" }, { name: "Mixed greens", quantity: "200g" }],
    seasonings: [{ name: "Lemon juice", quantity: "3 tbsp" }, { name: "Olive oil", quantity: "2 tbsp" }, { name: "Dried oregano", quantity: "1 tsp" }],
    steps: ["Season chicken with lemon, oil, oregano, salt, and pepper.", "Grill or pan-sear chicken until cooked through.", "Slice chicken and serve with rice and greens."],
    servings: 4,
    tags: ["Meal prep", "Chicken", "Healthy"],
    likes: 18,
    views: 96,
    ratingAverage: 4.8,
    ratingCount: 12,
  }),
  recipe({
    title: "Citrus Cucumber Salad",
    description: "A crisp cucumber salad with citrus dressing for a refreshing side.",
    component: true,
    imageQuery: "cucumber citrus salad",
    mainIngredients: [{ name: "Cucumber", quantity: "3" }, { name: "Orange", quantity: "1" }],
    seasonings: [{ name: "Rice vinegar", quantity: "2 tbsp" }, { name: "Honey", quantity: "1 tsp" }],
    steps: ["Slice cucumbers thinly.", "Whisk citrus juice, vinegar, and honey.", "Toss and chill for 10 minutes."],
    servings: 4,
    tags: ["Salad", "Side", "Component"],
  }),
];

const demoSeeds = [
  recipe({
    title: "Sesame Salmon Meal Prep",
    description: "Baked salmon with sesame green beans and rice for a clean weekly lunch plan.",
    component: false,
    imageQuery: "sesame salmon rice bowl",
    mainIngredients: [{ name: "Salmon fillets", quantity: "4" }, { name: "Green beans", quantity: "400g" }, { name: "Cooked rice", quantity: "4 cups" }],
    seasonings: [{ name: "Soy sauce", quantity: "3 tbsp" }, { name: "Sesame oil", quantity: "1 tbsp" }, { name: "Honey", quantity: "1 tbsp" }],
    steps: ["Whisk soy sauce, sesame oil, and honey.", "Brush salmon with sauce and bake until flaky.", "Serve with green beans and rice."],
    servings: 4,
    tags: ["Meal prep", "Seafood", "Healthy"],
    likes: 24,
    views: 132,
    ratingAverage: 4.9,
    ratingCount: 14,
  }),
  recipe({
    title: "Turkey Lettuce Rice Bowl",
    description: "Ground turkey, crisp lettuce, and rice with a savory garlic sauce.",
    component: false,
    imageQuery: "turkey rice bowl lettuce",
    mainIngredients: [{ name: "Ground turkey", quantity: "600g" }, { name: "Lettuce", quantity: "1 head" }, { name: "Cooked rice", quantity: "4 cups" }],
    seasonings: [{ name: "Garlic", quantity: "4 cloves" }, { name: "Soy sauce", quantity: "3 tbsp" }, { name: "Black pepper", quantity: "to taste" }],
    steps: ["Brown turkey with garlic.", "Season with soy sauce and pepper.", "Serve over rice with shredded lettuce."],
    servings: 4,
    tags: ["Meal prep", "Protein", "Quick"],
    likes: 15,
    views: 81,
    ratingAverage: 4.6,
    ratingCount: 8,
  }),
  recipe({
    title: "Brown Rice Pilaf",
    description: "A nutty rice side that scales well for weekly meal plans.",
    component: true,
    imageQuery: "brown rice pilaf",
    mainIngredients: [{ name: "Brown rice", quantity: "2 cups dry" }, { name: "Vegetable broth", quantity: "4 cups" }],
    seasonings: [{ name: "Olive oil", quantity: "1 tbsp" }, { name: "Salt", quantity: "to taste" }],
    steps: ["Toast rice briefly in oil.", "Add broth and simmer until tender.", "Rest for 10 minutes, then fluff."],
    servings: 6,
    tags: ["Grain", "Side", "Component"],
  }),
  recipe({
    title: "Roasted Broccoli and Carrots",
    description: "A simple roasted vegetable tray for adding color to meal plans.",
    component: true,
    imageQuery: "roasted broccoli carrots",
    mainIngredients: [{ name: "Broccoli", quantity: "400g" }, { name: "Carrots", quantity: "300g" }],
    seasonings: [{ name: "Olive oil", quantity: "2 tbsp" }, { name: "Garlic powder", quantity: "1 tsp" }],
    steps: ["Cut broccoli and carrots into even pieces.", "Toss with oil and garlic powder.", "Roast until browned and tender."],
    servings: 4,
    tags: ["Vegetable", "Side", "Component"],
  }),
  recipe({
    title: "Miso Tofu Soup",
    description: "A gentle tofu soup with seaweed, scallion, and miso broth.",
    component: false,
    imageQuery: "miso tofu soup",
    mainIngredients: [{ name: "Soft tofu", quantity: "300g" }, { name: "Dried wakame", quantity: "1 tbsp" }, { name: "Scallions", quantity: "2" }],
    seasonings: [{ name: "Miso paste", quantity: "3 tbsp" }, { name: "Dashi or broth", quantity: "4 cups" }],
    steps: ["Warm broth without boiling hard.", "Dissolve miso paste into the broth.", "Add tofu, wakame, and scallion."],
    servings: 4,
    tags: ["Soup", "Light", "Vegetarian"],
  }),
];

function translateMealPlanName(name, index) {
  if (/人\d+天计划/.test(name)) {
    const match = name.match(/(\d+)人(\d+)天计划/);
    if (match) return `${match[1]}-person ${match[2]}-day meal plan`;
  }
  if (/[\u4e00-\u9fff]/.test(name)) return `Demo Meal Plan ${index + 1}`;
  if (name === "123") return `Demo Meal Plan ${index + 1}`;
  return name;
}

function translateWeeklyPlanName(name, index) {
  if (name === "未命名排表") return `Untitled Weekly Plan ${index + 1}`;
  if (name === "自定义排表") return "Custom Weekly Plan";
  if (/[\u4e00-\u9fff]/.test(name)) return `Demo Weekly Plan ${index + 1}`;
  if (name === "123") return `Demo Weekly Plan ${index + 1}`;
  return name;
}

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Set it in backend/.env before seeding demo data.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const existing = await Recipe.find({}).sort({ createdAt: 1 });
  const counters = new Map();
  let translated = 0;
  let placeholders = 0;
  let fixedImages = 0;
  let translatedMealPlans = 0;
  let translatedWeeklyPlans = 0;

  for (const current of existing) {
    let nextRecipe = null;
    const choices = translatedExistingRecipes[current.title];

    if (choices) {
      const count = counters.get(current.title) || 0;
      nextRecipe = choices[count % choices.length];
      counters.set(current.title, count + 1);
    } else if (current.title === "123") {
      nextRecipe = placeholderRecipes[placeholders % placeholderRecipes.length];
      placeholders += 1;
    }

    if (!nextRecipe) continue;

    await Recipe.findByIdAndUpdate(current._id, {
      ...nextRecipe,
      authorId: current.authorId || DEFAULT_AUTHOR_ID,
      image: current.image || nextRecipe.image,
      likes: current.likes || nextRecipe.likes || 0,
      views: current.views || nextRecipe.views || 0,
      ratingAverage: current.ratingAverage || nextRecipe.ratingAverage || 0,
      ratingCount: current.ratingCount || nextRecipe.ratingCount || 0,
    });
    translated += 1;
  }

  for (const current of await Recipe.find({ image: /source\.unsplash\.com/ })) {
    await Recipe.findByIdAndUpdate(current._id, { image: image(current.title) });
    fixedImages += 1;
  }

  let seeded = 0;
  for (const seed of demoSeeds) {
    await Recipe.findOneAndUpdate(
      { title: seed.title },
      { ...seed, authorId: DEFAULT_AUTHOR_ID },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    seeded += 1;
  }

  const mealPlans = await MealPlan.find({}).sort({ createdAt: 1 });
  for (let index = 0; index < mealPlans.length; index += 1) {
    const plan = mealPlans[index];
    const nextName = translateMealPlanName(plan.name || "", index);
    if (nextName !== plan.name) {
      await MealPlan.findByIdAndUpdate(plan._id, { name: nextName });
      translatedMealPlans += 1;
    }
  }

  const weeklyPlans = await WeeklyPlan.find({}).sort({ createdAt: 1 });
  for (let index = 0; index < weeklyPlans.length; index += 1) {
    const plan = weeklyPlans[index];
    const nextName = translateWeeklyPlanName(plan.name || "", index);
    if (nextName !== plan.name) {
      await WeeklyPlan.findByIdAndUpdate(plan._id, { name: nextName });
      translatedWeeklyPlans += 1;
    }
  }

  const total = await Recipe.countDocuments();
  console.log(`Translated existing recipes: ${translated}`);
  console.log(`Fixed demo image URLs: ${fixedImages}`);
  console.log(`Upserted demo recipes: ${seeded}`);
  console.log(`Translated meal plan names: ${translatedMealPlans}`);
  console.log(`Translated weekly plan names: ${translatedWeeklyPlans}`);
  console.log(`Total recipes: ${total}`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});