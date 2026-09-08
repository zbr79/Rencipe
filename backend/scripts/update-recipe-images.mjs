import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("Missing MONGO_URI");
  process.exit(1);
}

const IMAGES = {
  "Kung Pao Chicken": "https://www.themealdb.com/images/media/meals/1525872624.jpg",
  "Char Siu (Cantonese BBQ Pork)": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Char_siu_pieces.jpg/960px-Char_siu_pieces.jpg",
  "Sweet and Sour Pork": "https://www.themealdb.com/images/media/meals/1529442316.jpg",
  "Peking Duck": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Peking_Duck_3.jpg/960px-Peking_Duck_3.jpg",
  "Wonton Soup": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/FOOD_Wonton_Soup.jpg/960px-FOOD_Wonton_Soup.jpg",
  "Beef Chow Fun": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Gon_caau_ngau_ho_%2820150222171214%29.JPG/960px-Gon_caau_ngau_ho_%2820150222171214%29.JPG",
  "Dan Dan Noodles": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Dan_Dan_Noodles.jpg/960px-Dan_Dan_Noodles.jpg",
  "Yangzhou Fried Rice": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Chinese_fried_rice_by_stu_spivack_in_Cleveland%2C_OH.jpg",
  "Xiaolongbao (Soup Dumplings)": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Xiaolongbao_Shanghai.jpg/960px-Xiaolongbao_Shanghai.jpg",
  "Hot and Sour Soup": "https://www.themealdb.com/images/media/meals/1529445893.jpg",
  "Scallion Pancakes": "https://upload.wikimedia.org/wikipedia/commons/3/3a/Spring_onion_pancake_2013.JPG",
  "Century Egg and Pork Congee": "https://upload.wikimedia.org/wikipedia/commons/c/c9/Pork_preserved_duck_egg_congee.jpg",
  "Hong Shao Rou (Red Braised Pork Belly)": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Red_braised_pork_belly.jpg/960px-Red_braised_pork_belly.jpg",
  "Bibimbap": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Korean.food-Bibimbap-02.jpg/960px-Korean.food-Bibimbap-02.jpg",
  "Kimchi Jjigae": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Korean_stew-Kimchi_jjigae-01.jpg",
  "Japchae": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Homemade_Japchae%2C_Dhaka_03.jpg/960px-Homemade_Japchae%2C_Dhaka_03.jpg",
  "Yangnyeom Chicken (Korean Fried Chicken)": "https://upload.wikimedia.org/wikipedia/commons/1/1e/Korean.cuisine-Yangnyeom_chicken-01.jpg",
  "Bulgogi": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Korean.cuisine-Bulgogi-01.jpg/960px-Korean.cuisine-Bulgogi-01.jpg",
  "Chicken Teriyaki": "https://upload.wikimedia.org/wikipedia/commons/b/be/Teriyaki_003.jpg",
  "Miso Soup": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Miso_Soup_001.jpg/960px-Miso_Soup_001.jpg",
  "Okonomiyaki": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Okonomiyaki_001.jpg/960px-Okonomiyaki_001.jpg",
  "Gyudon": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Gyuu-don_001.jpg/960px-Gyuu-don_001.jpg",
  "Tonkatsu": "https://www.themealdb.com/images/media/meals/lwsnkl1604181187.jpg",
  "Pho Bo": "https://www.themealdb.com/images/media/meals/pbzcrx1763765096.jpg",
  "Banh Mi": "https://www.themealdb.com/images/media/meals/sonirb1763782831.jpg",
  "Goi Cuon (Fresh Spring Rolls)": "https://www.themealdb.com/images/media/meals/9r2xrg1763771238.jpg",
  "Pad Thai": "https://www.themealdb.com/images/media/meals/rg9ze01763479093.jpg",
  "Thai Green Curry with Chicken": "https://www.themealdb.com/images/media/meals/sstssx1487349585.jpg",
  "Tom Yum Goong": "https://www.themealdb.com/images/media/meals/l50vz41763422681.jpg",
};

async function main() {
  const conn = await mongoose.createConnection(uri).asPromise();
  const recipes = conn.collection("recipes");

  let updated = 0;
  let missing = 0;

  for (const [title, image] of Object.entries(IMAGES)) {
    const result = await recipes.updateOne({ title, image: { $ne: image } }, { $set: { image } });
    if (result.matchedCount === 0) {
      console.log(`MISSING: ${title}`);
      missing++;
    } else if (result.modifiedCount > 0) {
      console.log(`UPDATED: ${title}`);
      updated++;
    } else {
      console.log(`UNCHANGED: ${title}`);
    }
  }

  console.log(`\nDone. updated=${updated} missing=${missing}`);
  await conn.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
