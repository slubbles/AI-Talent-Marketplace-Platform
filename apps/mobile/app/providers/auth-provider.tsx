import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthPayload } from "@atm/shared";
import { createContext, useContext, useEffect, useState } from "react";
import { graphQLRequest } from "../lib/graphql";

type MobileSession = AuthPayload;

type AuthContextValue = {
  isHydrating: boolean;
  session: MobileSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; developmentResetToken: string | null }>;
  signOut: () => Promise<void>;
};

const storageKey = "atm-mobile-session";

const AuthContext = createContext<AuthContextValue | null>(null);

const loginMutation = `#graphql
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        role
        emailVerified
      }
      tokens {
        accessToken
        refreshToken
        expiresIn
      }
    }
  }
`;

const registerMutation = `#graphql
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        role
        emailVerified
      }
      tokens {
        accessToken
        refreshToken
        expiresIn
      }
    }
  }
`;

const forgotPasswordMutation = `#graphql
  mutation ForgotPassword($input: ForgotPasswordInput!) {
    forgotPassword(input: $input) {
      message
      developmentResetToken
    }
  }
`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const rawSession = await AsyncStorage.getItem(storageKey);
      if (rawSession) {
        setSession(JSON.parse(rawSession) as MobileSession);
      }
      setIsHydrating(false);
    };

    void loadSession();
  }, []);

  const persistSession = async (nextSession: MobileSession | null) => {
    setSession(nextSession);

    if (!nextSession) {
      await AsyncStorage.removeItem(storageKey);
      return;
    }

    await AsyncStorage.setItem(storageKey, JSON.stringify(nextSession));
  };

  const signIn = async (email: string, password: string) => {
    const response = await graphQLRequest<{ login: AuthPayload }>(loginMutation, {
      input: { email, password }
    });

    await persistSession(response.login);
  };

  const register = async (email: string, password: string) => {
    const response = await graphQLRequest<{ register: AuthPayload }>(registerMutation, {
      input: { email, password, role: "TALENT" }
    });

    await persistSession(response.register);
  };

  const forgotPassword = async (email: string) => {
    const response = await graphQLRequest<{
      forgotPassword: { message: string; developmentResetToken: string | null };
    }>(forgotPasswordMutation, {
      input: { email }
    });

    return response.forgotPassword;
  };

  const signOut = async () => {
    await persistSession(null);
  };

  return (
    <AuthContext.Provider value={{ isHydrating, session, signIn, register, forgotPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return value;
}