import { z } from "zod";

export const FEEDBACK_TYPES = ["bug", "idée", "amélioration"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

// Workflow statuses (4 columns of the dev kanban). null = not yet in backlog.
export const FEEDBACK_STATUSES = [
  "to_do",
  "in_progress",
  "review",
  "done",
] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

// Allowed transitions enforced server-side
export const STATUS_TRANSITIONS: Record<
  FeedbackStatus,
  readonly FeedbackStatus[]
> = {
  to_do: ["in_progress"],
  in_progress: ["review", "to_do"],
  review: ["done", "in_progress"],
  done: ["review"],
};

// N-1: NIST 800-63B aligns on length over complexity rules.
// 10 chars min keeps demo passwords like "password123" (11 chars) valid
// while raising entropy floor.
export const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(10, "Mot de passe min. 10 caractères"),
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

export const statusUpdateSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES),
});

export const assignSchema = z.object({
  userId: z.string().nullable(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, "Le commentaire ne peut pas être vide").max(2000),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
