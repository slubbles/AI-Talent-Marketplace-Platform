type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const registerStore = new Map<string, RateLimitRecord>();
const loginStore = new Map<string, RateLimitRecord>();

const getStore = (scope: "register" | "login") =>
  scope === "register" ? registerStore : loginStore;

const limits = {
  register: { max: 5, windowMs: 15 * 60 * 1000 },
  login: { max: 10, windowMs: 15 * 60 * 1000 }
} as const;

export const enforceRateLimit = (scope: "register" | "login", key: string) => {
  const store = getStore(scope);
  const policy = limits[scope];
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + policy.windowMs });
    return;
  }

  if (existing.count >= policy.max) {
    const remainingSeconds = Math.ceil((existing.resetAt - now) / 1000);
    throw new Error(`Too many ${scope} attempts. Try again in ${remainingSeconds} seconds.`);
  }

  store.set(key, { ...existing, count: existing.count + 1 });
};