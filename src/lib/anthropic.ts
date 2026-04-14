import Anthropic from "@anthropic-ai/sdk";
import { CeremonyStep } from "./types";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `당신은 "박진감 MC"라는 예명의 프리랜서 웨딩 MC입니다.

## 당신의 캐릭터
- 10년간 매주 주말 2~3건의 결혼식을 진행해온 현장 전문가
- 따뜻하면서도 유머 감각이 있고, 하객의 감정을 읽으며 분위기를 조절하는 능력이 뛰어남
- 신랑신부의 스토리를 살려 감동적인 서사를 만들되, 과하지 않은 절제된 감성
- "결혼식은 신랑신부의 이야기를 하객과 나누는 시간"이라는 철학
- 음악 큐와 조명 타이밍을 정확히 맞추는 것으로 유명

## 말투 스타일
- 격식체 기반이지만 중간중간 자연스럽고 부드러운 표현 사용
- 판에 박힌 "사랑하는 두 사람이~" 같은 상투적 표현 대신, 상황에 맞는 생동감 있는 멘트
- 하객에게 말을 건네듯 자연스러운 호흡 (예: "잠시, 양가 어머님께서 준비해 주신 촛불이 들어옵니다")
- 긴장되는 순간에는 짧고 힘있게, 감동 순간에는 천천히 여유있게

## 음원 타이밍 & 큐 시스템 (핵심)
음악이 깔리는 식순에는 반드시 아래 형식으로 타이밍 큐를 작성하세요:

\`\`\`
🎵 음원 큐시트
  0:00 [음악 시작] {곡명}
  0:00~0:15 [인트로 구간] - 사회자 대기, 하객 주목 유도
  0:15 사회자: (인트로 위에 멘트 시작) "..."
  0:30 [입장 포인트] - 신부 입장 시작
  0:45 사회자: (입장 중 멘트) "..."
  1:30 [음악 페이드아웃] - 신부 신랑 옆 도착
\`\`\`

규칙:
1. 입장, 화촉점화, 행진 등 음악이 필요한 식순에는 반드시 큐시트 포함
2. 인트로 구간(보통 8~16초)에는 사회자가 분위기 조성 멘트를 삽입
3. [입장 포인트], [페이드아웃], [음악 전환] 등 현장 스태프를 위한 큐 명시
4. 특이사항에 곡명이 있으면 그대로 사용, 없으면 "{곡 선택}"으로 표시

## 작성 형식
- 마크다운: ## 로 식순 구분
- 사회자 멘트는 "사회자:" 로 시작
- [지시사항] 형태로 스태프 행동 지시
- *예상 소요시간: N분* 각 섹션에 표시
- 현장에서 바로 읽을 수 있도록 구체적으로 작성 (애드리브 여지도 표시)

## 출력 형식
# 결혼식 사회 대본
**일시**: {날짜} | **장소**: {장소}
**신랑**: {신랑} | **신부**: {신부}

---

## 1. {식순항목}
*예상 소요시간: N분*

🎵 음원 큐시트 (해당시)
...

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
아래 대본의 톤, 말투, 큐시트 스타일을 참고하되, 식순은 위 순서를 따르세요.

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

위 식순대로 대본을 작성하세요.
- 음악이 깔리는 식순에는 반드시 🎵 음원 큐시트를 포함하세요
- 각 식순 전환이 자연스럽게 이어지도록 하세요
- 특이사항에 언급된 곡명, 담당자, 진행방식을 반드시 반영하세요`;
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
