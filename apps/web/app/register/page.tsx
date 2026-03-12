"use client";

import type { AuthPayload } from "@atm/shared";
import type { Route } from "next";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { graphQLRequest } from "../../lib/graphql";

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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await graphQLRequest<{ register: AuthPayload }>(registerMutation, {
        input: {
          email,
          password,
          role: "RECRUITER"
        }
      });

      await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      router.push("/dashboard" as Route);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="eyebrow">Recruiter registration</span>
        <h1>Create your recruiter account</h1>
        <p>LinkedIn OAuth is stubbed for MVP. Email/password is the active flow for Session 3.</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} required />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <div className="auth-links">
          <Link href={"/login" as Route}>Already have an account?</Link>
        </div>
      </section>
    </main>
  );
}