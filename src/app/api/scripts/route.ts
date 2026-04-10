import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("generated_scripts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    groomName,
    brideName,
    weddingDate,
    venue,
    ceremonyOrder,
    specialNotes,
    templateId,
    script,
  } = body;

  if (!groomName || !brideName || !script) {
    return NextResponse.json(
      { error: "필수 항목이 누락되었습니다" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("generated_scripts")
    .insert({
      groom_name: groomName,
      bride_name: brideName,
      wedding_date: weddingDate || "",
      venue: venue || "",
      ceremony_order: ceremonyOrder,
      special_notes: specialNotes || "",
      template_id: templateId || "",
      script,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
