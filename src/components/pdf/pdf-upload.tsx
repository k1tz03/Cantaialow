"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfUploadProps {
  onTextExtracted: (text: string, pages: number) => void;
  onError: (error: string) => void;
}

export function PdfUpload({ onTextExtracted, onError }: PdfUploadProps) {
  const t = useTranslations("common");
  const tErr = useTranslations("errors");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate client-side
      if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
        onError(tErr("pdfInvalidType"));
        setStatus("error");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        onError(tErr("pdfTooLarge"));
        setStatus("error");
        return;
      }

      setFileName(file.name);
      setStatus("uploading");
      setUploading(true);
      setProgress(30);

      try {
        const formData = new FormData();
        formData.append("file", file);

        setProgress(50);
        setStatus("processing");

        const response = await fetch("/api/pdf/upload", {
          method: "POST",
          body: formData,
        });

        setProgress(80);

        if (!response.ok) {
          const data = await response.json();
          const errorKey = data.error?.includes("50MB")
            ? "pdfTooLarge"
            : data.error?.includes("Invalid")
            ? "pdfInvalidType"
            : "uploadFailed";
          onError(tErr(errorKey));
          setStatus("error");
          return;
        }

        const data = await response.json();
        setProgress(100);
        setStatus("done");
        onTextExtracted(data.text, data.pages);
      } catch {
        onError(tErr("uploadFailed"));
        setStatus("error");
      } finally {
        setUploading(false);
      }
    },
    [onTextExtracted, onError, tErr]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        status === "error"
          ? "border-danger/50 bg-danger/5"
          : status === "done"
          ? "border-success/50 bg-success/5"
          : "border-border hover:border-accent/50"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {status === "idle" && (
        <>
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            {t("upload")} PDF (max 50 Mo)
          </p>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {t("upload")}
          </Button>
        </>
      )}

      {(status === "uploading" || status === "processing") && (
        <>
          <FileText className="w-10 h-10 text-accent mx-auto mb-3 animate-pulse" />
          <p className="text-sm font-medium mb-2">{fileName}</p>
          <div className="w-full max-w-xs mx-auto bg-elevated rounded-full h-2 mb-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {status === "uploading" ? t("loading") : t("loading")}
          </p>
        </>
      )}

      {status === "done" && (
        <>
          <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
          <p className="text-sm font-medium">{fileName}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("success")}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setStatus("idle");
              setProgress(0);
            }}
          >
            {t("upload")}
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
          <p className="text-sm font-medium text-danger">{t("error")}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setStatus("idle");
              setProgress(0);
            }}
          >
            {t("retry")}
          </Button>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
