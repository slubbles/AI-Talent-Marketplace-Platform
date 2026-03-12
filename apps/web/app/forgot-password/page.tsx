"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { graphQLRequest } from "../../lib/graphql";

const forgotPasswordMutation = `#graphql
  mutation ForgotPassword($input: ForgotPasswordInput!) {
    forgotPassword(input: $input) {
      message
      developmentResetToken
    }
  }
`;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await graphQLRequest<{
        forgotPassword: { message: string; developmentResetToken: string | null };
      }>(forgotPasswordMutation, {
        input: { email }
      });

      setMessage(response.forgotPassword.message);
      setResetToken(response.forgotPassword.developmentResetToken);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not start password reset.");
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="eyebrow">Password reset</span>
        <h1>Prepare a reset link</h1>
        <p>Email delivery is deferred to a later session. In development, the reset token is shown below.</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          {message ? <p className="form-success">{message}</p> : null}
          {resetToken ? <textarea className="token-box" readOnly value={resetToken} /> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit">Generate reset token</button>
        </form>
        <div className="auth-links">
          <Link href={"/reset-password" as Route}>Go to reset form</Link>
          <Link href={"/login" as Route}>Back to sign in</Link>
        </div>
      </section>
    </main>
  );
}