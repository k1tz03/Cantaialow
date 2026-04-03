"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Reply,
  ReplyAll,
  Forward,
  Paperclip,
  Sparkles,
  RefreshCw,
  Send,
  Save,
} from "lucide-react";
import type { EmailItem } from "./email-list";

interface EmailDetailProps {
  email: EmailItem | null;
}

const TONES = [
  "professional",
  "direct",
  "firm",
  "commercial",
  "custom",
] as const;

export function EmailDetail({ email }: EmailDetailProps) {
  const t = useTranslations("emails");
  const [replyMode, setReplyMode] = useState(false);
  const [selectedTone, setSelectedTone] = useState<string>("professional");
  const [generatedReply, setGeneratedReply] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedReply, setEditedReply] = useState("");
  const [sending, setSending] = useState(false);

  const generateReply = useCallback(async () => {
    if (!email) return;
    setIsGenerating(true);
    setGeneratedReply("");
    setEditedReply("");

    try {
      const response = await fetch("/api/ai/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailContent: `Subject: ${email.subject}\nFrom: ${email.from}\n\n${email.body}`,
          tone: selectedTone,
          context: "",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate");

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
                setGeneratedReply(fullText);
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      }

      setEditedReply(fullText);
    } catch {
      setGeneratedReply("Error generating reply. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [email, selectedTone]);

  const handleSend = async () => {
    if (!email || !editedReply) return;
    setSending(true);

    try {
      await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email.fromEmail,
          subject: `Re: ${email.subject}`,
          body: editedReply,
          inReplyTo: email.id,
        }),
      });
      setReplyMode(false);
      setGeneratedReply("");
      setEditedReply("");
    } catch {
      // handle error
    } finally {
      setSending(false);
    }
  };

  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">{t("noEmails")}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">{email.subject || "(no subject)"}</h2>
        <div className="flex items-center gap-2 mt-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center text-xs font-medium shrink-0">
            {(email.from || "?")[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{email.from}</p>
            <p className="text-muted-foreground text-xs">{email.fromEmail}</p>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(email.receivedAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm">{email.body}</div>
        </div>

        {email.hasAttachment && (
          <div className="mt-4 p-3 rounded-lg border border-border bg-elevated">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="w-4 h-4" />
              {t("attachments")}
            </div>
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="border-t border-border p-3 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setReplyMode(!replyMode)}
        >
          <Reply className="w-4 h-4 mr-1" />
          {t("reply")}
        </Button>
        <Button variant="outline" size="sm">
          <ReplyAll className="w-4 h-4 mr-1" />
          {t("replyAll")}
        </Button>
        <Button variant="outline" size="sm">
          <Forward className="w-4 h-4 mr-1" />
          {t("forward")}
        </Button>
      </div>

      {/* AI Reply section */}
      {replyMode && (
        <div className="border-t border-border p-4 space-y-3 bg-surface">
          {/* Tone selector */}
          <div className="flex flex-wrap gap-2">
            {TONES.map((tone) => (
              <Badge
                key={tone}
                variant={selectedTone === tone ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTone(tone)}
              >
                {t(`tone.${tone}`)}
              </Badge>
            ))}
          </div>

          {/* Generate button */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={generateReply}
              disabled={isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              {isGenerating ? "..." : t("generateReply")}
            </Button>
            {generatedReply && (
              <Button
                variant="outline"
                size="sm"
                onClick={generateReply}
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {t("regenerate")}
              </Button>
            )}
          </div>

          {/* Generated/editable reply */}
          {(generatedReply || editedReply) && (
            <Card>
              <CardContent className="p-3">
                {email.aiSuggestion && !generatedReply && (
                  <div className="mb-2 p-2 rounded bg-accent/10 text-sm">
                    <span className="font-medium text-accent">
                      {t("aiSuggestion")}:
                    </span>{" "}
                    {email.aiSuggestion}
                  </div>
                )}
                <textarea
                  value={editedReply || generatedReply}
                  onChange={(e) => setEditedReply(e.target.value)}
                  className="w-full min-h-[150px] bg-transparent text-sm resize-none focus:outline-none"
                  placeholder="..."
                />
              </CardContent>
            </Card>
          )}

          {/* Send / Save */}
          {editedReply && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSend} disabled={sending}>
                <Send className="w-4 h-4 mr-1" />
                {sending ? "..." : t("reply")}
              </Button>
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-1" />
                {t("saveDraft")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
