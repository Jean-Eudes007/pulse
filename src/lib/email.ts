import { Resend } from "resend";

// Pulse uses Resend for transactional email (verification + password
// reset). Without RESEND_API_KEY the function no-ops and logs the URL to
// the server console — useful in dev/CI where you want the verification
// flow to remain testable without external infra.

let client: Resend | null = null;
function getClient(): Resend | null {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client = new Resend(key);
  return client;
}

function getFrom(): string {
  // Default to Resend's onboarding sender so the demo works without
  // domain verification. For real sends, configure RESEND_FROM_EMAIL.
  return process.env.RESEND_FROM_EMAIL ?? "Pulse <onboarding@resend.dev>";
}

export function getAppUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

type SendInput = {
  to: string;
  subject: string;
  html: string;
  // Helps debug logged emails in dev — what kind of email this is and
  // any URL the recipient is meant to click.
  devLogContext?: string;
};

export async function sendEmail(input: SendInput): Promise<void> {
  const c = getClient();
  if (!c) {
    console.log(
      `[email] RESEND_API_KEY missing — skipping send. to=${input.to} subject="${input.subject}"${
        input.devLogContext ? ` ${input.devLogContext}` : ""
      }`,
    );
    return;
  }
  const { error } = await c.emails.send({
    from: getFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (error) {
    // Don't throw — a failed verification email shouldn't break signup.
    // The user can request a resend from the banner.
    console.error("[email] Resend send failed:", error);
  }
}

export function verificationEmailHtml(verifyUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 18px; margin: 0 0 16px;">Bienvenue sur Pulse</h1>
      <p style="color: #444; line-height: 1.5;">
        Pour activer votre compte, cliquez sur le lien ci-dessous. Il expire dans 24 heures.
      </p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background: #111; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-size: 14px;">Activer mon compte</a>
      </p>
      <p style="color: #888; font-size: 12px;">Ou copiez ce lien dans votre navigateur :<br/>${verifyUrl}</p>
    </div>
  `.trim();
}

export function resetPasswordEmailHtml(resetUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 18px; margin: 0 0 16px;">Réinitialisation de mot de passe</h1>
      <p style="color: #444; line-height: 1.5;">
        Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous (valable 1 heure).
      </p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #111; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-size: 14px;">Choisir un nouveau mot de passe</a>
      </p>
      <p style="color: #888; font-size: 12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.<br/>Lien : ${resetUrl}</p>
    </div>
  `.trim();
}
