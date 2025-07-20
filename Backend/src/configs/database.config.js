import dotenv from "dotenv";
dotenv.config();
import { connect } from "mongoose";
console.log("MONGO_URI:", process.env.MONGO_URI);

export const dbConnect = () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables.");
  }

  connect(uri, {
    dbName: "EBook",
  }).then(
    () => console.log("connected successfully"),
    (error) => console.log(error)
  );
};
