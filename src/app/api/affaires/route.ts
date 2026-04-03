export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { AffaireStatut } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as AffaireStatut | null;
  const search = url.searchParams.get("search") ?? "";
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = parseInt(url.searchParams.get("limit") ?? "20");

  const where = {
    orgId: session.user.orgId,
    ...(status && { statut: status }),
    ...(search && {
      OR: [
        { titre: { contains: search, mode: "insensitive" as const } },
        { client: { contains: search, mode: "insensitive" as const } },
        { adresse: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  try {
    const [affaires, total] = await Promise.all([
      prisma.affaire.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.affaire.count({ where }),
    ]);

    return NextResponse.json({
      affaires,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error("Failed to list affaires:", error);
    return NextResponse.json(
      { error: "Failed to list affaires" },
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
    const {
      titre,
      client,
      adresse,
      statut,
      montantHT,
      dateDebut,
      dateFin,
      notes,
      tags,
    } = body as {
      titre: string;
      client?: string;
      adresse?: string;
      statut?: AffaireStatut;
      montantHT?: number;
      dateDebut?: string;
      dateFin?: string;
      notes?: string;
      tags?: string[];
    };

    if (!titre) {
      return NextResponse.json(
        { error: "titre is required" },
        { status: 400 }
      );
    }

    const affaire = await prisma.affaire.create({
      data: {
        orgId: session.user.orgId,
        titre,
        client: client ?? null,
        adresse: adresse ?? null,
        statut: statut ?? "DEVIS",
        montantHT: montantHT ?? null,
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null,
        notes: notes ?? null,
        tags: tags ?? [],
      },
    });

    return NextResponse.json(affaire, { status: 201 });
  } catch (error) {
    console.error("Failed to create affaire:", error);
    return NextResponse.json(
      { error: "Failed to create affaire" },
      { status: 500 }
    );
  }
}
