import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),
  AI_ENGINE_URL: z.string().url()
});

export type EnvSchema = z.infer<typeof envSchema>;
