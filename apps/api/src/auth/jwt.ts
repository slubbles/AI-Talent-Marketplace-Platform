import jwt from "jsonwebtoken";
import type { AuthTokens, AuthUser, UserRole } from "@atm/shared";

const accessTokenTtlSeconds = 60 * 15;
const refreshTokenTtlSeconds = 60 * 60 * 24 * 7;
const resetTokenTtlSeconds = 60 * 30;

type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  tokenType: "access" | "refresh" | "reset";
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "change-me") {
    throw new Error("JWT_SECRET environment variable is required and must not be the default placeholder.");
  }
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  return secret && secret !== "change-me" ? secret : getJwtSecret();
};

export const signAuthTokens = (user: AuthUser): AuthTokens => {
  const basePayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };

  const accessToken = jwt.sign(
    { ...basePayload, tokenType: "access" },
    getJwtSecret(),
    { expiresIn: accessTokenTtlSeconds }
  );

  const refreshToken = jwt.sign(
    { ...basePayload, tokenType: "refresh" },
    getRefreshSecret(),
    { expiresIn: refreshTokenTtlSeconds }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: accessTokenTtlSeconds
  };
};

export const signResetToken = (user: AuthUser) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      tokenType: "reset"
    },
    getJwtSecret(),
    { expiresIn: resetTokenTtlSeconds }
  );

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, getJwtSecret()) as AuthTokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, getRefreshSecret()) as AuthTokenPayload;

export const verifyResetToken = (token: string) =>
  jwt.verify(token, getJwtSecret()) as AuthTokenPayload;