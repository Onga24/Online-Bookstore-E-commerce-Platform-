import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import userRouter from "./src/routers/user.router.js";
import { dbConnect } from "./src/configs/database.config.js";
import cookieparser from "cookie-parser";
import passport from "passport";
import session from "express-session";
import { passportFunctionality } from "./src/configs/passport.config.js";
dotenv.config();
dbConnect();
// const express = require("express");

const app = express();
app.use(express.json());
app.use(cookieparser());
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:4200"],
  })
);
passportFunctionality();
// app.use(
//   session({
//     secret: process.env.JWT_SECRET_KEY,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       secure: false, // true only with HTTPS
//       httpOnly: true,
//       maxAge: 1000 * 60 * 60 * 24, // 1 day
//     },
//   })
// );

// ✅ Initialize passport and session
app.use(passport.initialize());
// app.use(passport.session());
const port = 5000;
// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });
app.use("/api/users", userRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
