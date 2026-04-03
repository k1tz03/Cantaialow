"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  role: string;
  createdAt: string;
  aiCallsThisMonth: number;
}

const PLAN_VARIANT: Record<string, "default" | "secondary" | "success"> = {
  FREE: "secondary",
  PRO: "default",
  BUSINESS: "success",
};

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (planFilter) params.set("plan", planFilter);

    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotalPages(data.totalPages ?? 1);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, search, planFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePlanFilter = (plan: string) => {
    setPlanFilter(planFilter === plan ? "" : plan);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">{t("users")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("users")} ({total})
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2">
              {["FREE", "PRO", "BUSINESS"].map((plan) => (
                <Badge
                  key={plan}
                  variant={planFilter === plan ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handlePlanFilter(plan)}
                >
                  {plan}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-elevated rounded animate-pulse"
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Plan
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      AI Calls
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-3">{user.name ?? "-"}</td>
                      <td className="py-3 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="py-3">
                        <Badge variant={PLAN_VARIANT[user.plan] ?? "secondary"}>
                          {user.plan}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            user.role === "SUPER_ADMIN"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3">{user.aiCallsThisMonth}</td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
