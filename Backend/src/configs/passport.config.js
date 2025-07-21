import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as FacebookStrategy } from "passport-facebook";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto, { verify } from "crypto";
export const passportFunctionality = () =>
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/api/users/google/callback",
      },
      async function (accessToken, refreshToken, profile, done) {
        try {
          const email = profile.emails[0].value;
          let user = await userModel.findOne({ email });
          const randomPassword = crypto.randomBytes(16).toString("hex");
          const encryptedPassword = await bcrypt.hash(randomPassword, 10);

          if (!user) {
            user = await userModel.create({
              googleId: profile.id,
              email,
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              name: profile.displayName,
              password: encryptedPassword,
              profilePicture: profile.photos ? profile.photos[0].value : null,
              isVerified: true,
              isAdmin: false,
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CLIENT_CALLBACK,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || `${profile.id}@github.fake`;
        const username = profile.username || `github_user_${profile.id}`;
        const displayName = profile.displayName || username;

        const nameParts = displayName.split(" ");
        const firstName = nameParts[0] || "GitHub";
        const lastName = nameParts.slice(1).join(" ") || "User";

        let user = await userModel.findOne({ email });

        if (!user) {
          const randomPassword = crypto.randomBytes(16).toString("hex");
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          user = await userModel.create({
            githubId: profile.id,
            email,
            username,
            password: hashedPassword,
            firstName,
            lastName,
            name: profile.displayName || username,
            profilePicture: profile.photos?.[0]?.value,
            isVerified: true,
            isAdmin: false,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CLIENT_CALLBACK,
      profileFields: ["id", "emails", "name", "picture.type(large)"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        console.log("📧 Facebook Email:", profile.emails?.[0]?.value);

        let user = await userModel.findOne({ email });

        if (!user) {
          const randomPassword = crypto.randomBytes(16).toString("hex");
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          user = await userModel.create({
            email,
            password: hashedPassword,
            firstName: profile.name?.givenName || "Unknown",
            lastName: profile.name?.familyName || "User",
            profilePicture: profile.photos?.[0]?.value,
            isVerified: true,
            isAdmin: false,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await userModel.findById(id); // Look up the user by their ID in the database
    done(null, user); // Pass the user object to the done callback
  } catch (err) {
    done(err); // If there's an error, pass it to the done callback
  }
});
