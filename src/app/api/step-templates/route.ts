import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stepName = searchParams.get("stepName");

  let query = supabase
    .from("step_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (stepName) {
    query = query.eq("step_name", stepName);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }

  const { stepName, label, content } = body as {
    stepName: string;
    label: string;
    content: string;
  };

  if (!stepName || !content) {
    return NextResponse.json({ error: "식순명과 내용이 필요합니다" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("step_templates")
    .insert({
      step_name: stepName,
      label: label || `${stepName} 버전`,
      content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }

  const { id, label, content } = body as {
    id: string;
    label?: string;
    content?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (label !== undefined) updates.label = label;
  if (content !== undefined) updates.content = content;

  const { data, error } = await supabase
    .from("step_templates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
  }

  const { error } = await supabase
    .from("step_templates")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
