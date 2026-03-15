import { enforceRateLimit } from "../auth/rate-limit.js";

describe("Rate limiting", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Date.now()}:allow@example.com`;
    expect(() => enforceRateLimit("login", key)).not.toThrow();
    expect(() => enforceRateLimit("login", key)).not.toThrow();
    expect(() => enforceRateLimit("login", key)).not.toThrow();
  });

  it("blocks login after 10 attempts", () => {
    const key = `test-${Date.now()}:block-login@example.com`;
    for (let i = 0; i < 10; i++) {
      enforceRateLimit("login", key);
    }
    expect(() => enforceRateLimit("login", key)).toThrow(/Too many login attempts/);
  });

  it("blocks register after 5 attempts", () => {
    const key = `test-${Date.now()}:block-register@example.com`;
    for (let i = 0; i < 5; i++) {
      enforceRateLimit("register", key);
    }
    expect(() => enforceRateLimit("register", key)).toThrow(/Too many register attempts/);
  });

  it("blocks forgotPassword after 5 attempts", () => {
    const key = `test-${Date.now()}:block-forgot@example.com`;
    for (let i = 0; i < 5; i++) {
      enforceRateLimit("forgotPassword", key);
    }
    expect(() => enforceRateLimit("forgotPassword", key)).toThrow(/Too many forgotPassword attempts/);
  });

  it("uses separate stores for different scopes", () => {
    const key = `test-${Date.now()}:scope@example.com`;
    for (let i = 0; i < 5; i++) {
      enforceRateLimit("register", key);
    }
    // Register is at limit, but login should still work since it's a different scope
    expect(() => enforceRateLimit("login", key)).not.toThrow();
  });
});
