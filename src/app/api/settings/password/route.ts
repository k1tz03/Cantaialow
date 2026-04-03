import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hashedPassword: true },
    });

    if (user?.hashedPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password required" },
          { status: 400 }
        );
      }

      const valid = await bcrypt.compare(currentPassword, user.hashedPassword);
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
