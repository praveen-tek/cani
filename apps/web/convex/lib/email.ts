export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(email);
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  const first = name.charAt(0) || "";
  return `${first}***@${domain}`;
}

export interface InviteEmailParams {
  inviterName: string;
  roomName: string;
  joinUrl: string;
}

export interface AlertEmailParams {
  type: "price_drop" | "price_change" | "back_in_stock" | "new_result" | string;
  title: string;
  body: string;
  productUrl?: string;
  appUrl: string;
}

export function inviteEmail({
  inviterName,
  roomName,
  joinUrl,
}: InviteEmailParams): { subject: string; text: string; html: string } {
  const cleanInviter = inviterName.trim() || "A friend";
  const cleanRoom = roomName.trim() || "a room";
  const subject = `${cleanInviter} invited you to ${cleanRoom} on Cani`;

  const text = `${cleanInviter} has invited you to join the "${cleanRoom}" room on Cani.

Cani is a shared board where friends add products and vote on what to buy together.

Join the room here:
${joinUrl}

This link works for 7 days. If you were not expecting this, ignore this email.`;

  const safeInviter = escapeHtml(cleanInviter);
  const safeRoom = escapeHtml(cleanRoom);
  const safeJoinUrl = escapeHtml(joinUrl);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #ffffff; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; font-size: 14px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #000000;">
      ${safeInviter} invited you to join ${safeRoom} on Cani
    </h2>
    <p style="margin: 0 0 20px 0; color: #222222; font-size: 14px; line-height: 1.6;">
      Cani is a shared board where friends add products and vote on what to buy.
    </p>
    <div style="margin: 24px 0;">
      <a href="${safeJoinUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 14px; font-weight: 500; border-radius: 6px;">
        Join Room
      </a>
    </div>
    <p style="margin: 0 0 16px 0; font-size: 12px; color: #666666; word-break: break-all;">
      Or visit: <a href="${safeJoinUrl}" style="color: #000000; text-decoration: underline;">${safeJoinUrl}</a>
    </p>
    <p style="margin: 24px 0 0 0; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; padding-top: 16px;">
      This link works for 7 days. If you were not expecting this, ignore this email.
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function alertEmail({
  type,
  title,
  body,
  productUrl,
  appUrl,
}: AlertEmailParams): { subject: string; text: string; html: string } {
  const cleanTitle = title.trim() || "Item";
  let subjectPrefix = "New";
  if (type === "price_drop") {
    subjectPrefix = "Price drop";
  } else if (type === "price_change") {
    subjectPrefix = "Price change";
  } else if (type === "back_in_stock") {
    subjectPrefix = "Back in stock";
  }
  const subject = `${subjectPrefix}: ${cleanTitle}`;

  const textParts = [
    body,
    "",
    productUrl ? `Product: ${productUrl}` : "",
    `View in Cani: ${appUrl}`,
    "",
    "You can turn off alert emails on the Alerts page.",
  ].filter((p, idx) => idx !== 2 || Boolean(productUrl));

  const text = textParts.join("\n");

  const safeSubject = escapeHtml(subject);
  const safeBody = escapeHtml(body);
  const safeProductUrl = productUrl ? escapeHtml(productUrl) : null;
  const safeAppUrl = escapeHtml(appUrl);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeSubject}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #ffffff; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; font-size: 14px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #000000;">
      ${safeSubject}
    </h2>
    <p style="margin: 0 0 20px 0; color: #222222; font-size: 14px; line-height: 1.6;">
      ${safeBody}
    </p>
    <div style="margin: 20px 0 24px 0;">
      ${
        safeProductUrl
          ? `<a href="${safeProductUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 9px 18px; font-size: 13px; font-weight: 500; border-radius: 6px; margin-right: 12px;">View Product</a>`
          : ""
      }
      <a href="${safeAppUrl}" style="display: inline-block; background-color: #f4f4f5; color: #000000; text-decoration: none; padding: 9px 18px; font-size: 13px; font-weight: 500; border-radius: 6px; border: 1px solid #e4e4e7;">View Alerts in Cani</a>
    </div>
    <p style="margin: 24px 0 0 0; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; padding-top: 16px;">
      You can turn off alert emails on the Alerts page.
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
