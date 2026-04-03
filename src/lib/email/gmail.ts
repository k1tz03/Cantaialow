import { prisma } from "@/lib/db";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
].join(" ");

export function getGmailAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/gmail/callback`,
    response_type: "code",
    scope: GMAIL_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: userId,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGmailCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/gmail/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Gmail code");
  }

  return response.json();
}

export async function refreshGmailToken(refreshToken: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Gmail token");
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
    // Try current token
    const testResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      { headers: { Authorization: `Bearer ${user.emailToken}` } }
    );

    if (testResponse.ok) return user.emailToken;

    // Refresh token
    const newToken = await refreshGmailToken(user.emailRefreshToken);
    await prisma.user.update({
      where: { id: userId },
      data: { emailToken: newToken },
    });

    return newToken;
  } catch {
    const newToken = await refreshGmailToken(user.emailRefreshToken);
    await prisma.user.update({
      where: { id: userId },
      data: { emailToken: newToken },
    });
    return newToken;
  }
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
      parts?: Array<{
        mimeType: string;
        body?: { data?: string };
      }>;
    }>;
  };
  internalDate: string;
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractBody(payload: GmailMessage["payload"]): { text: string; html: string } {
  let text = "";
  let html = "";

  if (payload.body?.data) {
    text = decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        text = decodeBase64Url(part.body.data);
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        html = decodeBase64Url(part.body.data);
      }
      if (part.mimeType === "multipart/alternative" && part.parts) {
        for (const subPart of part.parts) {
          if (subPart.mimeType === "text/plain" && subPart.body?.data) {
            text = decodeBase64Url(subPart.body.data);
          }
          if (subPart.mimeType === "text/html" && subPart.body?.data) {
            html = decodeBase64Url(subPart.body.data);
          }
        }
      }
    }
  }

  return { text, html };
}

export async function fetchGmailMessages(
  userId: string,
  options: { maxResults?: number; query?: string; pageToken?: string } = {}
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
  nextPageToken?: string;
}> {
  const token = await getAccessToken(userId);
  const params = new URLSearchParams({
    maxResults: String(options.maxResults ?? 50),
  });
  if (options.query) params.set("q", options.query);
  if (options.pageToken) params.set("pageToken", options.pageToken);

  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!listResponse.ok) {
    throw new Error("Failed to list Gmail messages");
  }

  const listData = await listResponse.json();

  if (!listData.messages || listData.messages.length === 0) {
    return { messages: [] };
  }

  const messages = await Promise.all(
    listData.messages.map(async (msg: { id: string }) => {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const msgData: GmailMessage = await msgResponse.json();
      const headers = msgData.payload.headers;
      const { text, html } = extractBody(msgData.payload);

      const fromFull = getHeader(headers, "From");
      const emailMatch = fromFull.match(/<(.+?)>/);
      const fromEmail = emailMatch ? emailMatch[1] : fromFull;
      const fromName = fromFull.replace(/<.+?>/, "").trim().replace(/"/g, "");

      return {
        externalId: msgData.id,
        threadId: msgData.threadId,
        from: fromName || fromEmail,
        fromEmail,
        to: getHeader(headers, "To"),
        cc: getHeader(headers, "Cc"),
        subject: getHeader(headers, "Subject"),
        body: text,
        bodyHtml: html,
        isRead: !(msgData.labelIds?.includes("UNREAD") ?? false),
        hasAttachment: msgData.payload.parts
          ? msgData.payload.parts.some(
              (p) => p.mimeType !== "text/plain" && p.mimeType !== "text/html" && p.mimeType !== "multipart/alternative"
            )
          : false,
        receivedAt: new Date(parseInt(msgData.internalDate)),
        labels: msgData.labelIds ?? [],
      };
    })
  );

  return {
    messages,
    nextPageToken: listData.nextPageToken,
  };
}

export async function sendGmailMessage(
  userId: string,
  to: string,
  subject: string,
  body: string,
  inReplyTo?: string
): Promise<void> {
  const token = await getAccessToken(userId);

  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
  ];

  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
    headers.push(`References: ${inReplyTo}`);
  }

  const email = `${headers.join("\r\n")}\r\n\r\n${body}`;
  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedEmail }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to send Gmail message");
  }
}

export async function modifyGmailMessage(
  userId: string,
  messageId: string,
  addLabels: string[] = [],
  removeLabels: string[] = []
): Promise<void> {
  const token = await getAccessToken(userId);

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addLabelIds: addLabels,
        removeLabelIds: removeLabels,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to modify Gmail message");
  }
}
