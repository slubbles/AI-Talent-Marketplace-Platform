"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { graphQLRequest } from "../../lib/graphql";

const forgotPasswordMutation = `#graphql
  mutation ForgotPassword($input: ForgotPasswordInput!) {
    forgotPassword(input: $input) {
      message
      developmentResetToken
    }
  }
`;

const schema = z.object({ email: z.string().email("Invalid email address") });

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setError(null);
    try {
      await graphQLRequest<{
        forgotPassword: { message: string; developmentResetToken: string | null };
      }>(forgotPasswordMutation, {
        input: { email: data.email },
      });
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not start password reset.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-md space-y-8"
      >
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold">Check Your Email</h1>
            <p className="text-text-secondary text-sm">
              We&apos;ve sent a password reset link to your email address. It may take a few minutes to arrive.
            </p>
            <Link href="/login" className="text-primary text-sm font-bold hover:underline">
              Return to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-extrabold mb-2">Reset Your Password</h1>
              <p className="text-text-secondary text-sm">Enter your email and we&apos;ll send you a reset link.</p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Email Address</label>
                <Input {...register("email")} placeholder="name@company.com" />
                {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
            <p className="text-center text-sm">
              <Link href="/login" className="text-primary font-bold hover:underline">Return to Sign In</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}