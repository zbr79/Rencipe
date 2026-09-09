import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("Missing MONGO_URI");
  process.exit(1);
}

const IMAGES = {
  "Kung Pao Chicken": "https://savorychina.com/wp-content/uploads/2025/10/Authentic-Kung-Pao-Chicken-Gong-Bao-Ji-Ding-1.jpg",
  "Char Siu": "https://thewoksoflife.com/wp-content/uploads/2019/04/char-siu-recipe-15.jpg",
  "Sweet and Sour Pork": "https://www.recipetineats.com/tachyon/2020/08/Sweet-and-Sour-Pork_8.jpg",
  "Peking Duck": "https://thewoksoflife.com/wp-content/uploads/2015/11/peking-duck-recipe-11.jpg",
  "Wonton Soup": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/FOOD_Wonton_Soup.jpg/960px-FOOD_Wonton_Soup.jpg",
  "Beef Chow Fun": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Gon_caau_ngau_ho_%2820150222171214%29.JPG/960px-Gon_caau_ngau_ho_%2820150222171214%29.JPG",
  "Dan Dan Noodles": "https://thewoksoflife.com/wp-content/uploads/2014/11/dan-dan-noodles-12.jpg",
  "Yangzhou Fried Rice": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Chinese_fried_rice_by_stu_spivack_in_Cleveland%2C_OH.jpg",
  "Xiaolongbao (Soup Dumplings)": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Xiaolongbao_Shanghai.jpg/960px-Xiaolongbao_Shanghai.jpg",
  "Hot and Sour Soup": "https://www.themealdb.com/images/media/meals/1529445893.jpg",
  "Scallion Pancakes": "https://upload.wikimedia.org/wikipedia/commons/3/3a/Spring_onion_pancake_2013.JPG",
  "Century Egg and Pork Congee": "https://upload.wikimedia.org/wikipedia/commons/c/c9/Pork_preserved_duck_egg_congee.jpg",
  "Hong Shao Rou": "https://thewoksoflife.com/wp-content/uploads/2013/07/hongshao-rou-2.jpg",
  "Bibimbap": "https://www.koreanbapsang.com/wp-content/uploads/2018/09/DSC3899-4.jpg",
  "Kimchi Jjigae": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Korean_stew-Kimchi_jjigae-01.jpg",
  "Japchae": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Homemade_Japchae%2C_Dhaka_03.jpg/960px-Homemade_Japchae%2C_Dhaka_03.jpg",
  "Yangnyeom Chicken": "https://mikhaeats.com/wp-content/uploads/2025/04/korean-fried-chicken-featured-image-2.jpg",
  "Bulgogi": "https://www.koreanbapsang.com/wp-content/uploads/2015/02/DSC_0847.jpg",
  "Chicken Teriyaki": "https://www.justonecookbook.com/wp-content/uploads/2024/04/Chicken-Teriyaki-7895-I-1.jpg",
  "Shui Zhu Yu": "https://redhousespice.com/wp-content/uploads/2017/11/Sichuan-boiled-fish-landscape.jpg",
  "Hainanese Chicken Rice": "https://rasamalaysia.com/wp-content/uploads/2024/11/chicken-rice2.jpg",
  "Braised Beef Brisket Noodle Soup": "https://thewoksoflife.com/wp-content/uploads/2017/03/beef-noodle-soup-18.jpg",
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
