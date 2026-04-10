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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요." },
        { status: 500 }
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
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("PDF parse error:", message);
    return NextResponse.json(
      { error: `PDF 처리 중 오류: ${message}` },
      { status: 500 }
    );
  }
}
