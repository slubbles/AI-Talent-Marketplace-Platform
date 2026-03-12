"use client";

import type { Route } from "next";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("recruiter@marketplace.example");
  const [password, setPassword] = useState("demo-hash");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push((result?.url ?? callbackUrl) as Route);
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="eyebrow">Recruiter + admin access</span>
        <h1>Sign in to the marketplace</h1>
        <p>Use the GraphQL credentials flow. Recruiter and admin routes are protected by NextAuth JWT sessions.</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="auth-links">
          <Link href={"/register" as Route}>Create recruiter account</Link>
          <Link href={"/forgot-password" as Route}>Forgot password</Link>
        </div>
      </section>
    </main>
  );
}