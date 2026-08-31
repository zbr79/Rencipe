import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("Missing MONGO_URI");
  process.exit(1);
}

const RECIPES = [
  {
    title: "Kung Pao Chicken",
    description: "The classic Sichuan stir-fry of chicken, peanuts, and dried chilies in a sweet-savory sauce with the signature numbing tingle of Sichuan peppercorns.",
    tips: "Keep the wok smoking hot and stir-fry in batches so the chicken stays crisp.",
    mainIngredients: [
      { name: "Chicken thigh", quantity: "400 g" },
      { name: "Dried red chilies", quantity: "10 pieces" },
      { name: "Roasted peanuts", quantity: "80 g" },
      { name: "Scallions", quantity: "3 stalks" },
    ],
    seasonings: [
      { name: "Soy sauce", quantity: "2 tbsp" },
      { name: "Chinkiang vinegar", quantity: "1 tbsp" },
      { name: "Sichuan peppercorns", quantity: "1 tsp" },
      { name: "Sugar", quantity: "1 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Dice chicken, marinate with soy sauce and cornstarch for 15 minutes." },
      { stepNumber: 2, instruction: "Toast dried chilies and Sichuan peppercorns in oil until fragrant." },
      { stepNumber: 3, instruction: "Stir-fry chicken over high heat until golden." },
      { stepNumber: 4, instruction: "Add sauce, peanuts, and scallions; toss until glossy and serve hot." },
    ],
    servings: 3,
    tags: ["Chinese", "Sichuan", "Chicken", "Spicy", "Dinner", "Quick"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Kung_Pao_Chicken_at_Liqiaoshun_Restaurant_%2820220310175424%29.jpg/960px-Kung_Pao_Chicken_at_Liqiaoshun_Restaurant_%2820220310175424%29.jpg",
    views: 880, likes: 96, ratingAverage: 4.7, ratingCount: 64,
  },
  {
    title: "Mapo Tofu",
    description: "Silken tofu braised in a fiery sauce of fermented chili bean paste and ground pork, finished with a shower of Sichuan pepper.",
    tips: "Use doubanjiang (chili bean paste) for the authentic deep-red color and umami.",
    mainIngredients: [
      { name: "Silken tofu", quantity: "500 g" },
      { name: "Ground pork", quantity: "150 g" },
      { name: "Doubanjiang", quantity: "1.5 tbsp" },
      { name: "Garlic", quantity: "3 cloves" },
    ],
    seasonings: [
      { name: "Soy sauce", quantity: "1 tsp" },
      { name: "Sichuan peppercorn powder", quantity: "1 tsp" },
      { name: "Chili oil", quantity: "2 tbsp" },
      { name: "Cornstarch slurry", quantity: "2 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Cut tofu into cubes and blanch in salted water." },
      { stepNumber: 2, instruction: "Fry doubanjiang and garlic in oil until the oil turns red." },
      { stepNumber: 3, instruction: "Brown ground pork, then add stock and tofu; simmer 5 minutes." },
      { stepNumber: 4, instruction: "Thicken with cornstarch slurry and finish with Sichuan pepper." },
    ],
    servings: 3,
    tags: ["Chinese", "Sichuan", "Spicy", "Pork", "Tofu", "Dinner"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Authentic_Mapo_Tofu.jpg/960px-Authentic_Mapo_Tofu.jpg",
    views: 920, likes: 110, ratingAverage: 4.8, ratingCount: 71,
  },
  {
    title: "Char Siu (Cantonese BBQ Pork)",
    description: "Glossy, honey-lacquered roast pork with a sweet-savory crust, the star of Cantonese barbecue shops.",
    tips: "Marinate overnight and roast in two stages so the sugars caramelize without burning.",
    mainIngredients: [
      { name: "Pork shoulder", quantity: "800 g" },
      { name: "Char siu sauce", quantity: "4 tbsp" },
      { name: "Honey", quantity: "2 tbsp" },
      { name: "Chinese five-spice", quantity: "1 tsp" },
    ],
    seasonings: [
      { name: "Light soy sauce", quantity: "2 tbsp" },
      { name: "Hoisin sauce", quantity: "1 tbsp" },
      { name: "Shaoxing wine", quantity: "1 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Slice pork into strips and marinate overnight." },
      { stepNumber: 2, instruction: "Roast at 200°C for 25 minutes, basting with marinade." },
      { stepNumber: 3, instruction: "Brush with honey and roast 10 more minutes until charred at edges." },
      { stepNumber: 4, instruction: "Rest, slice, and serve over rice or noodles." },
    ],
    servings: 4,
    tags: ["Chinese", "Cantonese", "Pork", "Dinner", "Family"],
    image: "https://upload.wikimedia.org/wikipedia/commons/9/95/Charsiu.jpg",
    views: 760, likes: 88, ratingAverage: 4.6, ratingCount: 58,
  },
  {
    title: "Sweet and Sour Pork",
    description: "Crispy battered pork tossed with pineapple and bell peppers in a glossy, tangy tomato-based sauce.",
    tips: "Fry the pork twice for extra crunch and add the sauce just before serving.",
    mainIngredients: [
      { name: "Pork loin", quantity: "400 g" },
      { name: "Pineapple chunks", quantity: "150 g" },
      { name: "Bell pepper", quantity: "1 piece" },
      { name: "Onion", quantity: "1 piece" },
    ],
    seasonings: [
      { name: "Ketchup", quantity: "3 tbsp" },
      { name: "Rice vinegar", quantity: "2 tbsp" },
      { name: "Sugar", quantity: "2 tbsp" },
      { name: "Cornstarch", quantity: "100 g" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Cube pork, coat in seasoned cornstarch batter." },
      { stepNumber: 2, instruction: "Deep-fry until golden and drain." },
      { stepNumber: 3, instruction: "Stir-fry peppers, onion, and pineapple briefly." },
      { stepNumber: 4, instruction: "Add sauce, toss with pork, and serve immediately." },
    ],
    servings: 4,
    tags: ["Chinese", "Pork", "Dinner", "Family", "Easy"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Sweet_and_Sour_Pork_-_RV90_-_22_August_2024.jpg/960px-Sweet_and_Sour_Pork_-_RV90_-_22_August_2024.jpg",
    views: 690, likes: 74, ratingAverage: 4.4, ratingCount: 49,
  },
  {
    title: "Peking Duck",
    description: "Imperial Beijing roast duck with lacquered, crackling skin, carved tableside and wrapped in thin pancakes with hoisin and scallion.",
    tips: "A home version: roast the duck at high heat after air-drying the skin overnight.",
    mainIngredients: [
      { name: "Whole duck", quantity: "1 (2 kg)" },
      { name: "Mandarin pancakes", quantity: "12 pieces" },
      { name: "Scallions", quantity: "4 stalks" },
      { name: "Cucumber", quantity: "1 piece" },
    ],
    seasonings: [
      { name: "Maltose syrup", quantity: "2 tbsp" },
      { name: "Hoisin sauce", quantity: "4 tbsp" },
      { name: "Five-spice powder", quantity: "1 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Blanch duck, brush with syrup, and air-dry overnight." },
      { stepNumber: 2, instruction: "Roast at 200°C for about an hour until the skin is mahogany." },
      { stepNumber: 3, instruction: "Carve skin and meat into thin slices." },
      { stepNumber: 4, instruction: "Serve with pancakes, hoisin, scallions, and cucumber." },
    ],
    servings: 6,
    tags: ["Chinese", "Duck", "Dinner", "Family", "Special Occasion"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Peking_duck_by_Mr_Wabu_in_Beijing.jpg/960px-Peking_duck_by_Mr_Wabu_in_Beijing.jpg",
    views: 1050, likes: 132, ratingAverage: 4.9, ratingCount: 82,
  },
  {
    title: "Wonton Soup",
    description: "Delicate pork-and-shrimp wontons floating in a clear, fragrant broth with wilted greens and a whisper of sesame oil.",
    tips: "Fold wontons loosely and simmer gently so they stay tender.",
    mainIngredients: [
      { name: "Wonton wrappers", quantity: "24 pieces" },
      { name: "Ground pork", quantity: "200 g" },
      { name: "Shrimp", quantity: "100 g" },
      { name: "Bok choy", quantity: "150 g" },
    ],
    seasonings: [
      { name: "Chicken stock", quantity: "1 L" },
      { name: "Soy sauce", quantity: "1 tsp" },
      { name: "Sesame oil", quantity: "1 tsp" },
      { name: "White pepper", quantity: "1/4 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Mix pork, shrimp, and seasonings for the filling." },
      { stepNumber: 2, instruction: "Wrap a teaspoon of filling in each wrapper." },
      { stepNumber: 3, instruction: "Simmer wontons in stock until they float, about 4 minutes." },
      { stepNumber: 4, instruction: "Add bok choy, drizzle sesame oil, and serve." },
    ],
    servings: 4,
    tags: ["Chinese", "Cantonese", "Soup", "Pork", "Dinner", "Easy"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/FOOD_Wonton_Soup.jpg/960px-FOOD_Wonton_Soup.jpg",
    views: 640, likes: 66, ratingAverage: 4.5, ratingCount: 43,
  },
  {
    title: "Beef Chow Fun",
    description: "Wide rice noodles seared in a hot wok with beef, bean sprouts, and scallions, smoky and satisfying.",
    tips: "Use fresh ho fun noodles and let them char slightly against the wok for wok hei.",
    mainIngredients: [
      { name: "Fresh rice noodles", quantity: "500 g" },
      { name: "Beef sirloin", quantity: "300 g" },
      { name: "Bean sprouts", quantity: "150 g" },
      { name: "Scallions", quantity: "3 stalks" },
    ],
    seasonings: [
      { name: "Dark soy sauce", quantity: "2 tbsp" },
      { name: "Light soy sauce", quantity: "1 tbsp" },
      { name: "Oyster sauce", quantity: "1 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Marinate sliced beef in soy sauce and cornstarch." },
      { stepNumber: 2, instruction: "Sear beef in a smoking-hot wok; set aside." },
      { stepNumber: 3, instruction: "Stir-fry noodles with dark soy until lightly charred." },
      { stepNumber: 4, instruction: "Return beef with sprouts and scallions; toss and serve." },
    ],
    servings: 3,
    tags: ["Chinese", "Cantonese", "Noodles", "Beef", "Quick"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Dry_Fried_Beef_Ho_Fun_-_Ho_Chiak_2023-12-08.jpg/960px-Dry_Fried_Beef_Ho_Fun_-_Ho_Chiak_2023-12-08.jpg",
    views: 590, likes: 62, ratingAverage: 4.5, ratingCount: 40,
  },
  {
    title: "Dan Dan Noodles",
    description: "Chengdu street noodles in a fiery sesame-chili sauce with minced pork and preserved mustard greens.",
    tips: "Mix the sauce at the bottom of the bowl and fold the noodles through just before eating.",
    mainIngredients: [
      { name: "Wheat noodles", quantity: "300 g" },
      { name: "Ground pork", quantity: "200 g" },
      { name: "Ya cai (preserved mustard)", quantity: "3 tbsp" },
      { name: "Peanut butter or sesame paste", quantity: "2 tbsp" },
    ],
    seasonings: [
      { name: "Chili oil", quantity: "3 tbsp" },
      { name: "Sichuan peppercorn powder", quantity: "1 tsp" },
      { name: "Soy sauce", quantity: "2 tbsp" },
      { name: "Black vinegar", quantity: "1 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Whisk sesame paste, chili oil, vinegar, and seasonings in each bowl." },
      { stepNumber: 2, instruction: "Brown pork with ya cai until crisp." },
      { stepNumber: 3, instruction: "Boil noodles and drain." },
      { stepNumber: 4, instruction: "Top noodles with pork, scatter scallions, and toss at the table." },
    ],
    servings: 2,
    tags: ["Chinese", "Sichuan", "Noodles", "Pork", "Spicy", "Quick"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Dan_Dan_Noodles.jpg/960px-Dan_Dan_Noodles.jpg",
    views: 780, likes: 91, ratingAverage: 4.7, ratingCount: 55,
  },
  {
    title: "Yangzhou Fried Rice",
    description: "Golden fried rice studded with shrimp, char siu, peas, and egg — the benchmark of classic Chinese fried rice.",
    tips: "Use day-old rice and keep the heat high so grains stay separate.",
    mainIngredients: [
      { name: "Cooked rice", quantity: "600 g" },
      { name: "Shrimp", quantity: "120 g" },
      { name: "Char siu or ham", quantity: "100 g" },
      { name: "Eggs", quantity: "2 pieces" },
      { name: "Green peas", quantity: "80 g" },
    ],
    seasonings: [
      { name: "Light soy sauce", quantity: "1.5 tbsp" },
      { name: "White pepper", quantity: "1/4 tsp" },
      { name: "Salt", quantity: "1/2 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Scramble eggs in a hot wok and set aside." },
      { stepNumber: 2, instruction: "Stir-fry shrimp and char siu until just cooked." },
      { stepNumber: 3, instruction: "Add rice and toss until evenly coated and heated through." },
      { stepNumber: 4, instruction: "Fold in peas, eggs, and seasonings; serve immediately." },
    ],
    servings: 3,
    tags: ["Chinese", "Rice", "Quick", "Easy", "Lunch"],
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Yangzhou_fried_rice_and_drinks_25-09-2019.jpg",
    views: 570, likes: 58, ratingAverage: 4.3, ratingCount: 38,
  },
  {
    title: "Xiaolongbao (Soup Dumplings)",
    description: "Shanghai-style steamed dumplings with thin pleated skins and a hot, savory soup sealed inside.",
    tips: "Bite a small hole, sip the soup, then eat — never whole in one bite.",
    mainIngredients: [
      { name: "Flour", quantity: "300 g" },
      { name: "Ground pork", quantity: "300 g" },
      { name: "Pork aspic or gelatin stock", quantity: "150 g" },
      { name: "Ginger", quantity: "20 g" },
    ],
    seasonings: [
      { name: "Light soy sauce", quantity: "1 tbsp" },
      { name: "Shaoxing wine", quantity: "1 tbsp" },
      { name: "Sugar", quantity: "1 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Knead a soft dough and rest it 30 minutes." },
      { stepNumber: 2, instruction: "Mix pork with diced aspic and seasonings." },
      { stepNumber: 3, instruction: "Roll thin wrappers, pleat tightly around the filling." },
      { stepNumber: 4, instruction: "Steam 8 minutes over high heat and serve with black vinegar and ginger." },
    ],
    servings: 4,
    tags: ["Chinese", "Dumplings", "Pork", "Steamed", "Dinner"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Xiaolongbao_Shanghai.jpg/960px-Xiaolongbao_Shanghai.jpg",
    views: 830, likes: 104, ratingAverage: 4.8, ratingCount: 60,
  },
  {
    title: "Hot and Sour Soup",
    description: "A peppery, vinegar-sharp soup thick with tofu, bamboo shoots, mushrooms, and silky ribbons of egg.",
    tips: "Balance the vinegar and white pepper at the end — both should be assertive.",
    mainIngredients: [
      { name: "Firm tofu", quantity: "150 g" },
      { name: "Shiitake mushrooms", quantity: "6 pieces" },
      { name: "Bamboo shoots", quantity: "80 g" },
      { name: "Eggs", quantity: "1 piece" },
    ],
    seasonings: [
      { name: "Black rice vinegar", quantity: "3 tbsp" },
      { name: "White pepper", quantity: "1 tsp" },
      { name: "Soy sauce", quantity: "2 tbsp" },
      { name: "Cornstarch slurry", quantity: "3 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Simmer mushrooms and bamboo shoots in stock." },
      { stepNumber: 2, instruction: "Add tofu strips and seasonings." },
      { stepNumber: 3, instruction: "Thicken with cornstarch slurry." },
      { stepNumber: 4, instruction: "Drizzle in beaten egg, finish with vinegar and pepper." },
    ],
    servings: 4,
    tags: ["Chinese", "Sichuan", "Soup", "Spicy", "Vegetarian"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Hot-and-Sour-Soup-Bowl.jpg/960px-Hot-and-Sour-Soup-Bowl.jpg",
    views: 480, likes: 47, ratingAverage: 4.4, ratingCount: 33,
  },
  {
    title: "Scallion Pancakes",
    description: "Flaky, pan-fried flatbreads layered with scallions and sesame oil, crisp outside and chewy within.",
    tips: "Roll the dough thin and keep layers distinct for the flakiest result.",
    mainIngredients: [
      { name: "Flour", quantity: "300 g" },
      { name: "Scallions", quantity: "6 stalks" },
      { name: "Boiling water", quantity: "180 ml" },
    ],
    seasonings: [
      { name: "Sesame oil", quantity: "2 tbsp" },
      { name: "Salt", quantity: "1 tsp" },
      { name: "White pepper", quantity: "1/4 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Knead flour with boiling water into a soft dough; rest 30 minutes." },
      { stepNumber: 2, instruction: "Roll into a thin round, brush with sesame oil, scatter scallions." },
      { stepNumber: 3, instruction: "Roll into a coil, flatten, and roll out again." },
      { stepNumber: 4, instruction: "Pan-fry until golden and blistered on both sides." },
    ],
    servings: 3,
    tags: ["Chinese", "Breakfast", "Vegetarian", "Easy", "Quick"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Plate_of_scallion_pancakes.jpg/960px-Plate_of_scallion_pancakes.jpg",
    views: 430, likes: 45, ratingAverage: 4.5, ratingCount: 30,
  },
  {
    title: "Century Egg and Pork Congee",
    description: "Silky Cantonese rice porridge with ribbons of lean pork and creamy century eggs, topped with scallion and fried dough.",
    tips: "Soak the rice with a little oil before cooking for a smoother texture.",
    mainIngredients: [
      { name: "Rice", quantity: "150 g" },
      { name: "Century eggs", quantity: "2 pieces" },
      { name: "Lean pork", quantity: "150 g" },
      { name: "Scallions", quantity: "2 stalks" },
    ],
    seasonings: [
      { name: "Chicken stock", quantity: "1.5 L" },
      { name: "White pepper", quantity: "1/2 tsp" },
      { name: "Sesame oil", quantity: "1 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Simmer rice in stock, stirring often, until broken and creamy." },
      { stepNumber: 2, instruction: "Add marinated pork slices and cook through." },
      { stepNumber: 3, instruction: "Fold in chopped century eggs and simmer 3 minutes." },
      { stepNumber: 4, instruction: "Season with white pepper, sesame oil, and scallions." },
    ],
    servings: 4,
    tags: ["Chinese", "Cantonese", "Rice", "Breakfast", "Easy"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/A_century_eggs_and_Pork_Congee_from_Chi_Kee_Congee_Shop.jpg/960px-A_century_eggs_and_Pork_Congee_from_Chi_Kee_Congee_Shop.jpg",
    views: 410, likes: 39, ratingAverage: 4.3, ratingCount: 26,
  },
  {
    title: "Hong Shao Rou (Red Braised Pork Belly)",
    description: "Melt-in-your-mouth pork belly braised low and slow in soy, rock sugar, and Shaoxing wine until glossy mahogany.",
    tips: "Blanch the pork first and simmer gently for two hours for the softest texture.",
    mainIngredients: [
      { name: "Pork belly", quantity: "700 g" },
      { name: "Ginger", quantity: "30 g" },
      { name: "Scallions", quantity: "4 stalks" },
    ],
    seasonings: [
      { name: "Dark soy sauce", quantity: "2 tbsp" },
      { name: "Shaoxing wine", quantity: "150 ml" },
      { name: "Rock sugar", quantity: "40 g" },
      { name: "Star anise", quantity: "2 pieces" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Blanch pork belly cubes and drain." },
      { stepNumber: 2, instruction: "Caramelize rock sugar, then coat the pork." },
      { stepNumber: 3, instruction: "Add wine, soy, ginger, and star anise with water to cover." },
      { stepNumber: 4, instruction: "Braise gently for 2 hours, then reduce the sauce to a glaze." },
    ],
    servings: 4,
    tags: ["Chinese", "Pork", "Dinner", "Family"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Red_braised_pork_belly.jpg/960px-Red_braised_pork_belly.jpg",
    views: 720, likes: 79, ratingAverage: 4.6, ratingCount: 47,
  },
  {
    title: "Bibimbap",
    description: "A colorful bowl of rice topped with seasoned vegetables, beef, and a fried egg, mixed tableside with gochujang.",
    tips: "Arrange each topping separately for the classic look, then mix everything vigorously.",
    mainIngredients: [
      { name: "Cooked short-grain rice", quantity: "600 g" },
      { name: "Beef sirloin", quantity: "200 g" },
      { name: "Spinach", quantity: "100 g" },
      { name: "Carrot", quantity: "1 piece" },
      { name: "Zucchini", quantity: "1 piece" },
      { name: "Eggs", quantity: "4 pieces" },
    ],
    seasonings: [
      { name: "Gochujang", quantity: "3 tbsp" },
      { name: "Sesame oil", quantity: "2 tbsp" },
      { name: "Soy sauce", quantity: "1 tbsp" },
      { name: "Sesame seeds", quantity: "1 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Sauté each vegetable separately with a pinch of salt." },
      { stepNumber: 2, instruction: "Marinate and stir-fry the beef until caramelized." },
      { stepNumber: 3, instruction: "Fry eggs sunny-side up." },
      { stepNumber: 4, instruction: "Arrange everything over rice and serve with gochujang and sesame oil." },
    ],
    servings: 4,
    tags: ["Korean", "Rice", "Beef", "Healthy", "Lunch"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Korean.food-Bibimbap-02.jpg/960px-Korean.food-Bibimbap-02.jpg",
    views: 950, likes: 118, ratingAverage: 4.8, ratingCount: 73,
  },
  {
    title: "Kimchi Jjigae",
    description: "A bubbling Korean stew of fermented kimchi, pork, and tofu, deeply savory with a slow chili heat.",
    tips: "Use well-fermented (sour) kimchi for the deepest flavor.",
    mainIngredients: [
      { name: "Fermented kimchi", quantity: "300 g" },
      { name: "Pork belly", quantity: "150 g" },
      { name: "Tofu", quantity: "200 g" },
      { name: "Onion", quantity: "1/2 piece" },
    ],
    seasonings: [
      { name: "Gochugaru", quantity: "1 tbsp" },
      { name: "Soy sauce", quantity: "1 tbsp" },
      { name: "Sesame oil", quantity: "1 tsp" },
      { name: "Anchovy stock", quantity: "600 ml" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Render pork in a pot until lightly browned." },
      { stepNumber: 2, instruction: "Add kimchi and gochugaru; sauté 3 minutes." },
      { stepNumber: 3, instruction: "Pour in stock and simmer 15 minutes." },
      { stepNumber: 4, instruction: "Add tofu and onion; simmer 5 more minutes and serve bubbling." },
    ],
    servings: 3,
    tags: ["Korean", "Soup", "Spicy", "Pork", "Dinner"],
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Korean.cuisine-Kimchi_jjigae-01.jpg",
    views: 610, likes: 67, ratingAverage: 4.5, ratingCount: 41,
  },
  {
    title: "Japchae",
    description: "Glossy sweet potato glass noodles tossed with colorful stir-fried vegetables, sesame, and a touch of soy.",
    tips: "Season each vegetable lightly and combine at the end to keep colors bright.",
    mainIngredients: [
      { name: "Sweet potato noodles", quantity: "250 g" },
      { name: "Spinach", quantity: "150 g" },
      { name: "Carrot", quantity: "1 piece" },
      { name: "Shiitake mushrooms", quantity: "6 pieces" },
    ],
    seasonings: [
      { name: "Soy sauce", quantity: "3 tbsp" },
      { name: "Sesame oil", quantity: "2 tbsp" },
      { name: "Sugar", quantity: "1 tbsp" },
      { name: "Sesame seeds", quantity: "1 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Boil noodles until chewy, drain, and coat in sesame oil." },
      { stepNumber: 2, instruction: "Stir-fry each vegetable separately." },
      { stepNumber: 3, instruction: "Toss noodles with soy, sugar, and sesame oil." },
      { stepNumber: 4, instruction: "Combine with vegetables, finish with sesame seeds." },
    ],
    servings: 4,
    tags: ["Korean", "Noodles", "Vegetables", "Healthy", "Quick"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Homemade_Japchae%2C_Dhaka_03.jpg/960px-Homemade_Japchae%2C_Dhaka_03.jpg",
    views: 530, likes: 55, ratingAverage: 4.4, ratingCount: 36,
  },
  {
    title: "Yangnyeom Chicken (Korean Fried Chicken)",
    description: "Double-fried chicken with a shatteringly crisp crust, lacquered in a sticky, sweet-spicy gochujang glaze.",
    tips: "Double-fry: first at lower heat to cook, second at high heat for the crunch.",
    mainIngredients: [
      { name: "Chicken wings", quantity: "800 g" },
      { name: "Cornstarch", quantity: "150 g" },
      { name: "Garlic", quantity: "4 cloves" },
    ],
    seasonings: [
      { name: "Gochujang", quantity: "3 tbsp" },
      { name: "Gochugaru", quantity: "1 tbsp" },
      { name: "Honey", quantity: "2 tbsp" },
      { name: "Soy sauce", quantity: "1 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Coat wings in cornstarch and shake off excess." },
      { stepNumber: 2, instruction: "Fry at 160°C for 8 minutes; rest." },
      { stepNumber: 3, instruction: "Fry again at 190°C until deeply golden." },
      { stepNumber: 4, instruction: "Simmer sauce ingredients and toss the hot chicken to coat." },
    ],
    servings: 4,
    tags: ["Korean", "Chicken", "Spicy", "Fried", "Dinner", "Family"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Yangnyeom_Chicken_Korean_fried_chicken.jpg/960px-Yangnyeom_Chicken_Korean_fried_chicken.jpg",
    views: 880, likes: 102, ratingAverage: 4.7, ratingCount: 62,
  },
  {
    title: "Bulgogi",
    description: "Thin slices of beef marinated in a sweet-savory soy-pear sauce, grilled or pan-seared until caramelized.",
    tips: "Slice the beef paper-thin against the grain and don't crowd the pan.",
    mainIngredients: [
      { name: "Beef ribeye", quantity: "500 g" },
      { name: "Asian pear", quantity: "1/2 piece" },
      { name: "Onion", quantity: "1 piece" },
      { name: "Scallions", quantity: "3 stalks" },
    ],
    seasonings: [
      { name: "Soy sauce", quantity: "4 tbsp" },
      { name: "Sesame oil", quantity: "1 tbsp" },
      { name: "Brown sugar", quantity: "1 tbsp" },
      { name: "Garlic", quantity: "3 cloves" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Blend pear, garlic, and soy into a marinade." },
      { stepNumber: 2, instruction: "Marinate beef at least 2 hours." },
      { stepNumber: 3, instruction: "Sear over very high heat in batches until edges caramelize." },
      { stepNumber: 4, instruction: "Serve with rice and lettuce leaves." },
    ],
    servings: 4,
    tags: ["Korean", "Beef", "Dinner", "Easy", "Family"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Korean.cuisine-Bulgogi-01.jpg/960px-Korean.cuisine-Bulgogi-01.jpg",
    views: 810, likes: 93, ratingAverage: 4.6, ratingCount: 56,
  },
  {
    title: "Chicken Teriyaki",
    description: "Juicy pan-seared chicken glazed with a homemade teriyaki sauce of soy, mirin, and sake, shiny and rich.",
    tips: "Score the skin and press the thighs flat so they cook evenly and crisp.",
    mainIngredients: [
      { name: "Chicken thighs", quantity: "500 g" },
      { name: "Steamed rice", quantity: "600 g" },
      { name: "Broccoli", quantity: "200 g" },
    ],
    seasonings: [
      { name: "Soy sauce", quantity: "3 tbsp" },
      { name: "Mirin", quantity: "3 tbsp" },
      { name: "Sake", quantity: "2 tbsp" },
      { name: "Sugar", quantity: "1 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Sear chicken skin-side down until golden and crisp." },
      { stepNumber: 2, instruction: "Flip and cook through; remove and slice." },
      { stepNumber: 3, instruction: "Simmer soy, mirin, sake, and sugar into a glaze." },
      { stepNumber: 4, instruction: "Coat chicken in glaze and serve over rice with broccoli." },
    ],
    servings: 3,
    tags: ["Japanese", "Chicken", "Dinner", "Quick", "Easy"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Chicken_teriyaki_bento_box_-_Massachusetts.jpg/960px-Chicken_teriyaki_bento_box_-_Massachusetts.jpg",
    views: 700, likes: 71, ratingAverage: 4.5, ratingCount: 44,
  },
  {
    title: "Miso Soup",
    description: "The everyday Japanese soup of dashi and miso with silky tofu cubes and wakame, simple and restorative.",
    tips: "Never boil miso — whisk it in off the heat to keep its aroma.",
    mainIngredients: [
      { name: "Dashi stock", quantity: "800 ml" },
      { name: "White miso", quantity: "3 tbsp" },
      { name: "Silken tofu", quantity: "150 g" },
      { name: "Wakame seaweed", quantity: "1 tbsp" },
    ],
    seasonings: [
      { name: "Scallions", quantity: "2 stalks" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Heat dashi until steaming but not boiling." },
      { stepNumber: 2, instruction: "Add cubed tofu and rehydrated wakame." },
      { stepNumber: 3, instruction: "Turn off heat and whisk in miso until dissolved." },
      { stepNumber: 4, instruction: "Serve immediately with sliced scallions." },
    ],
    servings: 4,
    tags: ["Japanese", "Soup", "Vegetarian", "Healthy", "Quick"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Miso_Soup_001.jpg/960px-Miso_Soup_001.jpg",
    views: 460, likes: 44, ratingAverage: 4.3, ratingCount: 31,
  },
  {
    title: "Okonomiyaki",
    description: "A savory Japanese cabbage pancake griddled crisp and painted with okonomi sauce, mayo, and dancing bonito flakes.",
    tips: "Press the pancake lightly while cooking and flip only once.",
    mainIngredients: [
      { name: "Cabbage", quantity: "300 g" },
      { name: "Flour", quantity: "150 g" },
      { name: "Eggs", quantity: "3 pieces" },
      { name: "Bacon", quantity: "6 slices" },
    ],
    seasonings: [
      { name: "Dashi or water", quantity: "150 ml" },
      { name: "Okonomi sauce", quantity: "3 tbsp" },
      { name: "Mayonnaise", quantity: "2 tbsp" },
      { name: "Bonito flakes", quantity: "1 handful" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Whisk flour, dashi, and eggs; fold in shredded cabbage." },
      { stepNumber: 2, instruction: "Griddle the batter into thick rounds, topping with bacon." },
      { stepNumber: 3, instruction: "Cook 5 minutes per side until golden and cooked through." },
      { stepNumber: 4, instruction: "Brush with okonomi sauce, drizzle mayo, and scatter bonito flakes." },
    ],
    servings: 2,
    tags: ["Japanese", "Cabbage", "Dinner", "Easy"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Okonomiyaki_001.jpg/960px-Okonomiyaki_001.jpg",
    views: 560, likes: 57, ratingAverage: 4.5, ratingCount: 37,
  },
  {
    title: "Gyudon",
    description: "A fast Japanese beef bowl of paper-thin beef and onions simmered in a sweet dashi-soy broth over steamed rice.",
    tips: "Add a soft egg yolk on top for extra richness.",
    mainIngredients: [
      { name: "Thinly sliced beef", quantity: "300 g" },
      { name: "Onion", quantity: "1 piece" },
      { name: "Steamed rice", quantity: "600 g" },
    ],
    seasonings: [
      { name: "Dashi stock", quantity: "150 ml" },
      { name: "Soy sauce", quantity: "3 tbsp" },
      { name: "Mirin", quantity: "2 tbsp" },
      { name: "Sugar", quantity: "1 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Simmer onion in dashi, soy, mirin, and sugar until soft." },
      { stepNumber: 2, instruction: "Add beef slices and simmer until just cooked." },
      { stepNumber: 3, instruction: "Spoon beef and broth over hot rice." },
      { stepNumber: 4, instruction: "Top with beni shoga and a soft egg yolk if desired." },
    ],
    servings: 3,
    tags: ["Japanese", "Beef", "Rice", "Quick", "Lunch"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Gyuu-don_001.jpg/960px-Gyuu-don_001.jpg",
    views: 640, likes: 63, ratingAverage: 4.4, ratingCount: 39,
  },
  {
    title: "Tonkatsu",
    description: "Thick-cut pork cutlet in panko breadcrumbs, fried golden and served with tangy tonkatsu sauce and shredded cabbage.",
    tips: "Rest the cutlet 2 minutes after frying so the crust sets and the juices settle.",
    mainIngredients: [
      { name: "Pork loin chops", quantity: "4 pieces" },
      { name: "Panko breadcrumbs", quantity: "200 g" },
      { name: "Eggs", quantity: "2 pieces" },
      { name: "Cabbage", quantity: "200 g" },
    ],
    seasonings: [
      { name: "Flour", quantity: "80 g" },
      { name: "Tonkatsu sauce", quantity: "4 tbsp" },
      { name: "Salt", quantity: "1/2 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Pound chops lightly and season with salt." },
      { stepNumber: 2, instruction: "Coat in flour, beaten egg, then panko." },
      { stepNumber: 3, instruction: "Deep-fry at 170°C for 6-8 minutes until deep golden." },
      { stepNumber: 4, instruction: "Slice, drizzle tonkatsu sauce, and serve with shredded cabbage." },
    ],
    servings: 4,
    tags: ["Japanese", "Pork", "Fried", "Dinner", "Family"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Tonkatsu_of_Kimukatsu.jpg/960px-Tonkatsu_of_Kimukatsu.jpg",
    views: 680, likes: 69, ratingAverage: 4.5, ratingCount: 42,
  },
  {
    title: "Pho Bo",
    description: "Vietnamese beef noodle soup with a deeply aromatic broth of charred aromatics and spices, rice noodles, and rare beef.",
    tips: "Char the onion and ginger, and simmer the broth gently for clarity.",
    mainIngredients: [
      { name: "Beef bones", quantity: "1 kg" },
      { name: "Rice noodles", quantity: "400 g" },
      { name: "Beef sirloin", quantity: "250 g" },
      { name: "Onion and ginger", quantity: "1 each" },
    ],
    seasonings: [
      { name: "Star anise", quantity: "3 pieces" },
      { name: "Cinnamon stick", quantity: "1 piece" },
      { name: "Fish sauce", quantity: "3 tbsp" },
      { name: "Rock sugar", quantity: "1 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Blanch bones, then simmer with charred onion, ginger, and spices for 3 hours." },
      { stepNumber: 2, instruction: "Season broth with fish sauce and rock sugar." },
      { stepNumber: 3, instruction: "Soak and cook rice noodles; slice beef paper-thin." },
      { stepNumber: 4, instruction: "Assemble bowls and pour boiling broth over the beef; add herbs and lime." },
    ],
    servings: 4,
    tags: ["Vietnamese", "Soup", "Beef", "Noodles", "Dinner"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Pho_Bo_by_Banh_%26_Mee_in_Kirkgate_Market.jpg/960px-Pho_Bo_by_Banh_%26_Mee_in_Kirkgate_Market.jpg",
    views: 990, likes: 121, ratingAverage: 4.8, ratingCount: 76,
  },
  {
    title: "Banh Mi",
    description: "A crusty Vietnamese baguette filled with savory pork, pickled carrots and daikon, cucumber, cilantro, and a swipe of pâté.",
    tips: "Toast the baguette for contrast between the crisp crust and juicy fillings.",
    mainIngredients: [
      { name: "Baguette", quantity: "2 pieces" },
      { name: "Pork (or char siu)", quantity: "250 g" },
      { name: "Pickled carrot and daikon", quantity: "150 g" },
      { name: "Cucumber", quantity: "1/2 piece" },
      { name: "Cilantro", quantity: "1 handful" },
    ],
    seasonings: [
      { name: "Pâté", quantity: "2 tbsp" },
      { name: "Mayonnaise", quantity: "2 tbsp" },
      { name: "Maggi or soy sauce", quantity: "1 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Slice baguettes and toast until crisp." },
      { stepNumber: 2, instruction: "Spread pâté and mayonnaise on both sides." },
      { stepNumber: 3, instruction: "Layer pork, pickles, cucumber, and cilantro." },
      { stepNumber: 4, instruction: "Season with a few drops of Maggi and press closed." },
    ],
    servings: 2,
    tags: ["Vietnamese", "Pork", "Sandwich", "Quick", "Lunch"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Banh_mi_PaMi_1.jpg/960px-Banh_mi_PaMi_1.jpg",
    views: 740, likes: 82, ratingAverage: 4.6, ratingCount: 48,
  },
  {
    title: "Goi Cuon (Fresh Spring Rolls)",
    description: "Cool Vietnamese rice-paper rolls packed with shrimp, herbs, vermicelli, and crisp vegetables, with a peanut-hoisin dip.",
    tips: "Dip the rice paper in warm water only briefly — it softens as you roll.",
    mainIngredients: [
      { name: "Rice paper wrappers", quantity: "12 pieces" },
      { name: "Shrimp", quantity: "200 g" },
      { name: "Rice vermicelli", quantity: "100 g" },
      { name: "Lettuce and mint", quantity: "1 bunch" },
    ],
    seasonings: [
      { name: "Hoisin sauce", quantity: "3 tbsp" },
      { name: "Peanut butter", quantity: "1 tbsp" },
      { name: "Lime juice", quantity: "1 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Cook shrimp and vermicelli; cool completely." },
      { stepNumber: 2, instruction: "Soften each rice paper sheet in warm water." },
      { stepNumber: 3, instruction: "Layer herbs, noodles, and shrimp; roll tightly." },
      { stepNumber: 4, instruction: "Whisk hoisin, peanut butter, and lime into a dipping sauce." },
    ],
    servings: 3,
    tags: ["Vietnamese", "Healthy", "Quick", "Lunch", "Easy", "Seafood"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Spring_rolls_with_fish_sauce_for_dipping.jpg/960px-Spring_rolls_with_fish_sauce_for_dipping.jpg",
    views: 520, likes: 60, ratingAverage: 4.4, ratingCount: 34,
  },
  {
    title: "Pad Thai",
    description: "Thailand's famous stir-fried rice noodles with shrimp, egg, tofu, and peanuts in a tangy tamarind-fish sauce blend.",
    tips: "Soak noodles until just pliable and keep the wok hot for smoky flavor.",
    mainIngredients: [
      { name: "Rice stick noodles", quantity: "250 g" },
      { name: "Shrimp", quantity: "200 g" },
      { name: "Eggs", quantity: "2 pieces" },
      { name: "Firm tofu", quantity: "100 g" },
      { name: "Bean sprouts", quantity: "150 g" },
    ],
    seasonings: [
      { name: "Tamarind paste", quantity: "3 tbsp" },
      { name: "Fish sauce", quantity: "2 tbsp" },
      { name: "Palm sugar", quantity: "2 tbsp" },
      { name: "Crushed peanuts", quantity: "3 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Soak noodles in warm water until pliable." },
      { stepNumber: 2, instruction: "Stir-fry shrimp and tofu; push aside and scramble eggs." },
      { stepNumber: 3, instruction: "Add noodles and the tamarind-fish sauce mixture; toss until coated." },
      { stepNumber: 4, instruction: "Fold in bean sprouts and serve with peanuts, lime, and chili." },
    ],
    servings: 3,
    tags: ["Thai", "Noodles", "Quick", "Dinner", "Easy", "Seafood"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Thai-Pad-Thai_2023-06-04.jpg/960px-Thai-Pad-Thai_2023-06-04.jpg",
    views: 860, likes: 98, ratingAverage: 4.6, ratingCount: 59,
  },
  {
    title: "Thai Green Curry with Chicken",
    description: "Aromatic green curry of coconut milk, Thai basil, bamboo shoots, and chicken, vibrant with green chilies and makrut lime.",
    tips: "Fry the curry paste in coconut cream until the oil splits for maximum aroma.",
    mainIngredients: [
      { name: "Chicken thigh", quantity: "400 g" },
      { name: "Coconut milk", quantity: "400 ml" },
      { name: "Green curry paste", quantity: "3 tbsp" },
      { name: "Bamboo shoots", quantity: "150 g" },
      { name: "Thai basil", quantity: "1 handful" },
    ],
    seasonings: [
      { name: "Fish sauce", quantity: "2 tbsp" },
      { name: "Palm sugar", quantity: "1 tbsp" },
      { name: "Makrut lime leaves", quantity: "4 pieces" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Fry curry paste in thick coconut cream until fragrant." },
      { stepNumber: 2, instruction: "Add chicken and coat in the paste." },
      { stepNumber: 3, instruction: "Add remaining coconut milk, lime leaves, and bamboo shoots; simmer 15 minutes." },
      { stepNumber: 4, instruction: "Season with fish sauce and sugar; finish with Thai basil." },
    ],
    servings: 4,
    tags: ["Thai", "Curry", "Chicken", "Spicy", "Dinner"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Thai_Green_Curry_with_Rice.jpg/960px-Thai_Green_Curry_with_Rice.jpg",
    views: 790, likes: 86, ratingAverage: 4.7, ratingCount: 51,
  },
  {
    title: "Tom Yum Goong",
    description: "Thailand's hot and sour shrimp soup, perfumed with lemongrass, galangal, makrut lime leaves, and a chili-sharp kick.",
    tips: "Add the shrimp last so they stay tender in the fragrant broth.",
    mainIngredients: [
      { name: "Large shrimp", quantity: "400 g" },
      { name: "Lemongrass", quantity: "2 stalks" },
      { name: "Galangal", quantity: "30 g" },
      { name: "Mushrooms", quantity: "150 g" },
      { name: "Makrut lime leaves", quantity: "5 pieces" },
    ],
    seasonings: [
      { name: "Fish sauce", quantity: "3 tbsp" },
      { name: "Lime juice", quantity: "3 tbsp" },
      { name: "Thai chilies", quantity: "3 pieces" },
      { name: "Chili paste", quantity: "1 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Simmer lemongrass, galangal, and lime leaves in stock 10 minutes." },
      { stepNumber: 2, instruction: "Add mushrooms and simmer 3 minutes." },
      { stepNumber: 3, instruction: "Add shrimp and cook just until pink." },
      { stepNumber: 4, instruction: "Season with fish sauce, lime juice, and chilies; serve hot." },
    ],
    servings: 3,
    tags: ["Thai", "Soup", "Spicy", "Seafood", "Dinner"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Tom_yum_goong-01.jpg/960px-Tom_yum_goong-01.jpg",
    views: 830, likes: 95, ratingAverage: 4.7, ratingCount: 57,
  },
];

async function main() {
  console.log("Connecting to MongoDB...");
  const conn = await mongoose.createConnection(uri).asPromise();

  const users = conn.collection("users");
  let author = await users.findOne({ username: "rencipe" });
  if (!author) {
    const insertResult = await users.insertOne({
      username: "rencipe",
      displayName: "Rencipe Community",
      avatarUrl: "",
      email: "community@rencipe.local",
      phone: "",
      role: "user",
      language: "en",
      languageLocked: false,
      projectMode: true,
      passwordHash: "system-seeded",
      passwordSalt: "system-seeded",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    author = await users.findOne({ _id: insertResult.insertedId });
    console.log("Created community author:", author._id.toString());
  } else {
    console.log("Using existing community author:", author._id.toString());
  }

  const recipes = conn.collection("recipes");
  const existingTitles = new Set(
    (await recipes.find({}, { projection: { title: 1 } }).toArray()).map((r) => r.title)
  );

  const now = Date.now();
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < RECIPES.length; i++) {
    const recipe = RECIPES[i];
    if (existingTitles.has(recipe.title)) {
      console.log(`SKIP (exists): ${recipe.title}`);
      skipped++;
      continue;
    }

    const createdAt = new Date(now - (i * 2.5 + Math.random() * 1.8) * 24 * 60 * 60 * 1000);
    await recipes.insertOne({
      title: recipe.title,
      description: recipe.description,
      tips: recipe.tips,
      recipeOrigin: "shared",
      sharedSource: "Rencipe Community",
      sharedSourceLink: "",
      authorId: author._id,
      image: recipe.image,
      language: "en",
      component: false,
      isPublic: true,
      deletedAt: undefined,
      trashExpiresAt: undefined,
      mainIngredients: recipe.mainIngredients,
      seasonings: recipe.seasonings,
      steps: recipe.steps,
      servings: recipe.servings,
      tags: recipe.tags,
      likes: recipe.likes,
      views: recipe.views,
      ratingAverage: recipe.ratingAverage,
      ratingCount: recipe.ratingCount,
      createdAt,
      updatedAt: createdAt,
    });
    console.log(`INSERTED: ${recipe.title}`);
    inserted++;
  }

  console.log(`\nDone. inserted=${inserted} skipped=${skipped}`);
  await conn.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
