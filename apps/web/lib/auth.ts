import type { AuthPayload } from "@atm/shared";
import { loginInputSchema } from "@atm/shared";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { graphQLRequest } from "./graphql";

const loginMutation = `#graphql
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        role
        emailVerified
        isActive
      }
      tokens {
        accessToken
        refreshToken
        expiresIn
      }
    }
  }
`;

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "dev-only-nextauth-secret",
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = loginInputSchema.safeParse(credentials);

        if (!parsed.success) {
          throw new Error("Invalid login payload.");
        }

        const response = await graphQLRequest<{ login: AuthPayload }>(loginMutation, {
          input: parsed.data
        });

        return {
          id: response.login.user.id,
          email: response.login.user.email,
          role: response.login.user.role,
          emailVerified: response.login.user.emailVerified,
          isActive: response.login.user.isActive,
          accessToken: response.login.tokens.accessToken,
          refreshToken: response.login.tokens.refreshToken,
          expiresIn: response.login.tokens.expiresIn
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.role = user.role;
        token.emailVerified = typeof user.emailVerified === "boolean" ? user.emailVerified : false;
        token.isActive = typeof user.isActive === "boolean" ? user.isActive : true;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.expiresIn = user.expiresIn;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = token.email ?? "";
        session.user.role = (token.role as "TALENT" | "RECRUITER" | "ADMIN" | "HEADHUNTER" | undefined) ?? "TALENT";
        session.user.emailVerified = Boolean(token.emailVerified);
        session.user.isActive = token.isActive !== false;
      }

      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      session.expiresIn = token.expiresIn as number | undefined;
      return session;
    }
  }
};