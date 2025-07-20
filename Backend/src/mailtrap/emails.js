// import { mailtrapClient, sender } from "./mailtrap.config.js";
// import { VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js";

// export const sendVerificationEmail = async (email, verificationToken) => {
//   const recipient = [{ email }];

//   try {
//     const response = await mailtrapClient.send({
//       from: sender,
//       to: recipient,
//       subject: "Verify your email",
//       html: VERIFICATION_EMAIL_TEMPLATE.replace(
//         "{verificationCode}",
//         verificationToken
//       ),
//       category: "Email Verification",
//     });
//     console.log(response);
//   } catch (error) {
//     console.error(`Error sending verification email log: ${error}`);
//     throw new Error(`Error sending verification email: ${error}`);
//   }
// };
import { sendTestEmail } from "./mailer.js";
import {
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
} from "./emailTemplates.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  const emailBody = VERIFICATION_EMAIL_TEMPLATE.replace(
    "{verificationCode}",
    verificationToken
  );

  try {
    await sendTestEmail(email, "Verify your email", emailBody);
  } catch (error) {
    console.error(`Error sending verification email: ${error}`);
    throw new Error(`Failed to send verification email`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const html = WELCOME_EMAIL_TEMPLATE(name);

  try {
    await sendTestEmail(email, "Welcome to BookMe!", html);
    console.log("Welcome email sent successfully to:", email);
  } catch (error) {
    console.error(`Error sending welcome email: ${error}`);
    throw new Error(`Failed to send welcome email`);
  }
};

export const sendPasswordResetEmail = async (email, resetLink) => {
  const html = PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetLink);
  try {
    await sendTestEmail(email, "Password Reset Request", html);
    console.log("Password reset email sent successfully to:", email);
  } catch (error) {
    console.error(`Error sending password reset email: ${error}`);
    throw new Error(`Failed to send password reset email`);
  }
};
export const sendPasswordResetSuccessEmail = async (email) => {
  const html = PASSWORD_RESET_SUCCESS_TEMPLATE;

  try {
    await sendTestEmail(email, "Password Reset Successful", html);
    console.log("Password reset success email sent successfully to:", email);
  } catch (error) {
    console.error(`Error sending password reset success email: ${error}`);
    throw new Error(`Failed to send password reset success email`);
  }
};