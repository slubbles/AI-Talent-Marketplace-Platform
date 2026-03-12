import type { AuthPayload } from "@atm/shared";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";
import { graphQLRequest } from "../lib/graphql";

type MobileSession = AuthPayload;
type PendingRegistration = {
  firstName: string;
  lastName: string;
};

type AuthContextValue = {
  isHydrating: boolean;
  session: MobileSession | null;
  pendingRegistration: PendingRegistration | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; developmentResetToken: string | null }>;
  clearPendingRegistration: () => Promise<void>;
  signOut: () => Promise<void>;
};

const storageKey = "atm-mobile-session";
const pendingRegistrationStorageKey = "atm-mobile-pending-registration";

const AuthContext = createContext<AuthContextValue | null>(null);

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

const registerMutation = `#graphql
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
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
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const [rawSession, rawPendingRegistration] = await Promise.all([
        SecureStore.getItemAsync(storageKey),
        SecureStore.getItemAsync(pendingRegistrationStorageKey)
      ]);
      if (rawSession) {
        setSession(JSON.parse(rawSession) as MobileSession);
      }
      if (rawPendingRegistration) {
        setPendingRegistration(JSON.parse(rawPendingRegistration) as PendingRegistration);
      }
      setIsHydrating(false);
    };

    void loadSession();
  }, []);

  const persistSession = async (nextSession: MobileSession | null) => {
    setSession(nextSession);

    if (!nextSession) {
      await SecureStore.deleteItemAsync(storageKey);
      return;
    }

    await SecureStore.setItemAsync(storageKey, JSON.stringify(nextSession));
  };

  const persistPendingRegistration = async (nextPendingRegistration: PendingRegistration | null) => {
    setPendingRegistration(nextPendingRegistration);

    if (!nextPendingRegistration) {
      await SecureStore.deleteItemAsync(pendingRegistrationStorageKey);
      return;
    }

    await SecureStore.setItemAsync(pendingRegistrationStorageKey, JSON.stringify(nextPendingRegistration));
  };

  const signIn = async (email: string, password: string) => {
    const response = await graphQLRequest<{ login: AuthPayload }>(loginMutation, {
      input: { email, password }
    });

    await persistPendingRegistration(null);
    await persistSession(response.login);
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await graphQLRequest<{ register: AuthPayload }>(registerMutation, {
      input: { email, password, role: "TALENT" }
    });

    await persistPendingRegistration({ firstName: firstName.trim(), lastName: lastName.trim() });
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

  const clearPendingRegistration = async () => {
    await persistPendingRegistration(null);
  };

  const signOut = async () => {
    await persistPendingRegistration(null);
    await persistSession(null);
  };

  return (
    <AuthContext.Provider value={{ isHydrating, session, pendingRegistration, signIn, register, forgotPassword, clearPendingRegistration, signOut }}>
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