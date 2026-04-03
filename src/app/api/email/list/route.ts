import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { EmailFolder } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const folder = (url.searchParams.get("folder") ?? "INBOX") as EmailFolder;
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = parseInt(url.searchParams.get("limit") ?? "50");
  const search = url.searchParams.get("search") ?? "";
  const unreadOnly = url.searchParams.get("unread") === "true";

  const where = {
    orgId: session.user.orgId,
    folder,
    ...(search && {
      OR: [
        { subject: { contains: search, mode: "insensitive" as const } },
        { from: { contains: search, mode: "insensitive" as const } },
        { body: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(unreadOnly && { isRead: false }),
  };

  const [emails, total] = await Promise.all([
    prisma.email.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        externalId: true,
        from: true,
        fromEmail: true,
        subject: true,
        body: true,
        folder: true,
        isRead: true,
        isStarred: true,
        hasAttachment: true,
        receivedAt: true,
        aiClassification: true,
        aiSuggestion: true,
      },
    }),
    prisma.email.count({ where }),
  ]);

  return NextResponse.json({
    emails,
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}
