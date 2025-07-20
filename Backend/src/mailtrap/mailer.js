import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: "mekoooz221@gmail.com",
    pass: "sjmy kocl fwkc zvid",
  },
});

export const sendTestEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: '"BookMe" <mekoooz221@gamil.com>',
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};
