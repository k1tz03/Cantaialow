import { prisma } from "@/lib/db";

const GRAPH_SCOPES = [
  "Mail.Read",
  "Mail.Send",
  "Mail.ReadWrite",
  "offline_access",
].join(" ");

export function getOutlookAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/outlook/callback`,
    response_type: "code",
    scope: GRAPH_SCOPES,
    state: userId,
    response_mode: "query",
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeOutlookCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
        client_secret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/outlook/callback`,
        grant_type: "authorization_code",
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to exchange Outlook code");
  }

  return response.json();
}

export async function refreshOutlookToken(refreshToken: string): Promise<string> {
  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
        client_secret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
        grant_type: "refresh_token",
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to refresh Outlook token");
  }

  const data = await response.json();
  return data.access_token;
}

async function getAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { emailToken: true, emailRefreshToken: true },
  });

  if (!user.emailToken || !user.emailRefreshToken) {
    throw new Error("No email token found");
  }

  try {
    const testResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me/mailFolders/inbox",
      { headers: { Authorization: `Bearer ${user.emailToken}` } }
    );

    if (testResponse.ok) return user.emailToken;

    const newToken = await refreshOutlookToken(user.emailRefreshToken);
    await prisma.user.update({
      where: { id: userId },
      data: { emailToken: newToken },
    });
    return newToken;
  } catch {
    const newToken = await refreshOutlookToken(user.emailRefreshToken);
    await prisma.user.update({
      where: { id: userId },
      data: { emailToken: newToken },
    });
    return newToken;
  }
}

interface GraphMessage {
  id: string;
  conversationId: string;
  from: { emailAddress: { name: string; address: string } };
  toRecipients: Array<{ emailAddress: { name: string; address: string } }>;
  ccRecipients: Array<{ emailAddress: { name: string; address: string } }>;
  subject: string;
  body: { content: string; contentType: string };
  bodyPreview: string;
  isRead: boolean;
  hasAttachments: boolean;
  receivedDateTime: string;
  categories: string[];
}

export async function fetchOutlookMessages(
  userId: string,
  options: { top?: number; skip?: number; folder?: string } = {}
): Promise<{
  messages: Array<{
    externalId: string;
    threadId: string;
    from: string;
    fromEmail: string;
    to: string;
    cc: string;
    subject: string;
    body: string;
    bodyHtml: string;
    isRead: boolean;
    hasAttachment: boolean;
    receivedAt: Date;
    labels: string[];
  }>;
}> {
  const token = await getAccessToken(userId);
  const folder = options.folder ?? "inbox";
  const top = options.top ?? 50;

  const params = new URLSearchParams({
    $top: String(top),
    $orderby: "receivedDateTime desc",
    $select:
      "id,conversationId,from,toRecipients,ccRecipients,subject,body,bodyPreview,isRead,hasAttachments,receivedDateTime,categories",
  });
  if (options.skip) params.set("$skip", String(options.skip));

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/mailFolders/${folder}/messages?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Outlook messages");
  }

  const data = await response.json();
  const messages = (data.value as GraphMessage[]).map((msg) => ({
    externalId: msg.id,
    threadId: msg.conversationId,
    from: msg.from?.emailAddress?.name ?? "",
    fromEmail: msg.from?.emailAddress?.address ?? "",
    to: msg.toRecipients
      ?.map((r) => r.emailAddress.address)
      .join(", ") ?? "",
    cc: msg.ccRecipients
      ?.map((r) => r.emailAddress.address)
      .join(", ") ?? "",
    subject: msg.subject ?? "",
    body: msg.bodyPreview ?? "",
    bodyHtml: msg.body?.contentType === "html" ? msg.body.content : "",
    isRead: msg.isRead,
    hasAttachment: msg.hasAttachments,
    receivedAt: new Date(msg.receivedDateTime),
    labels: msg.categories ?? [],
  }));

  return { messages };
}

export async function sendOutlookMessage(
  userId: string,
  to: string,
  subject: string,
  body: string,
  inReplyTo?: string
): Promise<void> {
  const token = await getAccessToken(userId);

  const message: Record<string, unknown> = {
    subject,
    body: { contentType: "HTML", content: body },
    toRecipients: to.split(",").map((email) => ({
      emailAddress: { address: email.trim() },
    })),
  };

  const endpoint = inReplyTo
    ? `https://graph.microsoft.com/v1.0/me/messages/${inReplyTo}/reply`
    : "https://graph.microsoft.com/v1.0/me/sendMail";

  const payload = inReplyTo ? { comment: body } : { message, saveToSentItems: true };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to send Outlook message");
  }
}

export async function markOutlookMessageRead(
  userId: string,
  messageId: string,
  isRead: boolean
): Promise<void> {
  const token = await getAccessToken(userId);

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isRead }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update Outlook message");
  }
}
