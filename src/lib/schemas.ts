import { z } from "zod";

export const FEEDBACK_TYPES = ["bug", "idée", "amélioration"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe min. 8 caractères"),
  name: z.string().min(1, "Nom requis").max(80),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createFeedbackSchema = z.object({
  title: z.string().min(3, "Titre min. 3 caractères").max(120),
  description: z.string().min(10, "Description min. 10 caractères").max(5000),
  type: z.enum(FEEDBACK_TYPES),
});

export const updateFeedbackSchema = createFeedbackSchema.partial();

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
