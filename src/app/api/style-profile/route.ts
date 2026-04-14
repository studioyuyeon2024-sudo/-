import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

const anthropic = new Anthropic();

const EXTRACT_PROMPT = `당신은 결혼식 사회 대본 스타일 분석 전문가입니다.
아래에 여러 개의 실제 사회 대본 샘플이 주어집니다.
이 대본들의 공통된 스타일 특성을 분석하여 "스타일 프로필"을 작성하세요.

## 분석 항목 (식순별로 분리하여 작성)

각 식순에 대해 아래 내용을 포함하세요:

1. **톤/말투**: 격식 수준, 유머 정도, 감성 밀도
2. **자주 쓰는 표현**: 특징적인 관용구, 인사말, 전환 멘트 (실제 예시 인용)
3. **큐 표기 스타일**: (BGM), [음악], (부드럽게) 등 어떤 형태를 사용하는지
4. **문장 패턴**: 평균 문장 길이, 호흡, 반복 구조
5. **동선/행동 지시 방식**: 이동 안내, 박수 유도, 하객 시선 안내 방식
6. **감성 포인트**: 어느 순간에 감성을 높이고, 어느 순간에 절제하는지

## 출력 형식

아래 형식으로 작성하세요. 식순명은 샘플에서 발견된 식순을 모두 포함하세요.

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
(식순 간 전환 시 사용하는 브릿지 멘트 패턴 2~3가지)`;

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

  const samplesText = sampleContents
    .map((content, i) => `=== 샘플 ${i + 1} ===\n${content}`)
    .join("\n\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
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
          content: `아래 ${sampleContents.length}개의 실제 결혼식 사회 대본을 분석하여 스타일 프로필을 작성해 주세요.\n\n${samplesText}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "프로필 생성 실패" }, { status: 500 });
    }

    const profile = content.text.trim();

    // 기존 프로필 삭제 후 새로 저장
    await supabase.from("style_profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const { data, error } = await supabase
      .from("style_profiles")
      .insert({
        profile,
        sample_count: sampleContents.length,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: `프로필 추출 중 오류: ${message}` }, { status: 500 });
  }
}
