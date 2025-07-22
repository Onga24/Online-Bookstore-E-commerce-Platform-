import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
} from "../mailtrap/emails.js";
import {
  HTTP_BAD_REQUEST,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_OK,
} from "../constant/http_status.js";
import { sample_users } from "../data.js";
import passport from "passport";
import { generateTokenReponse } from "../utils/generatetoken.js";

export const register = async (req, res) => {
  const { firstName, lastName, email, password, address } = req.body;
  const user = await userModel.findOne({ email });

  if (user) {
    res.status(HTTP_BAD_REQUEST).send("User is already exist! please login");
    return;
  }

  const encryptedPassword = await bcrypt.hash(password, 10);
  const verificationToken = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const newUser = {
    id: "",
    firstName,
    lastName,
    address,
    email: email.toLowerCase(),
    password: encryptedPassword,
    verificationToken,
    verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    isAdmin: false,
    isVerified: false,
  };
  const dbUser = await userModel.create(newUser);
  res.send(generateTokenReponse(dbUser, res));
  await sendVerificationEmail(newUser.email, verificationToken);
};

export const seed = async (req, res) => {
  const userCount = await userModel.countDocuments();
  if (userCount > 0) {
    return res.send("Seed is already done");
  }
  await userModel.create(sample_users);
  res.send("Seed is done");
};

export const checkAuth = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select("-password");
    if (!user) {
      return res.status(HTTP_BAD_REQUEST).send("User not found");
    }
    res.status(HTTP_OK).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error checking auth:", error);
    return res.status(HTTP_BAD_REQUEST).json({
      success: false,
      message: "User not found",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    res.send(generateTokenReponse(user, res));
  } else {
    res.status(HTTP_BAD_REQUEST).send("username or password is invalid");
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res
    .status(HTTP_OK)
    .json({ success: true, message: "User logged out successfully" });
};
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(HTTP_BAD_REQUEST).send("Invalid or expired token");
    }
    const encryptedPassword = await bcrypt.hash(password, 10);
    user.password = encryptedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    await user.save();
    await sendPasswordResetSuccessEmail(user.email);
    res.status(HTTP_OK).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    // res.status().send("Error resetting password");
    res.status(HTTP_INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error resetting password",
    });
  }
};
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(HTTP_BAD_REQUEST).send("User not found");
    }
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;
    await user.save();
    await sendPasswordResetEmail(
      user.email,
      `http://localhost:4200/reset-password/${resetToken}`
    );
    // res.status(HTTP_OK).send("Password reset email sent successfully");
    res.status(HTTP_OK).json({
      success: false,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    // res.status(HTTP_INTERNAL_SERVER_ERROR).send("Error processing request");
    res.status(HTTP_INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error processing request",
    });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await userModel.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(HTTP_BAD_REQUEST)
        .send("Invalid or expired verification code");
    }
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;
    await user.save();
    await sendWelcomeEmail(user.email, user.firstName);
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("Error verifying email:", error);
    res.status(HTTP_INTERNAL_SERVER_ERROR).send("Error verifying email");
  }
};

export const facebookCallback = [
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "http://localhost:4200/signup?social=fail",
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "30d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect(
      `http://localhost:4200/signup?social=success&firstName=${encodeURIComponent(
        req.user.firstName || req.user.name
      )}`
    );
  },
];

export const authFacebook = passport.authenticate("facebook", {
  scope: ["email"],
});

export const githubCallback = [
  passport.authenticate("github", {
    session: false,
    failureRedirect: "http://localhost:4200/signup?social=fail",
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "30d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect(
      `http://localhost:4200/signup?social=success&firstName=${encodeURIComponent(
        req.user.firstName || req.user.name
      )}`
    );
  },
];
export const githubAuth = passport.authenticate("github", {
  scope: ["user:email"],
  prompt: "consent",
});

export const googleCallback = [
  passport.authenticate("google", {
    session: false,
    failureRedirect: "`http://localhost:4200/signup?social=fail",
  }),
  async (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "30d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect(
      `http://localhost:4200/signup?social=success&firstName=${encodeURIComponent(
        req.user.firstName || req.user.name
      )}`
    );
  },
];

export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});