import mongoose from "mongoose";
import dotenv from "dotenv";
import RecipeModule from "../dist/models/Recipe.js";

const Recipe = RecipeModule.default || RecipeModule;

dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const SHORT_SUBTITLES = {
  "Kung Pao Chicken": "Chicken with peanuts and chilies",
  "Mapo Tofu": "Tofu in spicy bean sauce",
  "Sweet and Sour Pork": "Tangy glazed pork",
  "Peking Duck": "Roast duck with pancakes",
  "Wonton Soup": "Dumplings in clear broth",
  "Beef Chow Fun": "Stir-fried beef noodles",
  "Dan Dan Noodles": "Spicy sesame noodles",
  "Yangzhou Fried Rice": "Cantonese-style fried rice",
  "Hot and Sour Soup": "Peppery sour broth",
  "Scallion Pancakes": "Crispy green-onion flatbread",
  "Century Egg and Pork Congee": "Silky pork rice porridge",
  "Bibimbap": "Korean rice bowl",
  "Kimchi Jjigae": "Kimchi stew",
  "Japchae": "Glass noodles with vegetables",
  "Bulgogi": "Grilled marinated beef",
  "Chicken Teriyaki": "Glazed grilled chicken",
  "Miso Soup": "Soybean paste soup",
  "Okonomiyaki": "Savory cabbage pancake",
  "Gyudon": "Beef rice bowl",
  "Tonkatsu": "Breaded fried pork cutlet",
  "Pho Bo": "Beef noodle soup",
  "Banh Mi": "Vietnamese baguette sandwich",
  "Pad Thai": "Stir-fried rice noodles",
  "Thai Green Curry with Chicken": "Coconut chicken curry",
  "Tom Yum Goong": "Hot and sour shrimp soup",
  "Twice-Cooked Pork": "Pork belly with leeks",
  "Pad See Ew": "Stir-fried wide noodles",
  "Mango Sticky Rice": "Sweet coconut rice",
  "Bun Bo Hue": "Spicy beef noodle soup",
  "Tteokbokki": "Spicy rice cakes",
  "Kimchi Fried Rice": "Kimchi and egg fried rice",
  "Sundubu Jjigae": "Soft tofu stew",
  "Shoyu Ramen": "Soy broth ramen",
  "Chicken Katsu Curry": "Crispy chicken curry",
  "Tempura": "Battered fried seafood",
  "Hainanese Chicken Rice": "Poached chicken rice",
  "Braised Beef Brisket Noodle Soup": "Beef brisket noodle soup",
};

const TITLE_FLIPS = {
  "Chongqing Spicy Chicken": { title: "La Zi Ji", subtitle: "Chongqing Spicy Chicken" },
  "Sichuan Boiled Fish": { title: "Shui Zhu Yu", subtitle: "Sichuan Boiled Fish" },
};

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);

  let updated = 0;
  for (const [title, subtitle] of Object.entries(SHORT_SUBTITLES)) {
    const result = await Recipe.updateOne({ title }, { $set: { subtitle } });
    if (result.modifiedCount > 0 || result.matchedCount > 0) updated++;
    else console.log(`  NOT FOUND: ${title}`);
  }
  for (const [oldTitle, change] of Object.entries(TITLE_FLIPS)) {
    const result = await Recipe.updateOne({ title: oldTitle }, { $set: { title: change.title, subtitle: change.subtitle } });
    if (result.matchedCount > 0) {
      updated++;
      console.log(`  FLIPPED: ${oldTitle} -> ${change.title} | ${change.subtitle}`);
    } else {
      console.log(`  NOT FOUND for flip: ${oldTitle}`);
    }
  }
  console.log(`Updated ${updated} recipes.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});