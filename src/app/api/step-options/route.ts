import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { StepOption } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stepName = searchParams.get("stepName");

  if (!stepName) {
    return NextResponse.json({ error: "stepName이 필요합니다" }, { status: 400 });
  }

  const options: StepOption[] = [];

  // step_templates에서 정확한 매칭
  const { data: templates } = await supabase
    .from("step_templates")
    .select("id, step_name, label, content")
    .eq("step_name", stepName)
    .order("created_at", { ascending: false });

  if (templates) {
    for (const t of templates) {
      options.push({
        source: `step-template:${t.id}`,
        sourceName: t.label || t.step_name,
        content: t.content,
      });
    }
  }

  return NextResponse.json(options);
}
