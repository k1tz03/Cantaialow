import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsersThisMonth,
    newUsersToday,
    newUsersWeek,
    proUserCount,
    aiCostTodayResult,
    aiCostMonthResult,
    totalAiCalls,
    cacheHitCalls,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.session.groupBy({
      by: ["userId"],
      where: { expires: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.user.count({
      where: { createdAt: { gte: todayStart }, deletedAt: null },
    }),
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo }, deletedAt: null },
    }),
    prisma.user.count({
      where: { plan: "PRO", deletedAt: null },
    }),
    prisma.aiCall.aggregate({
      _sum: { costUsd: true },
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.aiCall.aggregate({
      _sum: { costUsd: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.aiCall.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.aiCall.count({
      where: { createdAt: { gte: thirtyDaysAgo }, cacheHit: true },
    }),
  ]);

  const activeCount = activeUsersThisMonth.length;
  const mrr = proUserCount * 30;
  const aiCostToday = aiCostTodayResult._sum.costUsd ?? 0;
  const aiCostMonth = aiCostMonthResult._sum.costUsd ?? 0;
  const avgCostPerUser = totalUsers > 0 ? aiCostMonth / totalUsers : 0;
  const cacheHitRate =
    totalAiCalls > 0 ? (cacheHitCalls / totalAiCalls) * 100 : 0;

  return NextResponse.json({
    totalUsers,
    activeUsersThisMonth: activeCount,
    newUsersToday,
    newUsersWeek,
    mrr,
    aiCostToday: Math.round(aiCostToday * 100) / 100,
    aiCostMonth: Math.round(aiCostMonth * 100) / 100,
    avgCostPerUser: Math.round(avgCostPerUser * 100) / 100,
    cacheHitRate: Math.round(cacheHitRate * 10) / 10,
  });
}
