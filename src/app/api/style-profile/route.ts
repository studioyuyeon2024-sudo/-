import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { simpleHash } from "@/lib/utils";

const anthropic = new Anthropic();

const MAX_SAMPLES = 50;
const MAX_CONTENT_LENGTH = 50000;

const EXTRACT_PROMPT = `당신은 결혼식 사회 대본 스타일 분석 전문가입니다.
아래에 여러 개의 실제 사회 대본 샘플이 주어집니다.
두 가지를 수행하세요: (1) 스타일 프로필 작성, (2) 골든 예시 추출.

## Part 1: 스타일 프로필

각 식순에 대해 아래 내용을 분석하세요:
1. **톤/말투**: 격식 수준, 유머 정도, 감성 밀도
2. **자주 쓰는 표현**: 특징적인 관용구, 인사말, 전환 멘트 (실제 예시 인용)
3. **큐 표기 스타일**: (BGM), [음악], (부드럽게) 등 어떤 형태를 사용하는지
4. **문장 패턴**: 평균 문장 길이, 호흡, 반복 구조
5. **동선/행동 지시 방식**: 이동 안내, 박수 유도, 하객 시선 안내 방식
6. **감성 포인트**: 어느 순간에 감성을 높이고, 어느 순간에 절제하는지

프로필 출력 형식:

### 전체 스타일 특성
(공통적인 톤, 말투, 분위기 요약 3~5문장)

### [식순명]
- 톤: ...
- 핵심 표현: "...", "..."
- 큐 스타일: ...
- 문장 패턴: ...
- 특이사항: ...

(각 식순 반복)

### 전환 멘트 패턴
(식순 간 전환 시 사용하는 브릿지 멘트 패턴 2~3가지)

## Part 2: 골든 예시 추출

샘플 대본에서 아래 식순의 **가장 잘 쓰인 실제 멘트 5~8줄**을 그대로 발췌하세요.
대상 식순: 신랑입장, 신부입장, 양가인사, 화촉점화, 개식선언, 폐식선언, 축가, 성혼선언
- 샘플에 없는 식순은 생략
- 반드시 원문 그대로 발췌 (요약하거나 수정하지 말 것)
- 톤 지시어, BGM 큐, 동선 지시가 포함된 부분을 우선 선택

스타일 프로필을 먼저 작성한 후, 아래 구분자 다음에 골든 예시를 JSON으로 출력하세요:

---GOLDEN_EXAMPLES_JSON---
{"신부입장": "원문 발췌...", "양가인사": "원문 발췌..."}`;

export async function GET() {
  const { data, error } = await supabase
    .from("style_profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || null);
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }

  const { sampleContents } = body as { sampleContents: string[] };

  if (!sampleContents || sampleContents.length === 0) {
    return NextResponse.json({ error: "샘플 대본이 필요합니다" }, { status: 400 });
  }

  if (sampleContents.length > MAX_SAMPLES) {
    return NextResponse.json({ error: `샘플은 최대 ${MAX_SAMPLES}개까지 가능합니다` }, { status: 400 });
  }

  const validContents = sampleContents.filter(
    (c) => typeof c === "string" && c.length > 0 && c.length <= MAX_CONTENT_LENGTH
  );

  if (validContents.length === 0) {
    return NextResponse.json({ error: "유효한 샘플이 없습니다" }, { status: 400 });
  }

  const sampleHash = simpleHash(validContents.join("|||"));

  const samplesText = validContents
    .map((content, i) => `=== 샘플 ${i + 1} ===\n${content}`)
    .join("\n\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: [
        {
          type: "text",
          text: EXTRACT_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `아래 ${validContents.length}개의 실제 결혼식 사회 대본을 분석하여 스타일 프로필을 작성하고 골든 예시를 추출해 주세요.\n\n${samplesText}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "프로필 생성 실패" }, { status: 500 });
    }

    const fullText = content.text.trim();

    // 프로필과 골든 예시 분리
    const delimiter = "---GOLDEN_EXAMPLES_JSON---";
    const parts = fullText.split(delimiter);
    const profile = parts[0].trim();

    let goldenExamples: Record<string, string> = {};
    if (parts.length > 1) {
      try {
        const jsonStr = parts[1].trim().replace(/```json\n?|```/g, "");
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          goldenExamples = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // JSON 파싱 실패 시 빈 객체로 진행
      }
    }

    const { data, error } = await supabase
      .from("style_profiles")
      .insert({
        profile,
        sample_count: validContents.length,
        sample_hash: sampleHash,
        golden_examples: goldenExamples,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data) {
      await supabase
        .from("style_profiles")
        .delete()
        .neq("id", data.id);
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: `프로필 추출 중 오류: ${message}` }, { status: 500 });
  }
}
