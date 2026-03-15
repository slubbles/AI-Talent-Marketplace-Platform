import { hashPassword, verifyPassword } from "../auth/password.js";

describe("Password hashing", () => {
  it("hashes a password and verifies it", async () => {
    const raw = "Password1!";
    const hash = await hashPassword(raw);
    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

    const valid = await verifyPassword(raw, hash);
    expect(valid).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("Password1!");
    const valid = await verifyPassword("WrongPassword!", hash);
    expect(valid).toBe(false);
  });

  it("produces different hashes for the same input (salting)", async () => {
    const raw = "Password1!";
    const hash1 = await hashPassword(raw);
    const hash2 = await hashPassword(raw);
    expect(hash1).not.toBe(hash2);
  });
});
