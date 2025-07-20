import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";
dotenv.config;
const TOKEN = "9a83cd7354fd30b53d5e17011e298392";
const endpoint = "https://send.api.mailtrap.io/";

// const TOKEN = process.env.MAILTRAP_TOKEN;
// const endpoint = process.env.MAILTRAP_ENDPOINT;

export const mailtrapClient = new MailtrapClient({
  endpoint: endpoint,
  token: TOKEN,
});

export const sender = {
  email: "hello@demomailtrap.com",
  name: "BookMe",
};
// const recipients = [
//   {
//     email: "mekoooz221@gmail.com",
//   },
// ];

// client
//   .send({
//     from: sender,
//     to: recipients,
//     subject: "You are awesome!",
//     html: "Congrats for sending test email with Mailtrap!",
//     category: "Integration Test",
//   })
//   .then(console.log, console.error);
