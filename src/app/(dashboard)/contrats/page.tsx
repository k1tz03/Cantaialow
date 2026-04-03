"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PdfUpload } from "@/components/pdf/pdf-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";

interface Section {
  title: string;
  content: string;
  expanded: boolean;
}

export default function ContratsPage() {
  const t = useTranslations("contrats");
  const [extractedText, setExtractedText] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = useCallback(async () => {
    if (!extractedText) return;
    setAnalyzing(true);
    setAnalysis("");
    setError("");

    try {
      const response = await fetch("/api/pdf/analyze-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setAnalysis(fullText);
              }
            } catch { /* skip */ }
          }
        }
      }

      // Parse sections from analysis
      const sectionHeaders = fullText.split(/\n#{1,3}\s+/);
      const parsed: Section[] = sectionHeaders
        .filter((s) => s.trim())
        .map((s) => {
          const lines = s.split("\n");
          return {
            title: lines[0]?.trim() ?? "Section",
            content: lines.slice(1).join("\n").trim(),
            expanded: true,
          };
        });

      if (parsed.length > 0) setSections(parsed);
    } catch {
      setError("Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [extractedText]);

  const handleChat = async () => {
    if (!chatQuestion.trim() || !extractedText) return;
    setChatLoading(true);
    const question = chatQuestion;
    setChatQuestion("");
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      const response = await fetch("/api/pdf/analyze-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Context: ${extractedText.slice(0, 10000)}\n\nQuestion: ${question}`,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.text) answer += parsed.text;
            } catch { /* skip */ }
          }
        }
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Error generating response." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleSection = (idx: number) => {
    setSections((prev) => prev.map((s, i) => i === idx ? { ...s, expanded: !s.expanded } : s));
  };

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
            <PdfUpload onTextExtracted={(text) => setExtractedText(text)} onError={setError} />
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          </CardContent>
        </Card>
      ) : !analysis && !analyzing ? (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
            <p className="text-sm">{extractedText.slice(0, 200)}...</p>
            <Button onClick={handleAnalyze}>{t("analyze")}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {analyzing && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span className="text-sm font-medium">{t("analyzing")}</span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                    {analysis}
                  </div>
                </CardContent>
              </Card>
            )}

            {!analyzing && sections.length > 0 && sections.map((section, idx) => (
              <Card key={idx}>
                <button
                  onClick={() => toggleSection(idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-elevated transition-colors rounded-t-lg"
                >
                  <span className="font-medium flex items-center gap-2">
                    {section.title.toLowerCase().includes("alert") || section.title.toLowerCase().includes("vigilance") ? (
                      <AlertTriangle className="w-4 h-4 text-danger" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                    {section.title}
                  </span>
                  {section.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {section.expanded && (
                  <CardContent className="pt-0">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                      {section.content}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            {!analyzing && sections.length === 0 && analysis && (
              <Card>
                <CardContent className="p-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                    {analysis}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat sidebar */}
          <div className="space-y-4">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {t("askQuestion")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`text-sm p-2 rounded-lg ${msg.role === "user" ? "bg-accent/10 text-right" : "bg-elevated"}`}>
                      {msg.content}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    placeholder={t("askQuestion")}
                    onKeyDown={(e) => e.key === "Enter" && handleChat()}
                    disabled={chatLoading}
                  />
                  <Button size="icon" onClick={handleChat} disabled={chatLoading || !chatQuestion.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full" onClick={() => { setExtractedText(""); setAnalysis(""); setSections([]); setChatMessages([]); }}>
              {t("upload")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
