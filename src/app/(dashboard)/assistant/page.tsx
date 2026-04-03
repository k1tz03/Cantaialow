"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Plus, Loader2, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AssistantPage() {
  const t = useTranslations("assistant");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    const userMessage: Message = { role: "user", content: text };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setStreaming(true);

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: err.error || "An error occurred.",
          };
          return updated;
        });
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setStreaming(false);
        return;
      }

      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const token =
                parsed.choices?.[0]?.delta?.content ??
                parsed.token ??
                parsed.text ??
                parsed.content ??
                "";
              if (token) {
                accumulated += token;
                const current = accumulated;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: current,
                  };
                  return updated;
                });
              }
            } catch {
              // If it's not JSON, treat as plain text token
              if (data && data !== "[DONE]") {
                accumulated += data;
                const current = accumulated;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: current,
                  };
                  return updated;
                });
              }
            }
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "An error occurred. Please try again.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-display font-bold">{t("title")}</h1>
        <Button variant="outline" onClick={handleNewConversation}>
          <Plus className="w-4 h-4 mr-2" />
          {t("newChat")}
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">{t("placeholder")}</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-accent text-white"
                    : "bg-elevated text-foreground"
                }`}
              >
                {msg.content}
                {msg.role === "assistant" && msg.content === "" && streaming && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t("thinking")}
                  </span>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-elevated flex items-center justify-center">
                  <User className="w-4 h-4 text-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t border-border p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              disabled={streaming}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={streaming || !input.trim()}>
              {streaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
