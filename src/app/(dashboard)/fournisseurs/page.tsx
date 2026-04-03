"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2, Search } from "lucide-react";

interface Fournisseur {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  specialites: string[];
  notes: string | null;
  actif: boolean;
  createdAt: string;
}

export default function FournisseursPage() {
  const t = useTranslations("fournisseurs");
  const tc = useTranslations("common");

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    specialites: "",
    notes: "",
  });

  const fetchFournisseurs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/fournisseurs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFournisseurs(data.fournisseurs ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFournisseurs();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchFournisseurs]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) return;
    setSubmitting(true);
    try {
      const specialites = form.specialites
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/fournisseurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          email: form.email || undefined,
          telephone: form.telephone || undefined,
          specialites: specialites.length > 0 ? specialites : undefined,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        setForm({ nom: "", email: "", telephone: "", specialites: "", notes: "" });
        setShowForm(false);
        fetchFournisseurs();
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
                <label className="text-sm font-medium">{t("name")} *</label>
                <Input
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder={t("name")}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("email")}</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t("email")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("phone")}</label>
                <Input
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder={t("phone")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("specialties")}</label>
                <Input
                  value={form.specialites}
                  onChange={(e) => setForm({ ...form, specialites: e.target.value })}
                  placeholder="Plomberie, Electricite, ..."
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">{t("notes") ?? "Notes"}</label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notes..."
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tc("search") + "..."}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : fournisseurs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{tc("noResults")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fournisseurs.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm">{f.nom}</h3>
                  <Badge variant={f.actif !== false ? "success" : "secondary"}>
                    {f.actif !== false ? t("active") : t("inactive")}
                  </Badge>
                </div>
                {f.email && (
                  <p className="text-sm text-muted-foreground">{f.email}</p>
                )}
                {f.telephone && (
                  <p className="text-sm text-muted-foreground">{f.telephone}</p>
                )}
                {f.specialites && f.specialites.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {f.specialites.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
