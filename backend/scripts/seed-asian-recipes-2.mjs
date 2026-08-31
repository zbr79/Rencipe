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
    title: "Twice-Cooked Pork",
    description: "Sichuan classic of pork belly first simmered, then wok-seared until crisp with leeks, fermented black beans, and chili bean paste.",
    tips: "The pork must be fully cooled after boiling so it slices cleanly and chars without sticking.",
    mainIngredients: [
      { name: "Pork belly", quantity: "500 g" },
      { name: "Leeks", quantity: "2 stalks" },
      { name: "Doubanjiang", quantity: "1.5 tbsp" },
      { name: "Fermented black beans", quantity: "1 tsp" },
    ],
    seasonings: [
      { name: "Soy sauce", quantity: "1 tbsp" },
      { name: "Sugar", quantity: "1 tsp" },
      { name: "Sichuan peppercorns", quantity: "1/2 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Simmer pork belly with ginger 25 minutes; cool completely." },
      { stepNumber: 2, instruction: "Slice thinly across the grain." },
      { stepNumber: 3, instruction: "Sear slices in a hot wok until edges curl and brown." },
      { stepNumber: 4, instruction: "Add doubanjiang, black beans, and leeks; toss 2 minutes and serve." },
    ],
    servings: 3,
    tags: ["Chinese", "Sichuan", "Pork", "Spicy", "Dinner"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Twice-cooked_Pork_%E5%9B%9E%E9%94%85%E8%82%89_%281648213963%29.jpg/960px-Twice-cooked_Pork_%E5%9B%9E%E9%94%85%E8%82%89_%281648213963%29.jpg",
    views: 650, likes: 72, ratingAverage: 4.6, ratingCount: 45,
  },
  {
    title: "Sichuan Boiled Fish (Shui Zhu Yu)",
    description: "Tender fish slices poached in a fiery chili-oil broth, topped with sizzling Sichuan pepper and dried chilies.",
    tips: "Blanch the bean sprouts and cabbage as the base, and pour the hot oil at the end for the signature aroma.",
    mainIngredients: [
      { name: "White fish fillets", quantity: "500 g" },
      { name: "Bean sprouts", quantity: "200 g" },
      { name: "Napa cabbage", quantity: "200 g" },
      { name: "Dried chilies", quantity: "15 pieces" },
    ],
    seasonings: [
      { name: "Sichuan peppercorns", quantity: "1 tbsp" },
      { name: "Doubanjiang", quantity: "2 tbsp" },
      { name: "Chili powder", quantity: "1 tbsp" },
      { name: "Cornstarch", quantity: "2 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Slice fish thinly and marinate with cornstarch and salt." },
      { stepNumber: 2, instruction: "Blanch bean sprouts and cabbage; place in a serving bowl." },
      { stepNumber: 3, instruction: "Simmer doubanjiang broth and poach fish slices 2 minutes." },
      { stepNumber: 4, instruction: "Top with chilies and peppercorns, then pour over smoking-hot oil." },
    ],
    servings: 4,
    tags: ["Chinese", "Sichuan", "Seafood", "Spicy", "Soup", "Dinner"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Sliced_Fish_in_Hot_Chili_Oil.jpg/960px-Sliced_Fish_in_Hot_Chili_Oil.jpg",
    views: 710, likes: 84, ratingAverage: 4.7, ratingCount: 52,
  },
  {
    title: "Chongqing Spicy Chicken (Laziji)",
    description: "Bite-sized chicken buried in a mountain of dried chilies and Sichuan pepper — crisp, fragrant, and fiercely addictive.",
    tips: "Marinate the chicken in Shaoxing wine and fry in small batches for an even crisp.",
    mainIngredients: [
      { name: "Chicken thighs", quantity: "500 g" },
      { name: "Dried red chilies", quantity: "60 g" },
      { name: "Garlic", quantity: "4 cloves" },
      { name: "Scallions", quantity: "3 stalks" },
    ],
    seasonings: [
      { name: "Sichuan peppercorns", quantity: "1 tbsp" },
      { name: "Shaoxing wine", quantity: "2 tbsp" },
      { name: "Soy sauce", quantity: "1 tbsp" },
      { name: "Sugar", quantity: "1 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Cut chicken into small pieces and marinate with wine and soy." },
      { stepNumber: 2, instruction: "Deep-fry in batches until golden and crisp." },
      { stepNumber: 3, instruction: "Toast dried chilies and peppercorns in a little oil." },
      { stepNumber: 4, instruction: "Toss chicken with the chilies, garlic, and scallions." },
    ],
    servings: 3,
    tags: ["Chinese", "Sichuan", "Chicken", "Spicy", "Dinner"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Laziji_%E8%BE%A3%E5%AD%90%E9%B8%A1.jpg/960px-Laziji_%E8%BE%A3%E5%AD%90%E9%B8%A1.jpg",
    views: 690, likes: 81, ratingAverage: 4.6, ratingCount: 48,
  },
  {
    title: "Pad Krapow Gai (Thai Basil Chicken)",
    description: "Thailand's favorite quick meal — minced chicken stir-fried with holy basil, chilies, and garlic, served over rice with a crispy fried egg.",
    tips: "Use holy basil (krapow) if you can find it; Thai sweet basil is a fine substitute.",
    mainIngredients: [
      { name: "Minced chicken", quantity: "400 g" },
      { name: "Holy basil leaves", quantity: "2 handfuls" },
      { name: "Garlic", quantity: "5 cloves" },
      { name: "Thai chilies", quantity: "5 pieces" },
      { name: "Eggs", quantity: "2 pieces" },
    ],
    seasonings: [
      { name: "Fish sauce", quantity: "2 tbsp" },
      { name: "Oyster sauce", quantity: "1 tbsp" },
      { name: "Dark soy sauce", quantity: "1 tsp" },
      { name: "Sugar", quantity: "1 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Pound garlic and chilies into a rough paste." },
      { stepNumber: 2, instruction: "Stir-fry the paste and chicken over high heat." },
      { stepNumber: 3, instruction: "Season with fish sauce, oyster sauce, and sugar." },
      { stepNumber: 4, instruction: "Fold in basil off the heat; serve with rice and a fried egg." },
    ],
    servings: 2,
    tags: ["Thai", "Chicken", "Spicy", "Quick", "Lunch"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Kraphao_mu_khai_dao.jpg/960px-Kraphao_mu_khai_dao.jpg",
    views: 740, likes: 86, ratingAverage: 4.7, ratingCount: 50,
  },
  {
    title: "Pad See Ew",
    description: "Wide rice noodles charred in sweet soy with chicken, Chinese broccoli, and egg — smoky, savory, and satisfying.",
    tips: "Cook the noodles undisturbed for a minute to develop the charred wok flavor.",
    mainIngredients: [
      { name: "Wide rice noodles", quantity: "400 g" },
      { name: "Chicken breast", quantity: "250 g" },
      { name: "Chinese broccoli", quantity: "200 g" },
      { name: "Eggs", quantity: "2 pieces" },
    ],
    seasonings: [
      { name: "Dark sweet soy sauce", quantity: "2 tbsp" },
      { name: "Oyster sauce", quantity: "1 tbsp" },
      { name: "Light soy sauce", quantity: "1 tbsp" },
      { name: "White pepper", quantity: "1/4 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Stir-fry chicken until just cooked; set aside." },
      { stepNumber: 2, instruction: "Scramble eggs, then add noodles and sweet soy." },
      { stepNumber: 3, instruction: "Press noodles against the wok to char slightly." },
      { stepNumber: 4, instruction: "Add broccoli stems, chicken, and sauces; toss and serve." },
    ],
    servings: 3,
    tags: ["Thai", "Noodles", "Quick", "Dinner", "Easy"],
    image: "https://www.themealdb.com/images/media/meals/uuuspp1468263334.jpg",
    views: 620, likes: 68, ratingAverage: 4.5, ratingCount: 41,
  },
  {
    title: "Mango Sticky Rice",
    description: "Sweet glutinous rice steamed with coconut cream, served with ripe mango and a drizzle of salted coconut sauce.",
    tips: "Soak the rice for at least 4 hours and steam, don't boil, for the perfect chewy texture.",
    mainIngredients: [
      { name: "Glutinous rice", quantity: "300 g" },
      { name: "Coconut milk", quantity: "400 ml" },
      { name: "Ripe mangoes", quantity: "2 pieces" },
    ],
    seasonings: [
      { name: "Sugar", quantity: "80 g" },
      { name: "Salt", quantity: "1/2 tsp" },
      { name: "Toasted sesame seeds", quantity: "1 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Soak glutinous rice 4 hours; steam until tender." },
      { stepNumber: 2, instruction: "Warm coconut milk with sugar and salt." },
      { stepNumber: 3, instruction: "Fold half the coconut sauce into the hot rice; rest 20 minutes." },
      { stepNumber: 4, instruction: "Serve with sliced mango and remaining sauce." },
    ],
    servings: 4,
    tags: ["Thai", "Dessert", "Rice", "Vegetarian", "Easy"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Mango_sticky_rice_served_in_Thailand.jpg/960px-Mango_sticky_rice_served_in_Thailand.jpg",
    views: 580, likes: 66, ratingAverage: 4.6, ratingCount: 39,
  },
  {
    title: "Bun Bo Hue",
    description: "The spicier cousin of pho — a lemongrass-scented beef broth with thick rice noodles, beef shank, and pork, finished with shrimp paste.",
    tips: "The broth gets its depth from charred lemongrass, beef bones, and a little fermented shrimp paste.",
    mainIngredients: [
      { name: "Beef shank and bones", quantity: "1 kg" },
      { name: "Thick rice noodles", quantity: "400 g" },
      { name: "Lemongrass", quantity: "3 stalks" },
      { name: "Pork hock", quantity: "300 g" },
    ],
    seasonings: [
      { name: "Shrimp paste", quantity: "1 tbsp" },
      { name: "Fish sauce", quantity: "3 tbsp" },
      { name: "Chili oil", quantity: "1 tbsp" },
      { name: "Annatto seeds", quantity: "1 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Simmer beef bones, shank, and pork hock with charred lemongrass for 3 hours." },
      { stepNumber: 2, instruction: "Season broth with shrimp paste, fish sauce, and annatto oil." },
      { stepNumber: 3, instruction: "Cook noodles and slice the meats." },
      { stepNumber: 4, instruction: "Assemble bowls with herbs and chili oil over the hot broth." },
    ],
    servings: 4,
    tags: ["Vietnamese", "Soup", "Beef", "Noodles", "Spicy", "Dinner"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/B%C3%BAn_b%C3%B2_Hu%E1%BA%BF_minh28397.jpg/960px-B%C3%BAn_b%C3%B2_Hu%E1%BA%BF_minh28397.jpg",
    views: 560, likes: 64, ratingAverage: 4.5, ratingCount: 37,
  },
  {
    title: "Com Tam (Broken Rice with Grilled Pork)",
    description: "A Saigon classic — fragrant broken rice with smoky grilled pork chop, shredded pork skin, egg cake, and nuoc cham.",
    tips: "Marinate the pork overnight in lemongrass and fish sauce for maximum flavor.",
    mainIngredients: [
      { name: "Broken rice", quantity: "400 g" },
      { name: "Pork chops", quantity: "4 pieces" },
      { name: "Lemongrass", quantity: "2 stalks" },
      { name: "Cucumber and tomato", quantity: "1 each" },
    ],
    seasonings: [
      { name: "Fish sauce", quantity: "3 tbsp" },
      { name: "Honey", quantity: "1 tbsp" },
      { name: "Nuoc cham", quantity: "4 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Marinate pork chops with lemongrass, fish sauce, and honey." },
      { stepNumber: 2, instruction: "Grill or pan-sear until caramelized at the edges." },
      { stepNumber: 3, instruction: "Steam broken rice until fluffy." },
      { stepNumber: 4, instruction: "Serve rice with the chop, cucumber, tomato, and nuoc cham." },
    ],
    servings: 4,
    tags: ["Vietnamese", "Rice", "Pork", "Lunch", "Family"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Com-Tam-2008.jpg/960px-Com-Tam-2008.jpg",
    views: 520, likes: 57, ratingAverage: 4.4, ratingCount: 35,
  },
  {
    title: "Banh Xeo (Crispy Vietnamese Pancake)",
    description: "A golden, crackling turmeric-rice crepe folded around shrimp, pork, and bean sprouts, wrapped in herbs and dipped in nuoc cham.",
    tips: "Add a splash of beer to the batter for extra crispness, and pour it into a very hot pan.",
    mainIngredients: [
      { name: "Rice flour", quantity: "200 g" },
      { name: "Shrimp", quantity: "200 g" },
      { name: "Pork belly", quantity: "150 g" },
      { name: "Bean sprouts", quantity: "150 g" },
      { name: "Turmeric", quantity: "1 tsp" },
    ],
    seasonings: [
      { name: "Coconut milk", quantity: "100 ml" },
      { name: "Fish sauce", quantity: "1 tbsp" },
      { name: "Nuoc cham", quantity: "4 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Whisk rice flour, turmeric, coconut milk, and water into a thin batter." },
      { stepNumber: 2, instruction: "Fry pork and shrimp in a hot pan; pour batter around them." },
      { stepNumber: 3, instruction: "Add bean sprouts, cover, and cook until the edges are crisp." },
      { stepNumber: 4, instruction: "Fold and serve with herbs, lettuce, and nuoc cham." },
    ],
    servings: 3,
    tags: ["Vietnamese", "Pork", "Lunch", "Easy", "Family"],
    image: "https://www.themealdb.com/images/media/meals/xrv78g1782769859.jpg",
    views: 470, likes: 52, ratingAverage: 4.4, ratingCount: 32,
  },
  {
    title: "Tteokbokki",
    description: "Chewy rice cakes simmered in a glossy gochujang sauce with fish cake and a soft-boiled egg — Korea's favorite street food.",
    tips: "Soak refrigerated rice cakes in warm water for 10 minutes so they soften evenly.",
    mainIngredients: [
      { name: "Cylindrical rice cakes", quantity: "400 g" },
      { name: "Fish cake sheets", quantity: "2 pieces" },
      { name: "Scallions", quantity: "3 stalks" },
      { name: "Eggs", quantity: "2 pieces" },
    ],
    seasonings: [
      { name: "Gochujang", quantity: "2 tbsp" },
      { name: "Gochugaru", quantity: "1 tbsp" },
      { name: "Sugar", quantity: "1 tbsp" },
      { name: "Soy sauce", quantity: "1 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Simmer gochujang, gochugaru, and sugar in anchovy stock." },
      { stepNumber: 2, instruction: "Add rice cakes and fish cake; simmer 10 minutes." },
      { stepNumber: 3, instruction: "Add soft-boiled eggs and scallions." },
      { stepNumber: 4, instruction: "Reduce until the sauce is glossy and coats the cakes." },
    ],
    servings: 3,
    tags: ["Korean", "Spicy", "Quick", "Lunch"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Korean.snacks-Tteokbokki-08.jpg/960px-Korean.snacks-Tteokbokki-08.jpg",
    views: 670, likes: 77, ratingAverage: 4.6, ratingCount: 46,
  },
  {
    title: "Kimchi Fried Rice",
    description: "Leftover rice fried with well-fermented kimchi, gochujang, and sesame, topped with a runny fried egg.",
    tips: "Use day-old rice and sour kimchi, and fry the kimchi first to deepen its flavor.",
    mainIngredients: [
      { name: "Cooked rice", quantity: "500 g" },
      { name: "Fermented kimchi", quantity: "250 g" },
      { name: "Eggs", quantity: "2 pieces" },
      { name: "Scallions", quantity: "2 stalks" },
    ],
    seasonings: [
      { name: "Gochujang", quantity: "1 tbsp" },
      { name: "Sesame oil", quantity: "1 tbsp" },
      { name: "Soy sauce", quantity: "1 tsp" },
      { name: "Roasted seaweed", quantity: "1 sheet" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Chop kimchi and stir-fry in sesame oil until fragrant." },
      { stepNumber: 2, instruction: "Add rice and gochujang; fry until slightly crisp." },
      { stepNumber: 3, instruction: "Season with soy and fold in scallions." },
      { stepNumber: 4, instruction: "Top with a fried egg and crushed seaweed." },
    ],
    servings: 2,
    tags: ["Korean", "Rice", "Spicy", "Quick", "Lunch"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Kimchi_Fried_Rice%2C_Farm_Egg.jpg/960px-Kimchi_Fried_Rice%2C_Farm_Egg.jpg",
    views: 600, likes: 70, ratingAverage: 4.5, ratingCount: 42,
  },
  {
    title: "Sundubu Jjigae",
    description: "Silky soft tofu stew bubbling with seafood, egg, and a deep chili broth, served in a hot stone pot.",
    tips: "Crack the egg in at the very end and stir it into the bubbling stew at the table.",
    mainIngredients: [
      { name: "Soft tofu", quantity: "400 g" },
      { name: "Clams or shrimp", quantity: "150 g" },
      { name: "Egg", quantity: "1 piece" },
      { name: "Scallions", quantity: "2 stalks" },
    ],
    seasonings: [
      { name: "Gochugaru", quantity: "2 tbsp" },
      { name: "Sesame oil", quantity: "1 tbsp" },
      { name: "Fish sauce", quantity: "1 tsp" },
      { name: "Anchovy stock", quantity: "600 ml" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Sauté gochugaru and garlic in sesame oil in a stone pot." },
      { stepNumber: 2, instruction: "Add stock and bring to a boil." },
      { stepNumber: 3, instruction: "Add tofu and seafood; simmer 5 minutes." },
      { stepNumber: 4, instruction: "Crack in an egg and finish with scallions." },
    ],
    servings: 2,
    tags: ["Korean", "Soup", "Spicy", "Tofu", "Dinner", "Healthy"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Korean_stew-Sundubu_jjigae-05.jpg/960px-Korean_stew-Sundubu_jjigae-05.jpg",
    views: 640, likes: 73, ratingAverage: 4.6, ratingCount: 44,
  },
  {
    title: "Shoyu Ramen",
    description: "Tokyo-style ramen with a clear soy-seasoned chicken broth, curly noodles, chashu pork, bamboo shoots, and a soft egg.",
    tips: "Season the tare (soy base) strongly — it carries the whole bowl.",
    mainIngredients: [
      { name: "Fresh ramen noodles", quantity: "300 g" },
      { name: "Chicken broth", quantity: "1 L" },
      { name: "Chashu pork slices", quantity: "150 g" },
      { name: "Soft-boiled eggs", quantity: "2 pieces" },
      { name: "Bamboo shoots", quantity: "80 g" },
    ],
    seasonings: [
      { name: "Soy sauce", quantity: "4 tbsp" },
      { name: "Mirin", quantity: "2 tbsp" },
      { name: "Scallions", quantity: "2 stalks" },
      { name: "Nori sheets", quantity: "2 pieces" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Simmer chicken broth with aromatics for 1 hour." },
      { stepNumber: 2, instruction: "Blend soy sauce and mirin into a tare." },
      { stepNumber: 3, instruction: "Boil noodles until springy; drain well." },
      { stepNumber: 4, instruction: "Assemble with tare, broth, chashu, egg, and toppings." },
    ],
    servings: 2,
    tags: ["Japanese", "Noodles", "Soup", "Dinner"],
    image: "https://www.themealdb.com/images/media/meals/ip5xtp1769779958.jpg",
    views: 810, likes: 95, ratingAverage: 4.7, ratingCount: 58,
  },
  {
    title: "Chicken Katsu Curry",
    description: "Crispy panko chicken cutlet over rice, smothered in a rich Japanese curry sauce with carrots and potatoes.",
    tips: "Fry the cutlet after the curry is done so both stay at their best — crisp and hot.",
    mainIngredients: [
      { name: "Chicken breast", quantity: "2 pieces" },
      { name: "Panko breadcrumbs", quantity: "150 g" },
      { name: "Japanese curry roux", quantity: "100 g" },
      { name: "Onion, carrot, potato", quantity: "1 each" },
    ],
    seasonings: [
      { name: "Eggs", quantity: "1 piece" },
      { name: "Flour", quantity: "60 g" },
      { name: "Cooked rice", quantity: "400 g" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Sauté vegetables, add water, and simmer with curry roux." },
      { stepNumber: 2, instruction: "Bread chicken in flour, egg, and panko." },
      { stepNumber: 3, instruction: "Deep-fry until deep golden; rest and slice." },
      { stepNumber: 4, instruction: "Serve over rice with the curry poured alongside." },
    ],
    servings: 2,
    tags: ["Japanese", "Curry", "Chicken", "Dinner", "Easy", "Family"],
    image: "https://www.themealdb.com/images/media/meals/vwrpps1503068729.jpg",
    views: 700, likes: 78, ratingAverage: 4.6, ratingCount: 47,
  },
  {
    title: "Tempura",
    description: "Light, lacy-crisp battered shrimp and vegetables fried in a delicate ice-cold batter, served with tentsuyu dipping sauce.",
    tips: "Keep the batter ice-cold and barely mix it — lumps are what make it shatter.",
    mainIngredients: [
      { name: "Large shrimp", quantity: "12 pieces" },
      { name: "Sweet potato", quantity: "1 piece" },
      { name: "Eggplant", quantity: "1 piece" },
      { name: "Shiso leaves", quantity: "6 pieces" },
    ],
    seasonings: [
      { name: "Flour", quantity: "100 g" },
      { name: "Ice water", quantity: "200 ml" },
      { name: "Tentsuyu sauce", quantity: "120 ml" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Whisk flour with ice-cold water into a lumpy batter." },
      { stepNumber: 2, instruction: "Dip each ingredient briefly and fry at 170°C." },
      { stepNumber: 3, instruction: "Drain well; keep the crust light and crisp." },
      { stepNumber: 4, instruction: "Serve immediately with tentsuyu and grated daikon." },
    ],
    servings: 3,
    tags: ["Japanese", "Seafood", "Fried", "Dinner"],
    image: "https://www.themealdb.com/images/media/meals/xnv4wf1763756529.jpg",
    views: 540, likes: 56, ratingAverage: 4.4, ratingCount: 36,
  },
  {
    title: "Buddha's Delight (Lo Han Jai)",
    description: "The classic Buddhist vegetarian medley of tofu, mushrooms, bamboo shoots, and glass noodles in a light savory sauce.",
    tips: "Rehydrate the dried mushrooms and reserve the soaking water — it is the base of the sauce.",
    mainIngredients: [
      { name: "Firm tofu", quantity: "200 g" },
      { name: "Dried shiitake mushrooms", quantity: "8 pieces" },
      { name: "Bamboo shoots", quantity: "100 g" },
      { name: "Glass noodles", quantity: "80 g" },
      { name: "Bok choy", quantity: "200 g" },
    ],
    seasonings: [
      { name: "Vegetarian oyster sauce", quantity: "2 tbsp" },
      { name: "Light soy sauce", quantity: "1 tbsp" },
      { name: "Sesame oil", quantity: "1 tsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Soak mushrooms; reserve the soaking water." },
      { stepNumber: 2, instruction: "Fry tofu until golden; set aside." },
      { stepNumber: 3, instruction: "Stir-fry mushrooms, bamboo shoots, and bok choy." },
      { stepNumber: 4, instruction: "Add noodles, sauce, and mushroom water; simmer until glossy." },
    ],
    servings: 4,
    tags: ["Chinese", "Vegetarian", "Healthy", "Dinner", "Easy"],
    image: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Boeddha%27s_Delight.jpg",
    views: 390, likes: 42, ratingAverage: 4.3, ratingCount: 28,
  },
  {
    title: "Hainanese Chicken Rice",
    description: "Poached silky chicken over fragrant rice cooked in chicken fat, with ginger-scallion sauce and a clear broth on the side.",
    tips: "Poach the chicken gently below a simmer and plunge it into ice water for that silky skin.",
    mainIngredients: [
      { name: "Whole chicken", quantity: "1 (1.2 kg)" },
      { name: "Jasmine rice", quantity: "400 g" },
      { name: "Ginger", quantity: "60 g" },
      { name: "Scallions", quantity: "4 stalks" },
    ],
    seasonings: [
      { name: "Sesame oil", quantity: "1 tbsp" },
      { name: "Light soy sauce", quantity: "2 tbsp" },
      { name: "Chicken fat", quantity: "2 tbsp" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Poach chicken with ginger and scallion for 35 minutes." },
      { stepNumber: 2, instruction: "Ice-bathe the chicken; keep the poaching broth." },
      { stepNumber: 3, instruction: "Fry rice in chicken fat, then cook with the broth." },
      { stepNumber: 4, instruction: "Serve sliced chicken over rice with ginger-scallion sauce." },
    ],
    servings: 4,
    tags: ["Chinese", "Chicken", "Rice", "Lunch", "Easy"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Hainanese_chicken_rice.jpg/960px-Hainanese_chicken_rice.jpg",
    views: 730, likes: 82, ratingAverage: 4.6, ratingCount: 49,
  },
  {
    title: "Braised Beef Brisket Noodle Soup",
    description: "Meltingly tender Cantonese-style beef brisket in a rich five-spice broth over noodles with blanched greens.",
    tips: "Braise the brisket a day ahead — the flavor deepens overnight.",
    mainIngredients: [
      { name: "Beef brisket", quantity: "800 g" },
      { name: "Egg noodles", quantity: "400 g" },
      { name: "Daikon", quantity: "300 g" },
      { name: "Bok choy", quantity: "200 g" },
    ],
    seasonings: [
      { name: "Dark soy sauce", quantity: "2 tbsp" },
      { name: "Oyster sauce", quantity: "2 tbsp" },
      { name: "Star anise", quantity: "2 pieces" },
      { name: "Rock sugar", quantity: "20 g" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Blanch brisket and cut into large chunks." },
      { stepNumber: 2, instruction: "Braise with soy, oyster sauce, star anise, and daikon for 2 hours." },
      { stepNumber: 3, instruction: "Cook noodles and blanch bok choy." },
      { stepNumber: 4, instruction: "Ladle brisket and broth over noodles." },
    ],
    servings: 4,
    tags: ["Cantonese", "Noodles", "Soup", "Beef", "Dinner"],
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Beef_brisket_noodle_soup.jpg/960px-Beef_brisket_noodle_soup.jpg",
    views: 660, likes: 75, ratingAverage: 4.6, ratingCount: 43,
  },
];

async function main() {
  console.log("Connecting to MongoDB...");
  const conn = await mongoose.createConnection(uri).asPromise();

  const users = conn.collection("users");
  const author = await users.findOne({ username: "rencipe" });
  if (!author) {
    console.error("Community author not found — run seed-asian-recipes.mjs first");
    process.exit(1);
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

    const createdAt = new Date(now - (i * 2.2 + Math.random() * 1.5) * 24 * 60 * 60 * 1000);
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
