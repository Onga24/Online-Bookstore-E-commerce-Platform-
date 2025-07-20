import bcrypt from "bcryptjs";

const password = "12345";
const encryptedPassword = await bcrypt.hash(password, 10);

export const sample_users = [
  {
    firstName: "admin",
    lastName: "user",
    email: "admin@gmail.com",
    password: encryptedPassword,
    address: "cairo",
    isAdmin: true,
  },
  {
    firstName: "not",
    lastName: "admin",
    email: "not_admin@gmail.com",
    password: encryptedPassword,
    address: "zayton",
    isAdmin: false,
  },
];
