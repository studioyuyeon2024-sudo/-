import Anthropic from "@anthropic-ai/sdk";
import { CeremonyStep } from "./types";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `당신은 20년 경력의 전문 결혼식 사회자(MC)입니다.
한국 결혼식 문화에 정통하며, 격식 있으면서도 따뜻한 진행 멘트를 작성합니다.

## 역할
- 주어진 식순에 맞는 완전한 사회 대본을 작성합니다
- 각 식순 항목마다 자연스러운 전환 멘트를 포함합니다
- 특이사항을 자연스럽게 대본에 반영합니다
- 하객들에게 안내가 필요한 부분은 명확하게 작성합니다

## 작성 규칙
1. 마크다운 형식으로 작성 (## 로 각 식순 구분)
2. 사회자 멘트는 "사회자:" 로 시작
3. [지시사항] 형태로 행동 지시 포함 (예: [음악 시작], [조명 변경])
4. 예상 소요시간을 각 섹션에 표시
5. 존댓말 사용, 격식체
6. 자연스럽고 따뜻한 톤 유지
7. 실제 사회자가 현장에서 바로 읽을 수 있도록 구체적으로 작성

## 출력 형식
# 결혼식 사회 대본
**일시**: {날짜}
**장소**: {장소}
**신랑**: {신랑}  |  **신부**: {신부}

---

## 1. {식순항목}
*예상 소요시간: N분*

사회자: ...

[지시사항]

---
(각 식순 반복)`;

export function buildUserMessage(
  ceremonyOrder: CeremonyStep[],
  specialNotes: string,
  templateContent: string,
  groomName: string,
  brideName: string,
  weddingDate: string,
  venue: string
): string {
  const stepsText = ceremonyOrder
    .map((step, i) => {
      const notes = step.notes ? ` - ${step.notes}` : "";
      return `${i + 1}. ${step.name}${notes}`;
    })
    .join("\n");

  return `다음 정보를 바탕으로 결혼식 사회 대본을 작성해 주세요.

### 기본 정보
- 신랑: ${groomName}
- 신부: ${brideName}
- 일시: ${weddingDate}
- 장소: ${venue}

### 식순 (진행 순서)
${stepsText}

### 특이사항
${specialNotes || "없음"}

### 참고 템플릿
${templateContent}

위 식순 순서를 정확히 따라 대본을 작성해 주세요.
각 식순 사이의 전환이 자연스럽도록 해주세요.
특이사항에 언급된 내용을 적절한 위치에 반영해 주세요.`;
}

export async function* streamGenerateScript(
  ceremonyOrder: CeremonyStep[],
  specialNotes: string,
  templateContent: string,
  groomName: string,
  brideName: string,
  weddingDate: string,
  venue: string
): AsyncGenerator<string> {
  const userMessage = buildUserMessage(
    ceremonyOrder,
    specialNotes,
    templateContent,
    groomName,
    brideName,
    weddingDate,
    venue
  );

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
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
