import { NextRequest, NextResponse } from "next/server";
import { streamGenerateScript } from "@/lib/anthropic";
import { getTemplateById } from "@/lib/templates";
import { GenerateRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    const { ceremonyOrder, specialNotes, templateId, customTemplate, sampleScripts, groomName, brideName, weddingDate, venue } = body;

    if (!ceremonyOrder?.length || !groomName || !brideName || !weddingDate) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해 주세요 (식순, 신랑, 신부, 날짜)" },
        { status: 400 }
      );
    }

    let templateContent = "";
    if (customTemplate) {
      templateContent = customTemplate;
    } else {
      const template = getTemplateById(templateId || "standard");
      templateContent = template?.content || "";
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamGenerateScript(
            ceremonyOrder,
            specialNotes,
            templateContent,
            groomName,
            brideName,
            weddingDate,
            venue,
            sampleScripts
          )) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "대본 생성 중 오류가 발생했습니다";
          controller.enqueue(encoder.encode(`\n\n---\n\n**오류 발생**: ${message}`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "요청 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
