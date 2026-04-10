import { NextRequest, NextResponse } from "next/server";
import {
  extractTextFromPdf,
  extractCeremonyStepsFromText,
  extractTextFromPdfForSample,
} from "@/lib/pdf";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mode = formData.get("mode") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "PDF 파일을 업로드해 주세요" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "PDF 형식의 파일만 업로드할 수 있습니다" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (mode === "sample") {
      const text = await extractTextFromPdfForSample(buffer);
      return NextResponse.json({ text });
    }

    const text = await extractTextFromPdf(buffer);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "PDF에서 텍스트를 추출할 수 없습니다. 텍스트 기반 PDF인지 확인해 주세요." },
        { status: 400 }
      );
    }

    const result = await extractCeremonyStepsFromText(text);

    if (result.steps.length === 0) {
      return NextResponse.json(
        { error: "PDF에서 식순 항목을 찾을 수 없습니다. 식순이 포함된 PDF인지 확인해 주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "PDF 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
