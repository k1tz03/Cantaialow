import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractPdfText, compressForAi } from "@/lib/pdf/extract";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await extractPdfText(buffer, file.name, file.type);

    if (result.error && !result.text) {
      return NextResponse.json(
        { error: result.error },
        { status: 422 }
      );
    }

    const compressed = compressForAi(result.text);

    return NextResponse.json({
      text: compressed,
      pages: result.pages,
      method: result.method,
      originalLength: result.text.length,
      compressedLength: compressed.length,
      warning: result.error,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (message === "PDF_TOO_LARGE") {
      return NextResponse.json(
        { error: "File exceeds 50MB limit" },
        { status: 413 }
      );
    }
    if (message === "PDF_INVALID_TYPE") {
      return NextResponse.json(
        { error: "Invalid PDF file" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "PDF processing failed" },
      { status: 500 }
    );
  }
}
