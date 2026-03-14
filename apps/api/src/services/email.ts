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

/* ─── Branded Email Layout ─── */

const emailLayout = (content: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>AI Talent Marketplace</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo / Brand Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#EFFE5E;width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle;">
                    <span style="font-size:18px;font-weight:800;color:#000000;line-height:36px;">A</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">AI Talent Marketplace</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#0A0A0A;border:1px solid #27272A;border-radius:14px;padding:40px 36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:12px;color:#71717A;line-height:18px;">
                AI Talent Marketplace &mdash; Intelligent Hiring, Powered by AI
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#52525B;line-height:16px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const brandButton = (text: string, href: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
  <tr>
    <td style="background-color:#EFFE5E;border-radius:10px;padding:14px 32px;">
      <a href="${href}" target="_blank" style="color:#000000;font-size:14px;font-weight:700;text-decoration:none;display:inline-block;">${text}</a>
    </td>
  </tr>
</table>`;

const divider = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td style="border-top:1px solid #27272A;"></td></tr>
</table>`;

const iconBadge = (emoji: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
  <tr>
    <td style="background-color:rgba(239,254,94,0.1);width:48px;height:48px;border-radius:12px;text-align:center;vertical-align:middle;border:1px solid #27272A;">
      <span style="font-size:22px;line-height:48px;">${emoji}</span>
    </td>
  </tr>
</table>`;

const heading = (text: string) =>
  `<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#FFFFFF;line-height:28px;">${text}</h1>`;

const paragraph = (text: string) =>
  `<p style="margin:0 0 16px;font-size:14px;color:#A1A1AA;line-height:22px;">${text}</p>`;

const highlight = (text: string) =>
  `<span style="color:#EFFE5E;font-weight:600;">${text}</span>`;

const infoRow = (label: string, value: string) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
  <tr>
    <td style="font-size:13px;color:#71717A;width:120px;vertical-align:top;padding:4px 0;">${label}</td>
    <td style="font-size:14px;color:#FFFFFF;font-weight:600;vertical-align:top;padding:4px 0;">${value}</td>
  </tr>
</table>`;

/* ─── Email Templates ─── */

const platformUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export const sendWelcomeEmail = async (email: string, role: string) => {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  const dashboardPath = role.toLowerCase() === "admin" ? "/admin" : "/dashboard";

  return sendEmail({
    to: email,
    subject: "Welcome to AI Talent Marketplace",
    html: emailLayout(`
      ${iconBadge("👋")}
      ${heading(`Welcome aboard, ${roleLabel}!`)}
      ${paragraph(`Your <strong style="color:#FFFFFF;">${roleLabel}</strong> account has been created and is ready to go. You now have full access to the AI Talent Marketplace platform.`)}
      ${divider}
      ${paragraph("Here&rsquo;s what you can do next:")}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr><td style="padding:6px 0;font-size:14px;color:#A1A1AA;line-height:22px;">&#x2022;&nbsp; Complete your profile to unlock AI-powered matching</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#A1A1AA;line-height:22px;">&#x2022;&nbsp; Explore the dashboard to see available features</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#A1A1AA;line-height:22px;">&#x2022;&nbsp; Set up your preferences for personalized recommendations</td></tr>
      </table>
      ${brandButton("Go to Dashboard", `${platformUrl}${dashboardPath}`)}
    `)
  });
};

export const sendInterviewScheduledEmail = async (email: string, roleTitle: string, scheduledAtIso: string) => {
  const date = new Date(scheduledAtIso);
  const formattedDate = date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const formattedTime = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  return sendEmail({
    to: email,
    subject: `Interview Scheduled — ${roleTitle}`,
    html: emailLayout(`
      ${iconBadge("📅")}
      ${heading("Interview Scheduled")}
      ${paragraph(`Great news! Your interview has been confirmed for the following role.`)}
      ${divider}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1A1A;border-radius:10px;padding:20px;margin-bottom:20px;">
        <tr><td style="padding:16px 20px;">
          ${infoRow("Role", roleTitle)}
          ${infoRow("Date", formattedDate)}
          ${infoRow("Time", formattedTime)}
        </td></tr>
      </table>
      ${paragraph(`Please ensure you are available at the scheduled time. You can view full details and join the interview from your dashboard.`)}
      ${brandButton("View Interview Details", `${platformUrl}/dashboard`)}
    `)
  });
};

export const sendOfferReceivedEmail = async (email: string, roleTitle: string) =>
  sendEmail({
    to: email,
    subject: `Offer Received — ${roleTitle}`,
    html: emailLayout(`
      ${iconBadge("🎉")}
      ${heading("You&rsquo;ve Received an Offer!")}
      ${paragraph(`Congratulations! A new offer is waiting for you.`)}
      ${divider}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1A1A;border-radius:10px;padding:20px;margin-bottom:20px;">
        <tr><td style="padding:16px 20px;">
          ${infoRow("Role", roleTitle)}
          ${infoRow("Status", `<span style="color:#22C55E;font-weight:700;">Pending Review</span>`)}
        </td></tr>
      </table>
      ${paragraph(`Review the offer details, compensation package, and next steps directly in the platform. Don&rsquo;t wait too long &mdash; offers have an expiration window.`)}
      ${brandButton("Review Offer", `${platformUrl}/dashboard`)}
    `)
  });

export const sendMatchAlertEmail = async (email: string, roleTitle: string) =>
  sendEmail({
    to: email,
    subject: `New Match — ${roleTitle}`,
    html: emailLayout(`
      ${iconBadge("⚡")}
      ${heading("New AI Match Found")}
      ${paragraph(`Our AI engine has identified a strong match for you based on your skills, experience, and preferences.`)}
      ${divider}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1A1A;border-radius:10px;padding:20px;margin-bottom:20px;">
        <tr><td style="padding:16px 20px;">
          ${infoRow("Role", roleTitle)}
          ${infoRow("Matched By", highlight("AI Engine"))}
        </td></tr>
      </table>
      ${paragraph(`View the full role description, requirements, and how your profile matches to decide if you want to proceed.`)}
      ${brandButton("View Match", `${platformUrl}/dashboard`)}
    `)
  });

export const sendAvailabilityUpdateEmail = async (email: string, talentName: string, availability: string) =>
  sendEmail({
    to: email,
    subject: `Availability Update — ${talentName}`,
    html: emailLayout(`
      ${iconBadge("🔔")}
      ${heading("Talent Availability Updated")}
      ${paragraph(`A talent in your pipeline has updated their availability status.`)}
      ${divider}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1A1A;border-radius:10px;padding:20px;margin-bottom:20px;">
        <tr><td style="padding:16px 20px;">
          ${infoRow("Talent", talentName)}
          ${infoRow("Availability", highlight(availability))}
        </td></tr>
      </table>
      ${paragraph(`You may want to adjust your shortlists or scheduling based on this update. Review the talent's full profile for more context.`)}
      ${brandButton("View Talent Profile", `${platformUrl}/dashboard/search`)}
    `)
  });