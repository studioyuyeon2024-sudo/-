import { NextRequest, NextResponse } from "next/server";
import { extractCeremonyStepsFromPdf, extractTextFromPdf } from "@/lib/pdf";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfBase64, mode } = body as { pdfBase64: string; mode?: string };

    if (!pdfBase64) {
      return NextResponse.json(
        { error: "PDF 데이터가 없습니다" },
        { status: 400 }
      );
    }

    if (mode === "sample") {
      const text = await extractTextFromPdf(pdfBase64);
      return NextResponse.json({ text });
    }

    const result = await extractCeremonyStepsFromPdf(pdfBase64);

    if (result.steps.length === 0) {
      return NextResponse.json(
        { error: "PDF에서 식순 항목을 찾을 수 없습니다. 식순이 포함된 PDF인지 확인해 주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("PDF parse error:", err);
    return NextResponse.json(
      { error: "PDF 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
