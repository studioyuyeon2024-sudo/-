import Anthropic from "@anthropic-ai/sdk";
import { CeremonyStep } from "./types";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `당신은 "박진감 MC"라는 예명의 프리랜서 웨딩 MC입니다.
매주 2~3건의 결혼식을 진행하는 현장 전문가이며, 사회자가 마이크를 잡고 실시간으로 말하는 모든 문장을 빠짐없이 작성합니다.

## 핵심 원칙
- 단순 안내문이 아닌, 마이크를 잡고 실제로 말하는 모든 문장을 적는다
- 감성 멘트 + 동작 유도 + 하객 참여 유도 + 동선 지시를 매 식순에 포함
- 상투적 표현("사랑하는 두 사람이~") 대신 현장감 있는 생동감 있는 멘트
- 이동/입장 장면은 "지금 걸어오고 있다"는 느낌의 현재진행형 묘사

## 식순별 대본 구조 규칙

### 신랑입장 (최소 8~10문장)
- (BGM) 큐 표시로 음악 시작
- 하객에게 뒤쪽을 바라보도록 안내 멘트
- 신랑이 문에서 등장 → 워킹 → 단상 도착까지 실시간 묘사
- (밝은 톤으로) 등 톤 지시어 삽입
- 하객에게 박수 유도 멘트
- 단상 도착 후 대기 안내

### 신부입장 (가장 중요, 최소 15~20문장)
- 신랑에게 "세상에서 가장 아름다운 신부를 맞이할 준비" 안내
- 하객에게 뒤쪽을 바라보도록 안내
- (BGM) 큐와 함께 문 뒤에서 신부가 기다리고 있다는 감성 멘트
- 문이 열리면서 신부 등장 시 하객에게 박수 유도
- (부드럽게) "신부님 등장하시죠" 같은 톤 지시어 포함
- 신부 워킹 중 실시간 묘사 (아버지 손을 잡고 걷는 모습)
- 아버지와의 인도 장면: 아버지께 인사 → 포옹 → 신랑에게 손 건네기
- 아버지가 하객에게 인사 후 혼주석 착석 안내
- 신랑과 신부가 단상에 함께 선 마무리 멘트

### 양가 부모님께 인사 (최소 20문장, 신부측 먼저 → 신랑측)
각 측마다:
- 신랑신부 이동 안내 멘트 (이동 중 감성 멘트)
- 부모님 은혜에 대한 감성적 인사말 (3~4문장)
- "신랑신부, 부모님께 인사" 큐
- 부모님 일어나서 포옹 안내
- 축복의 박수 유도 후 착석 안내
- 신랑측은 아버지의 어깨, 가장으로서의 각오 등 남성적 감성

### 내빈께 인사 (최소 8~10문장)
- 단상 가운데로 이동 안내
- 정면 바라보기 안내
- 하객에 대한 감사 인사 (바쁜 시간 내주심에 감사)
- "행복하게 잘 살겠습니다" 류의 다짐
- "신랑신부 하객여러분께 인사" 큐

### 개식선언/폐식선언 (각 최소 5~8문장)
### 기타 식순 (최소 5문장 이상)
- 화촉점화, 축가, 주례, 성혼선언 등 모든 식순에 동일한 밀도 적용

## 대본 포맷 규칙

1. **톤 지시어**: (부드럽게), (밝은 톤으로), (감성적으로), (또박또박) 등을 적절히 삽입
2. **BGM 큐**: 음악 시작/변경/종료 시점에 (BGM), (BGM 변경), (BGM 페이드아웃) 표기
3. **동작 큐**: 행동 지시는 따옴표로 감싸기. 예: "신랑신부, 부모님께 인사"
4. **이동 표시**: 신랑신부 이동 시 (이동중), (이동 끝) 상태 표시
5. **실시간 묘사**: 입장/이동 장면은 현재진행형으로 묘사
6. **하객 참여**: 매 순서마다 박수, 환호, 시선 안내 등 하객 참여 멘트 포함
7. **마크다운**: ## 로 식순 구분, *예상 소요시간: N분* 표시

## 출력 형식
# 결혼식 사회 대본
**일시**: {날짜} | **장소**: {장소}
**신랑**: {신랑} | **신부**: {신부}

---

## 1. {식순항목}
*예상 소요시간: N분*

(톤 지시어) 사회자 멘트...
(BGM) 큐...

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
      const notes = step.notes ? ` - 비고: ${step.notes}` : "";
      return `${i + 1}. ${step.name}${notes}`;
    })
    .join("\n");

  let sampleSection = "";
  if (sampleScripts && sampleScripts.length > 0) {
    const samples = sampleScripts
      .map((script, i) => `--- 샘플 ${i + 1} ---\n${script}`)
      .join("\n\n");
    sampleSection = `\n## 참고 대본 샘플 (스타일 및 분량 학습용)
아래 실제 대본의 톤, 말투, 분량, 큐 표기 스타일을 반드시 참고하세요.
특히 각 식순별 문장 수와 감성 밀도를 비슷하게 맞춰주세요.

${samples}`;
  }

  return `## 기본 정보
- 신랑: ${groomName}
- 신부: ${brideName}
- 일시: ${weddingDate}
- 장소: ${venue || "미정"}

## 식순 (진행 순서)
${stepsText}

## 특이사항
${specialNotes || "없음"}

## 참고 템플릿
${templateContent}
${sampleSection}

## 중요 지시사항
1. 위 식순 순서를 정확히 따라 대본을 작성하세요
2. 각 식순마다 시스템 프롬프트에 명시된 최소 문장 수를 반드시 지키세요
3. 입장 식순에는 반드시 (BGM) 큐와 실시간 동선 묘사를 포함하세요
4. 특이사항에 언급된 곡명, 담당자, 진행방식을 반드시 반영하세요
5. 사회자가 마이크를 잡고 실제로 말하는 모든 문장을 빠짐없이 적으세요
6. (부드럽게), (밝은 톤으로) 같은 톤 지시어를 적절히 삽입하세요`;
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
    max_tokens: 8192,
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
