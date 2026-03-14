"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setError(null);

    try {
      await graphQLRequest(resetPasswordMutation, {
        input: { token, password: data.password },
      });

      if (email) {
        await signIn("credentials", {
          email,
          password: data.password,
          redirect: false,
        });
      }

      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Reset failed.");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-extrabold">Invalid or Expired Link</h1>
          <p className="text-text-secondary text-sm">This reset link is no longer valid.</p>
          <Link href="/forgot-password" className="text-primary font-bold hover:underline text-sm">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-md space-y-8"
      >
        <div>
          <h1 className="text-2xl font-extrabold mb-2">Choose a New Password</h1>
          <p className="text-text-secondary text-sm">Enter your new password below.</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">New Password</label>
            <Input {...register("password")} type="password" placeholder="••••••••" />
            {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Confirm Password</label>
            <Input {...register("confirmPassword")} type="password" placeholder="••••••••" />
            {errors.confirmPassword && <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Reset Password
          </Button>
        </form>
      </motion.div>
    </div>
  );
}