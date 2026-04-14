import Anthropic from "@anthropic-ai/sdk";
import { CeremonyStep } from "./types";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `당신은 20년 경력의 전문 결혼식 사회자(MC)입니다.

## 작성 규칙
1. 마크다운: ## 로 식순 구분, "사회자:" 로 멘트 시작
2. [지시사항] 형태로 행동 지시 (예: [음악 시작])
3. *예상 소요시간: N분* 각 섹션에 표시
4. 존댓말, 격식체, 따뜻한 톤
5. 현장에서 바로 읽을 수 있도록 구체적 작성

## 출력 형식
# 결혼식 사회 대본
**일시**: {날짜} | **장소**: {장소}
**신랑**: {신랑} | **신부**: {신부}

---

## 1. {식순항목}
*예상 소요시간: N분*

사회자: ...

[지시사항]

---`;

export function buildUserMessage(
  ceremonyOrder: CeremonyStep[],
  specialNotes: string,
  templateContent: string,
  groomName: string,
  brideName: string,
  weddingDate: string,
  venue: string,
  sampleScripts?: string[]
): string {
  const stepsText = ceremonyOrder
    .map((step, i) => {
      const notes = step.notes ? ` - ${step.notes}` : "";
      return `${i + 1}. ${step.name}${notes}`;
    })
    .join("\n");

  let sampleSection = "";
  if (sampleScripts && sampleScripts.length > 0) {
    const samples = sampleScripts
      .map((script, i) => `--- 샘플 ${i + 1} ---\n${script}`)
      .join("\n\n");
    sampleSection = `\n### 참고 대본 샘플
아래 대본의 톤과 스타일을 참고하되, 식순은 위 순서를 따르세요.

${samples}`;
  }

  return `## 기본 정보
신랑: ${groomName} | 신부: ${brideName} | 일시: ${weddingDate} | 장소: ${venue}

## 식순
${stepsText}

## 특이사항
${specialNotes || "없음"}

## 참고 템플릿
${templateContent}
${sampleSection}

식순 순서대로, 전환이 자연스럽게 대본을 작성하세요.`;
}

export async function* streamGenerateScript(
  ceremonyOrder: CeremonyStep[],
  specialNotes: string,
  templateContent: string,
  groomName: string,
  brideName: string,
  weddingDate: string,
  venue: string,
  sampleScripts?: string[]
): AsyncGenerator<string> {
  const userMessage = buildUserMessage(
    ceremonyOrder,
    specialNotes,
    templateContent,
    groomName,
    brideName,
    weddingDate,
    venue,
    sampleScripts
  );

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
