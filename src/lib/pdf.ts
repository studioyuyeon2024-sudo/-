import Anthropic from "@anthropic-ai/sdk";
import { PDFParse } from "pdf-parse";
import { CeremonyStep } from "./types";

const anthropic = new Anthropic();

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdf = new PDFParse({ data: buffer });
  const result = await pdf.getText();
  return result.text;
}

export interface PdfParseResult {
  info: {
    groomName: string;
    brideName: string;
    weddingDate: string;
    venue: string;
  };
  steps: CeremonyStep[];
}

export async function extractCeremonyStepsFromText(
  text: string
): Promise<PdfParseResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `다음은 결혼식 예식 식순이 포함된 PDF에서 추출한 텍스트입니다.
이 텍스트에서 결혼식 식순 항목들과 관련 정보를 추출해 주세요.

## 추출 규칙
1. 번호가 매겨진 식순 항목(예: "1. 개식사", "2. 화촉점화")을 순서대로 추출
2. 각 식순 항목 아래에 있는 상세 정보(음악명, 담당자, 진행 방식 등)를 notes에 포함
   - 예: 음악 정보 "Walking The Wire-Imagine Dragons(편집)" → notes에 기록
   - 예: 담당자 "신부동기 이주영, 김노영 님" → notes에 기록
   - 예: 진행 방식 "등장 후 입장", "신랑신부 낭독" → notes에 기록
3. 체크 표시(✓, ✔, ☑, O 등)가 있는 항목만 추출. 체크 표시가 없다면 나열된 모든 항목 추출
4. 상단에 날짜, 장소, 신랑/신부 이름이 있다면 함께 추출

반드시 아래 JSON 형식으로만 응답해 주세요. 다른 텍스트 없이 JSON만 출력하세요:
{
  "info": {
    "groomName": "신랑 이름 (없으면 빈 문자열)",
    "brideName": "신부 이름 (없으면 빈 문자열)",
    "weddingDate": "날짜 (없으면 빈 문자열)",
    "venue": "장소 (없으면 빈 문자열)"
  },
  "steps": [
    { "name": "식순항목명", "notes": "음악, 담당자, 진행방식 등 상세정보 (없으면 빈 문자열)" }
  ]
}

PDF 텍스트:
${text}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return { info: { groomName: "", brideName: "", weddingDate: "", venue: "" }, steps: [] };
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { info: { groomName: "", brideName: "", weddingDate: "", venue: "" }, steps: [] };

    const parsed = JSON.parse(jsonMatch[0]) as {
      info: { groomName: string; brideName: string; weddingDate: string; venue: string };
      steps: { name: string; notes: string }[];
    };

    return {
      info: {
        groomName: parsed.info?.groomName || "",
        brideName: parsed.info?.brideName || "",
        weddingDate: parsed.info?.weddingDate || "",
        venue: parsed.info?.venue || "",
      },
      steps: (parsed.steps || []).map((item) => ({
        id: crypto.randomUUID(),
        name: item.name,
        notes: item.notes || "",
      })),
    };
  } catch {
    return { info: { groomName: "", brideName: "", weddingDate: "", venue: "" }, steps: [] };
  }
}

export async function extractTextFromPdfForSample(
  buffer: Buffer
): Promise<string> {
  const pdf = new PDFParse({ data: buffer });
  const result = await pdf.getText();
  return result.text;
}
