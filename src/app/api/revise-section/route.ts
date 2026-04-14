import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionTitle, sectionContent, instruction, fullScript } = body as {
      sectionTitle: string;
      sectionContent: string;
      instruction: string;
      fullScript: string;
    };

    if (!sectionTitle || !instruction) {
      return NextResponse.json(
        { error: "식순 제목과 수정 요청 내용이 필요합니다" },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: "결혼식 MC 대본 수정 전문가. 요청된 섹션만 수정. 기존 톤 유지. 마크다운 형식(사회자:, [지시사항]) 유지. 섹션 내용만 출력(제목/소요시간 제외).",
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `다음은 결혼식 대본의 "${sectionTitle}" 섹션입니다:

${sectionContent}

---

수정 요청: ${instruction}

위 요청에 맞게 이 섹션의 내용만 수정해 주세요.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "수정 결과를 생성하지 못했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: content.text.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: `섹션 수정 중 오류: ${message}` },
      { status: 500 }
    );
  }
}
