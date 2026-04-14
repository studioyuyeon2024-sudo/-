import { NextRequest, NextResponse } from "next/server";
import { getTemplates, parseTemplateSteps } from "@/lib/templates";
import { supabase } from "@/lib/supabase";
import { StepOption } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stepName = searchParams.get("stepName");

  if (!stepName) {
    return NextResponse.json({ error: "stepName이 필요합니다" }, { status: 400 });
  }

  const options: StepOption[] = [];

  // 1. 템플릿에서 해당 식순 수집
  const templates = getTemplates();
  for (const template of templates) {
    const steps = parseTemplateSteps(template.content);
    // 정확한 매칭 또는 포함 매칭
    const matchedKey = Object.keys(steps).find(
      (key) => key === stepName || key.includes(stepName) || stepName.includes(key)
    );
    if (matchedKey && steps[matchedKey]) {
      options.push({
        source: `template:${template.id}`,
        sourceName: template.name,
        content: steps[matchedKey],
      });
    }
  }

  // 2. DB generated_scripts에서 해당 식순 수집
  const { data: scripts } = await supabase
    .from("generated_scripts")
    .select("id, groom_name, bride_name, wedding_date, venue, script, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (scripts) {
    for (const script of scripts) {
      const steps = parseScriptSteps(script.script);
      const matchedKey = Object.keys(steps).find(
        (key) => key === stepName || key.includes(stepName) || stepName.includes(key)
      );
      if (matchedKey && steps[matchedKey]) {
        const date = script.wedding_date || script.created_at?.slice(0, 10) || "";
        options.push({
          source: `archive:${script.id}`,
          sourceName: `${date} ${script.groom_name}♥${script.bride_name}`,
          content: steps[matchedKey],
        });
      }
    }
  }

  // 3. 샘플 스크립트에서도 수집
  const { data: samples } = await supabase
    .from("sample_scripts")
    .select("id, name, content")
    .order("created_at", { ascending: false })
    .limit(30);

  if (samples) {
    for (const sample of samples) {
      const steps = parseScriptSteps(sample.content);
      const matchedKey = Object.keys(steps).find(
        (key) => key === stepName || key.includes(stepName) || stepName.includes(key)
      );
      if (matchedKey && steps[matchedKey]) {
        options.push({
          source: `sample:${sample.id}`,
          sourceName: `샘플: ${sample.name}`,
          content: steps[matchedKey],
        });
      }
    }
  }

  return NextResponse.json(options);
}

function parseScriptSteps(script: string): Record<string, string> {
  const steps: Record<string, string> = {};
  const lines = script.split("\n");
  let currentStep = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(?:\d+\.\s*)?(.+)/);
    if (headerMatch) {
      if (currentStep && currentContent.length > 0) {
        steps[currentStep] = currentContent.join("\n").trim();
      }
      currentStep = headerMatch[1].trim();
      currentContent = [];
    } else if (currentStep) {
      if (!line.match(/^---+$/)) {
        currentContent.push(line);
      }
    }
  }

  if (currentStep && currentContent.length > 0) {
    steps[currentStep] = currentContent.join("\n").trim();
  }

  return steps;
}
