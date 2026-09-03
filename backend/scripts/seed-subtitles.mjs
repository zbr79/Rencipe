import mongoose from "mongoose";
import dotenv from "dotenv";
import RecipeModule from "../dist/models/Recipe.js";
const Recipe = RecipeModule.default || RecipeModule;

dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const MONGODB_URI = process.env.MONGO_URI;

const SUBTITLES = {
  "Kung Pao Chicken": "Spicy stir-fried chicken with peanuts and dried chilies",
  "Mapo Tofu": "Silken tofu in a fiery Sichuan bean sauce",
  "Char Siu (Cantonese BBQ Pork)": "Cantonese barbecue pork, glossy and sweet",
  "Sweet and Sour Pork": "Crispy pork in a tangy pineapple glaze",
  "Peking Duck": "Roasted duck with thin pancakes and hoisin",
  "Wonton Soup": "Pork and shrimp dumplings in clear broth",
  "Beef Chow Fun": "Wok-fried rice noodles with tender beef",
  "Dan Dan Noodles": "Sichuan noodles in a spicy sesame-peanut sauce",
  "Yangzhou Fried Rice": "Classic Cantonese fried rice with ham and shrimp",
  "Xiaolongbao (Soup Dumplings)": "Steamed dumplings filled with savory broth",
  "Hot and Sour Soup": "Peppery broth with tofu, mushrooms, and bamboo shoots",
  "Scallion Pancakes": "Flaky pan-fried flatbread with green onions",
  "Century Egg and Pork Congee": "Silky rice porridge with preserved egg and pork",
  "Hong Shao Rou (Red Braised Pork Belly)": "Caramelized pork belly braised in soy",
  "Bibimbap": "Korean rice bowl with vegetables, egg, and gochujang",
  "Kimchi Jjigae": "Hearty stew of aged kimchi and pork",
  "Japchae": "Stir-fried glass noodles with vegetables and beef",
  "Yangnyeom Chicken (Korean Fried Chicken)": "Crispy chicken in sweet-spicy gochujang glaze",
  "Bulgogi": "Thinly sliced marinated beef, grilled sweet and savory",
  "Chicken Teriyaki": "Glazed grilled chicken with glossy soy-sake sauce",
  "Miso Soup": "Umami broth with tofu, wakame, and scallions",
  "Okonomiyaki": "Savory Japanese cabbage pancake with toppings",
  "Gyudon": "Beef and onion simmered over steamed rice",
  "Tonkatsu": "Breaded, deep-fried pork cutlet with tonkatsu sauce",
  "Pho Bo": "Vietnamese beef noodle soup with fragrant broth",
  "Banh Mi": "Crispy baguette sandwich with pickled vegetables and pate",
  "Goi Cuon (Fresh Spring Rolls)": "Chilled rice-paper rolls with shrimp and herbs",
  "Pad Thai": "Stir-fried rice noodles with tamarind, peanuts, and shrimp",
  "Thai Green Curry with Chicken": "Coconut curry with Thai basil and bamboo shoots",
  "Tom Yum Goong": "Hot and sour shrimp soup with lemongrass",
  "Twice-Cooked Pork": "Sichuan pork belly stir-fried with leeks and chili bean paste",
  "Sichuan Boiled Fish (Shui Zhu Yu)": "Silky fish fillets in a numbing chili broth",
  "Chongqing Spicy Chicken (Laziji)": "Crispy fried chicken with dried chilies and Sichuan pepper",
  "Pad Krapow Gai (Thai Basil Chicken)": "Stir-fried chicken with holy basil, chili, and fish sauce",
  "Pad See Ew": "Wide rice noodles with soy, egg, and Chinese broccoli",
  "Mango Sticky Rice": "Sweet coconut rice with ripe mango",
  "Bun Bo Hue": "Spicy central-Vietnamese beef noodle soup",
  "Com Tam (Broken Rice with Grilled Pork)": "Grilled pork chop over broken rice with fish sauce",
  "Banh Xeo (Crispy Vietnamese Pancake)": "Sizzling turmeric crepe with pork, shrimp, and bean sprouts",
  "Tteokbokki": "Chewy rice cakes in spicy gochujang sauce",
  "Kimchi Fried Rice": "Wok-fried rice with kimchi, egg, and sesame",
  "Sundubu Jjigae": "Soft tofu stew with egg, seafood, and gochujang",
  "Shoyu Ramen": "Japanese noodles in a soy-based broth",
  "Chicken Katsu Curry": "Crispy fried chicken cutlet over Japanese curry rice",
  "Tempura": "Feather-light battered and fried seafood and vegetables",
  "Buddha's Delight (Lo Han Jai)": "Buddhist vegetarian stir-fry with mushrooms and tofu",
  "Hainanese Chicken Rice": "Poached chicken with fragrant rice and ginger sauce",
  "Braised Beef Brisket Noodle Soup": "Slow-braised brisket over springy noodles",
  "Har Gow": "Steamed shrimp dumplings with translucent wrappers",
};

async function main() {
  if (!MONGODB_URI) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  const entries = Object.entries(SUBTITLES);
  let updated = 0;
  for (const [title, subtitle] of entries) {
    const result = await Recipe.updateOne({ title }, { $set: { subtitle } });
    if (result.modifiedCount > 0) updated++;
    else {
      const exists = await Recipe.exists({ title });
      if (!exists) console.log(`  NOT FOUND: ${title}`);
    }
  }
  console.log(`Updated ${updated}/${entries.length} recipes with second names.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});