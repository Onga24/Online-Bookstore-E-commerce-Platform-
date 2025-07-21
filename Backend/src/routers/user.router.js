import { Router } from "express";
import asyncHandler from "express-async-handler";
import verifyToken from "../middleware/verifyToken.js";
import {
  authFacebook,
  checkAuth,
  facebookCallback,
  forgotPassword,
  githubAuth,
  githubCallback,
  googleAuth,
  googleCallback,
  login,
  logout,
  resetPassword,
  seed,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { register } from "module";

const router = Router();

router.get("/seed", asyncHandler(seed));

router.get("/check-auth", verifyToken, asyncHandler(checkAuth));

router.post("/login", asyncHandler(login));

router.post("/logout", asyncHandler(logout));

router.post("/register", asyncHandler(register));

router.get("/auth/google", googleAuth);

router.get("/google/callback", googleCallback);

router.get("/auth/github", githubAuth);

router.get("/github/callback", githubCallback);

router.get("/auth/facebook", authFacebook);

router.get("/facebook/callback", facebookCallback);

router.post("/verify-email", asyncHandler(verifyEmail));

router.post("/forgot-password", asyncHandler(forgotPassword));

router.post("/reset-password/:token", asyncHandler(resetPassword));

export default router;
