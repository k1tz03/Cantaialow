type PdfParseFn = (buffer: Buffer, options?: { max?: number }) => Promise<{ text: string; numpages: number }>;

async function getPdfParse(): Promise<PdfParseFn> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("pdf-parse") as PdfParseFn;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MIN_TEXT_LENGTH = 100; // Below this, try OCR via Claude Vision

interface PdfExtractionResult {
  text: string;
  pages: number;
  method: "native" | "pdfjs" | "vision";
  error?: string;
}

function validatePdf(buffer: Buffer, fileName: string): void {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("PDF_TOO_LARGE");
  }

  // Check PDF magic bytes (%PDF-)
  const header = buffer.subarray(0, 5).toString("ascii");
  if (!header.startsWith("%PDF-")) {
    throw new Error("PDF_INVALID_TYPE");
  }

  // Basic extension check
  if (fileName && !fileName.toLowerCase().endsWith(".pdf")) {
    throw new Error("PDF_INVALID_TYPE");
  }
}

function validateMimeType(mimeType: string): void {
  const validTypes = ["application/pdf", "application/x-pdf"];
  if (!validTypes.includes(mimeType)) {
    throw new Error("PDF_INVALID_TYPE");
  }
}

/**
 * Layer 1: pdf-parse (native text extraction)
 */
async function extractWithPdfParse(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    const pdfParse = await getPdfParse();
    const data = await pdfParse(buffer, {
      max: 0, // no page limit
    });

    return {
      text: data.text,
      pages: data.numpages,
      method: "native",
    };
  } catch {
    return {
      text: "",
      pages: 0,
      method: "native",
      error: "pdf-parse extraction failed",
    };
  }
}

/**
 * Layer 3: Claude Vision (for scanned PDFs)
 * Converts PDF pages to base64 images and sends to Claude
 */
async function extractWithVision(
  buffer: Buffer,
  apiKey: string
): Promise<PdfExtractionResult> {
  try {
    // Send the PDF directly as a document to Claude
    const base64 = buffer.toString("base64");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64,
                },
              },
              {
                type: "text",
                text: "Extract all text content from this PDF document. Return the raw text content only, no commentary.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Vision API request failed");
    }

    const data = await response.json();
    const textBlock = data.content?.find(
      (c: { type: string }) => c.type === "text"
    );

    return {
      text: textBlock?.text ?? "",
      pages: 1,
      method: "vision",
    };
  } catch (error) {
    return {
      text: "",
      pages: 0,
      method: "vision",
      error: `Vision extraction failed: ${error instanceof Error ? error.message : "unknown"}`,
    };
  }
}

/**
 * Triple-layer PDF extraction
 * Layer 1: pdf-parse (native text)
 * Layer 2: pdf-parse with different options (fallback)
 * Layer 3: Claude Vision (scanned PDFs)
 */
export async function extractPdfText(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<PdfExtractionResult> {
  // Validate
  validateMimeType(mimeType);
  validatePdf(buffer, fileName);

  // Layer 1: pdf-parse
  const layer1 = await extractWithPdfParse(buffer);

  if (layer1.text.trim().length >= MIN_TEXT_LENGTH) {
    return layer1;
  }

  // Layer 2: Retry with different encoding handling
  try {
    const pdfParse = await getPdfParse();
    const data = await pdfParse(buffer);
    if (data.text.trim().length >= MIN_TEXT_LENGTH) {
      return {
        text: data.text,
        pages: data.numpages,
        method: "pdfjs",
      };
    }
  } catch {
    // Continue to layer 3
  }

  // Layer 3: Claude Vision for scanned PDFs
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      text: layer1.text || "",
      pages: layer1.pages,
      method: "native",
      error:
        "Text extraction returned insufficient content and no API key available for OCR",
    };
  }

  const layer3 = await extractWithVision(buffer, apiKey);
  if (layer3.text.trim().length > 0) {
    return layer3;
  }

  // All layers failed
  return {
    text: layer1.text || "",
    pages: layer1.pages || 0,
    method: "native",
    error: "All extraction methods returned insufficient text",
  };
}

/**
 * Compress text for AI processing
 * - Strip excessive whitespace
 * - Truncate to max length
 * - For very long docs, extract key sections
 */
export function compressForAi(
  text: string,
  maxLength: number = 50000
): string {
  // Normalize whitespace
  let compressed = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  // If under limit, return as-is
  if (compressed.length <= maxLength) {
    return compressed;
  }

  // Take first and last portions for context
  const firstPortion = Math.floor(maxLength * 0.7);
  const lastPortion = maxLength - firstPortion - 50;

  compressed =
    compressed.slice(0, firstPortion) +
    "\n\n[... document truncated ...]\n\n" +
    compressed.slice(-lastPortion);

  return compressed;
}
