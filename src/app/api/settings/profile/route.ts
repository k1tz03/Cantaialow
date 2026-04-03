import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      language: true,
      theme: true,
      metier: true,
      plan: true,
      emailConnected: true,
      emailProvider: true,
      onboardingCompleted: true,
      aiCallsThisMonth: true,
    },
  });

  const org = await prisma.organization.findFirst({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ user, organization: org });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, language, theme, metier, orgName, siret, adresse, emailFacturation, tva } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (language !== undefined) updateData.language = language;
    if (theme !== undefined) updateData.theme = theme;
    if (metier !== undefined) updateData.metier = metier;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
      });
    }

    // Update or create organization
    if (orgName || siret || adresse || emailFacturation || tva) {
      const existingOrg = await prisma.organization.findFirst({
        where: { userId: session.user.id },
      });

      const orgData: Record<string, unknown> = {};
      if (orgName !== undefined) orgData.name = orgName;
      if (siret !== undefined) orgData.siret = siret;
      if (adresse !== undefined) orgData.adresse = adresse;
      if (emailFacturation !== undefined) orgData.emailFacturation = emailFacturation;
      if (tva !== undefined) orgData.tva = tva;

      if (existingOrg) {
        await prisma.organization.update({
          where: { id: existingOrg.id },
          data: orgData,
        });
      } else if (orgName) {
        await prisma.organization.create({
          data: {
            name: orgName,
            userId: session.user.id,
            ...orgData,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
