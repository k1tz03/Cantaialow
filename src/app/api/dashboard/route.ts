export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.orgId;
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  try {
    const [activeAffaires, unreadEmails, pendingRequests, pendingSignatures] =
      await Promise.all([
        prisma.affaire.count({
          where: { orgId, statut: "EN_COURS" },
        }),
        prisma.email.count({
          where: { orgId, isRead: false, folder: "INBOX" },
        }),
        prisma.demandePrice.count({
          where: {
            statut: "ENVOYEE",
            envoyeeLe: { lt: fiveDaysAgo },
            appelOffres: { orgId },
          },
        }),
        prisma.pV.count({
          where: { orgId, statut: "BROUILLON" },
        }),
      ]);

    return NextResponse.json({
      activeAffaires,
      unreadEmails,
      pendingRequests,
      pendingSignatures,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
