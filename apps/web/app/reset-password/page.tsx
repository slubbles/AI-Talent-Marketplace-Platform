"use client";

import type { Route } from "next";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { graphQLRequest } from "../../lib/graphql";

const resetPasswordMutation = `#graphql
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      user {
        id
        email
      }
    }
  }
`;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await graphQLRequest(resetPasswordMutation, {
        input: { token, password }
      });

      await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      router.push("/dashboard" as Route);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Reset failed.");
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="eyebrow">Reset password</span>
        <h1>Complete your password reset</h1>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            <span>Reset token</span>
            <textarea className="token-box" value={token} onChange={(event) => setToken(event.target.value)} required />
          </label>
          <label>
            <span>New password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} required />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit">Reset password</button>
        </form>
      </section>
    </main>
  );
}