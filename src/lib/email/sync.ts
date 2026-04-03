import { prisma } from "@/lib/db";
import { fetchGmailMessages } from "./gmail";
import { fetchOutlookMessages } from "./outlook";
import type { EmailFolder } from "@prisma/client";

function detectFolder(labels: string[]): EmailFolder {
  if (labels.includes("SENT") || labels.includes("sentitems")) return "SENT";
  if (labels.includes("DRAFT") || labels.includes("drafts")) return "DRAFTS";
  if (labels.includes("TRASH") || labels.includes("deleteditems")) return "TRASH";
  return "INBOX";
}

export async function syncEmails(
  userId: string,
  orgId: string,
  options: { maxResults?: number } = {}
): Promise<{ synced: number; errors: number }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { emailProvider: true },
  });

  if (!user.emailProvider) {
    return { synced: 0, errors: 0 };
  }

  let synced = 0;
  let errors = 0;

  try {
    const fetched =
      user.emailProvider === "GMAIL"
        ? await fetchGmailMessages(userId, {
            maxResults: options.maxResults ?? 50,
          })
        : await fetchOutlookMessages(userId, {
            top: options.maxResults ?? 50,
          });

    for (const msg of fetched.messages) {
      try {
        const existing = await prisma.email.findFirst({
          where: { orgId, externalId: msg.externalId },
          select: { id: true },
        });

        if (existing) {
          await prisma.email.update({
            where: { id: existing.id },
            data: {
              isRead: msg.isRead,
              labels: msg.labels,
            },
          });
        } else {
          await prisma.email.create({
            data: {
              orgId,
              externalId: msg.externalId,
              threadId: msg.threadId,
              from: msg.from,
              fromEmail: msg.fromEmail,
              to: msg.to,
              cc: msg.cc,
              subject: msg.subject,
              body: msg.body,
              bodyHtml: msg.bodyHtml,
              folder: detectFolder(msg.labels),
              isRead: msg.isRead,
              hasAttachment: msg.hasAttachment,
              receivedAt: msg.receivedAt,
              labels: msg.labels,
            },
          });
        }
        synced++;
      } catch {
        errors++;
      }
    }
  } catch {
    errors++;
  }

  return { synced, errors };
}
