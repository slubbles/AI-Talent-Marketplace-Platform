import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    user: DefaultSession["user"] & {
      id: string;
      role: "TALENT" | "RECRUITER" | "ADMIN" | "HEADHUNTER";
      emailVerified: boolean;
      isActive: boolean;
    };
  }

  interface User {
    role: "TALENT" | "RECRUITER" | "ADMIN" | "HEADHUNTER";
    emailVerified: boolean;
    isActive: boolean;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "TALENT" | "RECRUITER" | "ADMIN" | "HEADHUNTER";
    emailVerified?: boolean;
    isActive?: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  }
}