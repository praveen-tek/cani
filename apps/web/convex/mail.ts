import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { alertEmail, isValidEmail } from "./lib/email";
import { enforce, isEmailEnabled } from "./lib/limits";

export const getAppConfigInternal = internalQuery({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args): Promise<string | null> => {
    const config = await ctx.db
      .query("appConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return config ? config.value : null;
  },
});

export const setAppConfigInternal = internalMutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const existing = await ctx.db
      .query("appConfig")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("appConfig", {
        key: args.key,
        value: args.value,
      });
    }
  },
});

export const ensureInbox = internalAction({
  args: {},
  handler: async (ctx): Promise<{ inboxId: string; address: string }> => {
    const cachedInboxId = await ctx.runQuery(
      internal.mail.getAppConfigInternal,
      { key: "agentmailInboxId" }
    );
    const cachedInboxAddress = await ctx.runQuery(
      internal.mail.getAppConfigInternal,
      { key: "agentmailInboxAddress" }
    );

    if (cachedInboxId && cachedInboxAddress) {
      return { inboxId: cachedInboxId, address: cachedInboxAddress };
    }

    const apiKey = process.env.AGENTMAIL_API_KEY;
    if (!apiKey) {
      throw new Error("AGENTMAIL_API_KEY is not configured");
    }

    let inboxId = "";
    let address = "";

    try {
      const res = await fetch("https://api.agentmail.to/v0/inboxes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: "cani-notifications",
          display_name: "Cani",
          username: "cani",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        inboxId = data.inbox_id || data.id;
        address = data.email || data.address;
      } else {
        const errJson = (await res.json().catch(() => null)) as {
          code?: string;
        } | null;
        if (
          res.status === 409 ||
          errJson?.code === "resource_taken" ||
          errJson?.code === "already_exists"
        ) {
          const fallbackRes = await fetch(
            "https://api.agentmail.to/v0/inboxes",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                client_id: "cani-notifications",
                display_name: "Cani",
              }),
            }
          );
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            inboxId = fallbackData.inbox_id || fallbackData.id;
            address = fallbackData.email || fallbackData.address;
          }
        }
      }
    } catch {
      // Re-read below for concurrent handling
    }

    if (!inboxId || !address) {
      const reReadId = await ctx.runQuery(internal.mail.getAppConfigInternal, {
        key: "agentmailInboxId",
      });
      const reReadAddress = await ctx.runQuery(
        internal.mail.getAppConfigInternal,
        { key: "agentmailInboxAddress" }
      );
      if (reReadId && reReadAddress) {
        return { inboxId: reReadId, address: reReadAddress };
      }
      throw new Error("Failed to ensure AgentMail inbox");
    }

    await ctx.runMutation(internal.mail.setAppConfigInternal, {
      key: "agentmailInboxId",
      value: inboxId,
    });
    await ctx.runMutation(internal.mail.setAppConfigInternal, {
      key: "agentmailInboxAddress",
      value: address,
    });

    return { inboxId, address };
  },
});

export const sendEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    text: v.string(),
    html: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ ok: boolean; messageId?: string; error?: string }> => {
    const domain = args.to.split("@")[1] || "unknown";

    try {
      const { inboxId } = await ctx.runAction(internal.mail.ensureInbox, {});
      const apiKey = process.env.AGENTMAIL_API_KEY;
      if (!apiKey) {
        return { ok: false, error: "Email service not configured" };
      }

      const res = await fetch(
        `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inboxId)}/messages/send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: args.to,
            subject: args.subject,
            text: args.text,
            html: args.html,
          }),
        }
      );

      console.log(`[Email] send status=${res.status} domain=@${domain}`);

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message_id?: string;
          id?: string;
        };
        const messageId = data.message_id || data.id;
        return { ok: true, messageId };
      }

      if (res.status === 429) {
        return {
          ok: false,
          error: "Email rate limit exceeded. Please try again later.",
        };
      }

      if (res.status === 403) {
        return {
          ok: false,
          error: "Email quota or send limit reached.",
        };
      }

      return {
        ok: false,
        error: "Unable to send email at this time.",
      };
    } catch {
      console.log(`[Email] send failed domain=@${domain}`);
      return {
        ok: false,
        error: "Failed to connect to email service.",
      };
    }
  },
});

export const sendTestEmail = internalAction({
  args: {
    to: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ ok: boolean; messageId?: string; error?: string }> => {
    return await ctx.runAction(internal.mail.sendEmail, {
      to: args.to,
      subject: "Cani Test Email",
      text: "This is a test email sent from Cani via AgentMail.",
      html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; padding: 24px; color: #111;">
  <h2>Cani Test Email</h2>
  <p>This is a test email sent from Cani via AgentMail.</p>
</body>
</html>`,
    });
  },
});

export const getAlertForEmailInternal = internalQuery({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", alert.userId))
      .first();

    const user = await ctx.db.get(alert.userId);
    const userEmail = (user as { email?: string } | null)?.email;

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_user_and_emailed", (q) =>
        q.eq("userId", alert.userId).gt("emailedAt", oneHourAgo)
      )
      .collect();

    return {
      alert,
      userEmail,
      emailAlerts: profile?.emailAlerts !== false,
      hourlyCount: recentAlerts.length,
    };
  },
});

export const markAlertEmailedInternal = internalMutation({
  args: {
    alertId: v.id("alerts"),
    emailedAt: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.alertId, {
      emailedAt: args.emailedAt,
    });
  },
});

export const sendAlertEmail = internalAction({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, args): Promise<{ ok: boolean; skipped?: string }> => {
    const info = await ctx.runQuery(internal.mail.getAlertForEmailInternal, {
      alertId: args.alertId,
    });

    if (!info || !info.alert) {
      return { ok: false, skipped: "not_found" };
    }

    if (info.alert.emailedAt) {
      return { ok: false, skipped: "already_emailed" };
    }

    if (!info.userEmail || !isValidEmail(info.userEmail)) {
      return { ok: false, skipped: "no_valid_user_email" };
    }

    if (!info.emailAlerts) {
      return { ok: false, skipped: "alerts_disabled" };
    }

    if (!isEmailEnabled()) {
      console.log(`[Email] skipped alertId=${args.alertId} reason=email_disabled type=${info.alert.type}`);
      return { ok: false, skipped: "email_disabled" };
    }

    try {
      await enforce(ctx, "alertEmailHourly", { key: info.alert.userId });
      await enforce(ctx, "emailDaily");
    } catch {
      console.log(`[Email] rate limited alertId=${args.alertId} type=${info.alert.type}`);
      return { ok: false, skipped: "rate_limited" };
    }

    if (info.hourlyCount >= 5) {
      return { ok: false, skipped: "hourly_cap_reached" };
    }

    const siteUrl = process.env.SITE_URL || "https://cani.app";
    const appUrl = `${siteUrl}/alerts`;

    const { subject, text, html } = alertEmail({
      type: info.alert.type,
      title: info.alert.title,
      body: info.alert.message,
      productUrl: info.alert.url,
      appUrl,
    });

    const sendResult = await ctx.runAction(internal.mail.sendEmail, {
      to: info.userEmail,
      subject,
      text,
      html,
    });

    if (sendResult.ok) {
      await ctx.runMutation(internal.mail.markAlertEmailedInternal, {
        alertId: args.alertId,
        emailedAt: Date.now(),
      });
      return { ok: true };
    }

    return { ok: false, skipped: sendResult.error || "send_failed" };
  },
});
