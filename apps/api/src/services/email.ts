import { Resend } from "resend";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey && resendApiKey !== "change-me" ? new Resend(resendApiKey) : null;
const fromAddress = process.env.RESEND_FROM_EMAIL ?? "noreply@aitalentmarketplace.dev";

const sendEmail = async ({ to, subject, html }: EmailInput) => {
  if (!resend) {
    return { delivered: false, provider: "disabled" };
  }

  await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html
  });

  return { delivered: true, provider: "resend" };
};

export const sendWelcomeEmail = async (email: string, role: string) =>
  sendEmail({
    to: email,
    subject: "Welcome to AI Talent Marketplace",
    html: `<p>Your ${role.toLowerCase()} account is ready. You can now continue your onboarding in AI Talent Marketplace.</p>`
  });

export const sendInterviewScheduledEmail = async (email: string, roleTitle: string, scheduledAtIso: string) =>
  sendEmail({
    to: email,
    subject: "Interview scheduled",
    html: `<p>Your interview for <strong>${roleTitle}</strong> has been scheduled for ${scheduledAtIso}.</p>`
  });

export const sendOfferReceivedEmail = async (email: string, roleTitle: string) =>
  sendEmail({
    to: email,
    subject: "New offer received",
    html: `<p>You have received an offer for <strong>${roleTitle}</strong>. Review it in the platform.</p>`
  });

export const sendMatchAlertEmail = async (email: string, roleTitle: string) =>
  sendEmail({
    to: email,
    subject: "New talent match",
    html: `<p>A new role match is available for <strong>${roleTitle}</strong>.</p>`
  });