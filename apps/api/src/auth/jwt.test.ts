import { signAuthTokens, verifyAccessToken, verifyRefreshToken, signResetToken, verifyResetToken } from "../auth/jwt.js";

const mockUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test@marketplace.example",
  role: "RECRUITER" as const,
  emailVerified: true,
  isActive: true,
  firstName: "Test",
  lastName: "User"
};

describe("JWT auth tokens", () => {
  it("signs and verifies an access token", () => {
    const tokens = signAuthTokens(mockUser);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresIn).toBe(900);

    const payload = verifyAccessToken(tokens.accessToken);
    expect(payload.sub).toBe(mockUser.id);
    expect(payload.email).toBe(mockUser.email);
    expect(payload.role).toBe("RECRUITER");
    expect(payload.tokenType).toBe("access");
  });

  it("signs and verifies a refresh token", () => {
    const tokens = signAuthTokens(mockUser);
    const payload = verifyRefreshToken(tokens.refreshToken);
    expect(payload.sub).toBe(mockUser.id);
    expect(payload.tokenType).toBe("refresh");
  });

  it("signs and verifies a reset token", () => {
    const token = signResetToken(mockUser);
    const payload = verifyResetToken(token);
    expect(payload.sub).toBe(mockUser.id);
    expect(payload.tokenType).toBe("reset");
  });

  it("rejects a tampered token", () => {
    const tokens = signAuthTokens(mockUser);
    expect(() => verifyAccessToken(tokens.accessToken + "tampered")).toThrow();
  });

  it("rejects a completely invalid token", () => {
    expect(() => verifyAccessToken("not-a-real-token")).toThrow();
  });

  it("includes isActive in the token payload", () => {
    const inactiveUser = { ...mockUser, isActive: false };
    const tokens = signAuthTokens(inactiveUser);
    const payload = verifyAccessToken(tokens.accessToken);
    expect(payload.isActive).toBe(false);
  });

  it("includes all user roles correctly", () => {
    const roles = ["TALENT", "RECRUITER", "ADMIN", "HEADHUNTER"] as const;
    for (const role of roles) {
      const tokens = signAuthTokens({ ...mockUser, role });
      const payload = verifyAccessToken(tokens.accessToken);
      expect(payload.role).toBe(role);
    }
  });
});
