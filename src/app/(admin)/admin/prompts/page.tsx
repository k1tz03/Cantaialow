"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Prompt {
  id: string;
  key: string;
  label: string;
  description: string | null;
  systemPrompt: string;
  userPromptTemplate: string;
  model: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
  version: number;
}

function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, ""))));
}

export default function AdminPromptsPage() {
  const t = useTranslations("admin");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Partial<Prompt>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/prompts")
      .then((r) => r.json())
      .then((data) => setPrompts(data.prompts ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleExpand = (prompt: Prompt) => {
    if (expandedId === prompt.id) {
      setExpandedId(null);
      setEditState({});
    } else {
      setExpandedId(prompt.id);
      setEditState({
        systemPrompt: prompt.systemPrompt,
        userPromptTemplate: prompt.userPromptTemplate,
        model: prompt.model,
        maxTokens: prompt.maxTokens,
        temperature: prompt.temperature,
        isActive: prompt.isActive,
      });
    }
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    const res = await fetch("/api/admin/prompts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editState }),
    });
    if (res.ok) {
      const { prompt } = await res.json();
      setPrompts((prev) => prev.map((p) => (p.id === id ? prompt : p)));
      setExpandedId(null);
      setEditState({});
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">{t("prompts")}</h1>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-elevated rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">{t("prompts")}</h1>

      {prompts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No prompts configured yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {prompts.map((prompt) => {
            const isExpanded = expandedId === prompt.id;
            const variables = extractVariables(prompt.userPromptTemplate);

            return (
              <Card key={prompt.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => handleExpand(prompt)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">
                        {prompt.label}
                      </CardTitle>
                      <Badge variant="outline">{prompt.key}</Badge>
                      <Badge variant="secondary">{prompt.model}</Badge>
                      <Badge
                        variant={prompt.isActive ? "success" : "destructive"}
                      >
                        {prompt.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        v{prompt.version}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {isExpanded ? "Collapse" : "Expand"}
                    </span>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    {variables.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground">
                          Variables:
                        </span>
                        {variables.map((v) => (
                          <Badge
                            key={v}
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(`{{${v}}}`);
                            }}
                          >
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        System Prompt
                      </label>
                      <textarea
                        className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        value={editState.systemPrompt ?? ""}
                        onChange={(e) =>
                          setEditState((s) => ({
                            ...s,
                            systemPrompt: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        User Prompt Template
                      </label>
                      <textarea
                        className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        value={editState.userPromptTemplate ?? ""}
                        onChange={(e) =>
                          setEditState((s) => ({
                            ...s,
                            userPromptTemplate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Model
                        </label>
                        <select
                          className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          value={editState.model ?? "SONNET"}
                          onChange={(e) =>
                            setEditState((s) => ({
                              ...s,
                              model: e.target.value,
                            }))
                          }
                        >
                          <option value="HAIKU">HAIKU</option>
                          <option value="SONNET">SONNET</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Max Tokens
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={4096}
                          value={editState.maxTokens ?? 1024}
                          onChange={(e) =>
                            setEditState((s) => ({
                              ...s,
                              maxTokens: parseInt(e.target.value, 10) || 1024,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Temperature: {editState.temperature ?? 0.7}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={editState.temperature ?? 0.7}
                          onChange={(e) =>
                            setEditState((s) => ({
                              ...s,
                              temperature: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full mt-2"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editState.isActive ?? true}
                          onChange={(e) =>
                            setEditState((s) => ({
                              ...s,
                              isActive: e.target.checked,
                            }))
                          }
                          className="rounded"
                        />
                        Active
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSave(prompt.id)}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
