"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2 } from "lucide-react";

interface Affaire {
  id: string;
  titre: string;
  client: string | null;
  adresse: string | null;
  statut: string;
  montantHT: number | null;
  dateDebut: string | null;
  dateFin: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

const STATUSES = ["ALL", "DEVIS", "EN_COURS", "TERMINE", "FACTURE"] as const;

const statusBadgeVariant: Record<string, "default" | "secondary" | "success" | "destructive" | "outline"> = {
  DEVIS: "outline",
  EN_COURS: "default",
  TERMINE: "success",
  FACTURE: "secondary",
};

function formatCurrency(value: number | null): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default function AffairesPage() {
  const t = useTranslations("affaires");
  const tc = useTranslations("common");

  const [affaires, setAffaires] = useState<Affaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    titre: "",
    client: "",
    adresse: "",
    statut: "DEVIS",
    montantHT: "",
    notes: "",
  });

  const statusLabel: Record<string, string> = {
    ALL: tc("filter"),
    DEVIS: t("devis"),
    EN_COURS: t("enCours"),
    TERMINE: t("termine"),
    FACTURE: t("facture"),
  };

  const fetchAffaires = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFilter !== "ALL") params.set("status", activeFilter);
      const res = await fetch(`/api/affaires?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAffaires(data.affaires ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchAffaires();
  }, [fetchAffaires]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/affaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: form.titre,
          client: form.client || undefined,
          adresse: form.adresse || undefined,
          statut: form.statut,
          montantHT: form.montantHT ? parseFloat(form.montantHT) : undefined,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        setForm({ titre: "", client: "", adresse: "", statut: "DEVIS", montantHT: "", notes: "" });
        setShowForm(false);
        fetchAffaires();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">{t("title")}</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? tc("cancel") : t("new")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("title")} *</label>
                <Input
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  placeholder={t("title")}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("client")}</label>
                <Input
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  placeholder={t("client")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("address")}</label>
                <Input
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  placeholder={t("address")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("status")}</label>
                <select
                  value={form.statut}
                  onChange={(e) => setForm({ ...form, statut: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <option value="DEVIS">{t("devis")}</option>
                  <option value="EN_COURS">{t("enCours")}</option>
                  <option value="TERMINE">{t("termine")}</option>
                  <option value="FACTURE">{t("facture")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("amount")}</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.montantHT}
                  onChange={(e) => setForm({ ...form, montantHT: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("notes")}</label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder={t("notes")}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {tc("cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {tc("create")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s}
            variant={activeFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(s)}
          >
            {statusLabel[s]}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : affaires.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{tc("noResults")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {affaires.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight">{a.titre}</h3>
                  <Badge variant={statusBadgeVariant[a.statut] ?? "secondary"}>
                    {statusLabel[a.statut] ?? a.statut}
                  </Badge>
                </div>
                {a.client && (
                  <p className="text-sm text-muted-foreground">{t("client")}: {a.client}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{formatCurrency(a.montantHT)}</span>
                  <span className="text-muted-foreground">{formatDate(a.dateDebut)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
