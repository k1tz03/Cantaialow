import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";

  const where = {
    orgId: session.user.orgId,
    ...(search && {
      OR: [
        { nom: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { specialites: { has: search } },
      ],
    }),
  };

  try {
    const fournisseurs = await prisma.fournisseur.findMany({
      where,
      orderBy: { nom: "asc" },
    });

    return NextResponse.json({ fournisseurs });
  } catch (error) {
    console.error("Failed to list fournisseurs:", error);
    return NextResponse.json(
      { error: "Failed to list fournisseurs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nom, email, telephone, specialites, notes } = body as {
      nom: string;
      email?: string;
      telephone?: string;
      specialites?: string[];
      notes?: string;
    };

    if (!nom) {
      return NextResponse.json(
        { error: "nom is required" },
        { status: 400 }
      );
    }

    const fournisseur = await prisma.fournisseur.create({
      data: {
        orgId: session.user.orgId,
        nom,
        email: email ?? null,
        telephone: telephone ?? null,
        specialites: specialites ?? [],
        notes: notes ?? null,
      },
    });

    return NextResponse.json(fournisseur, { status: 201 });
  } catch (error) {
    console.error("Failed to create fournisseur:", error);
    return NextResponse.json(
      { error: "Failed to create fournisseur" },
      { status: 500 }
    );
  }
}
