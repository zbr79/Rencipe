import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const NAME_MAP = {
  Catcake: "Aisha Patel",
  Admin: "Sofia Martinez",
  "Test User": "Daniel Kim",
  Rencipe: "Maya Chen",
  Demo: "Jordan Lee",
};

const shouldApply = process.argv.includes("--apply");

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const comments = mongoose.connection.collection("comments");

  const before = await comments.aggregate([
    { $match: { displayName: { $in: Object.keys(NAME_MAP) } } },
    { $group: { _id: "$displayName", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]).toArray();

  console.log(`Matching comments: ${before.reduce((total, row) => total + row.count, 0)}`);
  console.log("Mapping:", NAME_MAP);

  if (!shouldApply) {
    console.log("Dry run only. Re-run with --apply to update comment display names.");
    return;
  }

  for (const [from, to] of Object.entries(NAME_MAP)) {
    const result = await comments.updateMany(
      { displayName: from },
      { $set: { displayName: to } },
    );
    console.log(`${from} -> ${to}: ${result.modifiedCount} comments`);
  }

  const remainingGenericNames = await comments.countDocuments({
    displayName: { $in: Object.keys(NAME_MAP) },
  });
  console.log(`Remaining generic comment names: ${remainingGenericNames}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
