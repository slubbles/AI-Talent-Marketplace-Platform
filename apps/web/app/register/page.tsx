"use client";

import type { AuthPayload } from "@atm/shared";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

function getStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw))
    return { label: "Strong", color: "bg-success", width: "w-full" };
  if (pw.length >= 8)
    return { label: "Fair", color: "bg-warning", width: "w-2/3" };
  return { label: "Weak", color: "bg-destructive", width: "w-1/3" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const passwordVal = watch("password", "");
  const strength = getStrength(passwordVal);

  const onSubmit = async (data: FormData) => {
    setError(null);

    try {
      await graphQLRequest<{ register: AuthPayload }>(registerMutation, {
        input: {
          email: data.email,
          password: data.password,
          role: "RECRUITER",
        },
      });

      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex w-1/2 bg-card border-r border-border p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.05),transparent)]" />
        <span className="text-primary font-extrabold text-2xl relative z-10">TalentAI</span>
        <div className="relative z-10">
          <h2 className="text-5xl font-extrabold leading-tight mb-6">
            Start building <br />your dream team.
          </h2>
          <p className="text-text-secondary text-lg max-w-md">AI-powered hiring for modern teams.</p>
        </div>
        <div className="text-sm text-text-muted relative z-10">© 2026 TalentAI Inc.</div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-md space-y-8"
        >
          <div>
            <h1 className="text-3xl font-extrabold mb-2">Create Your Account</h1>
            <p className="text-text-secondary text-sm">Get started with TalentAI in seconds.</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">First Name</label>
                <Input {...register("firstName")} placeholder="Jane" />
                {errors.firstName && <p className="text-destructive text-xs">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Last Name</label>
                <Input {...register("lastName")} placeholder="Doe" />
                {errors.lastName && <p className="text-destructive text-xs">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Email Address</label>
              <Input {...register("email")} placeholder="name@company.com" />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Password</label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordVal && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.width} transition-all rounded-full`} />
                  </div>
                  <p className="text-xs text-text-muted">{strength.label}</p>
                </div>
              )}
              {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Confirm Password</label>
              <Input {...register("confirmPassword")} type="password" placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}