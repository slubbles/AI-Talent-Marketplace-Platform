import bcrypt from "bcryptjs";

const rounds = 10;

export const hashPassword = async (password: string) => bcrypt.hash(password, rounds);

export const verifyPassword = async (password: string, passwordHash: string) =>
  bcrypt.compare(password, passwordHash);