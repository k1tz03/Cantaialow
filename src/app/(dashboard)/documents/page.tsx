"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Plus,
  PenTool,
  Eraser,
  Download,
  Send,
  Loader2,
} from "lucide-react";

export default function DocumentsPage() {
  const t = useTranslations("documents");
  const [pvContent, setPvContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [signed, setSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [affaireTitre, setAffaireTitre] = useState("");
  const [reserves, setReserves] = useState("");

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setPvContent("");

    try {
      const response = await fetch("/api/pv/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affaireData: { titre: affaireTitre || "Chantier" },
          emailsSummary: "",
          reserves,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.text) {
                fullText += parsed.text;
                setPvContent(fullText);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      setPvContent("Error generating PV.");
    } finally {
      setGenerating(false);
    }
  }, [affaireTitre, reserves]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    const x = point.clientX - rect.left;
    const y = point.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "var(--text-primary)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    const x = point.clientX - rect.left;
    const y = point.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check if canvas has been drawn on
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some((val, idx) => idx % 4 === 3 && val > 0);

    if (hasContent) {
      setSigned(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">{t("title")}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PV Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t("pvTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Projet</label>
              <Input
                value={affaireTitre}
                onChange={(e) => setAffaireTitre(e.target.value)}
                placeholder="Nom du chantier"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reserves</label>
              <textarea
                value={reserves}
                onChange={(e) => setReserves(e.target.value)}
                className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                placeholder="Liste des réserves..."
              />
            </div>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("generate")}...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" />{t("newPV")}</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Signature pad */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              {t("signature")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border border-border rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <Eraser className="w-4 h-4 mr-1" />
                {t("clearSignature")}
              </Button>
              <Button size="sm" onClick={handleSign} disabled={signed}>
                <PenTool className="w-4 h-4 mr-1" />
                {signed ? "Signed" : t("sign")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated PV */}
      {pvContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t("pvTitle")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  {t("exportPDF")}
                </Button>
                <Button size="sm">
                  <Send className="w-4 h-4 mr-1" />
                  {t("sendByEmail")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {pvContent}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
