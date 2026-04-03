"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PdfUpload } from "@/components/pdf/pdf-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Send, Loader2 } from "lucide-react";

interface Lot {
  id: string;
  numero: string;
  designation: string;
  quantite?: string;
  unite?: string;
  delai?: string;
  selected: boolean;
}

export default function AppelsOffresPage() {
  const t = useTranslations("appelsOffres");
  const [extractedText, setExtractedText] = useState("");
  const [lots, setLots] = useState<Lot[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!extractedText) return;
    setAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/pdf/analyze-ao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      const parsedLots: Lot[] = (data.lots ?? []).map(
        (lot: Record<string, string | boolean>, idx: number) => ({
          id: String(idx),
          numero: lot.numero ?? lot.number ?? String(idx + 1),
          designation: lot.designation ?? lot.description ?? "",
          quantite: lot.quantite ?? lot.quantity ?? "",
          unite: lot.unite ?? lot.unit ?? "",
          delai: lot.delai ?? lot.deadline ?? "",
          selected: lot.recommended === true,
        })
      );

      setLots(parsedLots.length > 0 ? parsedLots : [{ id: "0", numero: "1", designation: data.raw ?? "No lots extracted", selected: false }]);
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleLot = (id: string) => {
    setLots((prev) => prev.map((l) => l.id === id ? { ...l, selected: !l.selected } : l));
  };

  const selectedCount = lots.filter((l) => l.selected).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">{t("title")}</h1>

      {!extractedText ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t("upload")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PdfUpload onTextExtracted={handleTextExtracted} onError={setError} />
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          </CardContent>
        </Card>
      ) : lots.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">{extractedText.slice(0, 200)}...</p>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("extracting")}</> : t("analyze")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t("lots")}</CardTitle>
                <Badge variant="secondary">{selectedCount} {t("selectedLots")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lots.map((lot) => (
                  <button
                    key={lot.id}
                    onClick={() => toggleLot(lot.id)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors ${lot.selected ? "border-accent bg-accent/5" : "border-border hover:bg-elevated"}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${lot.selected ? "border-accent bg-accent" : "border-border"}`}>
                      {lot.selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Lot {lot.numero}</span>
                        {lot.delai && <Badge variant="outline" className="text-xs">{lot.delai}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{lot.designation}</p>
                      {lot.quantite && <p className="text-xs text-muted-foreground mt-0.5">{lot.quantite} {lot.unite}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          {selectedCount > 0 && (
            <div className="flex gap-3">
              <Button><Send className="w-4 h-4 mr-2" />{t("sendToSuppliers")} ({selectedCount})</Button>
              <Button variant="outline" onClick={() => { setLots([]); setExtractedText(""); }}>{t("upload")}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
