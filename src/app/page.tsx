"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import CeremonyOrderInput from "@/components/CeremonyOrderInput";
import SpecialNotesInput from "@/components/SpecialNotesInput";
import TemplateSelector from "@/components/TemplateSelector";
import ScriptDisplay from "@/components/ScriptDisplay";
import PdfDownloadButton from "@/components/PdfDownloadButton";
import PdfUploadInput from "@/components/PdfUploadInput";
import SampleScriptUpload from "@/components/SampleScriptUpload";
import { CeremonyStep, SampleScript, TemplateMetadata } from "@/lib/types";

export default function Home() {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [ceremonyOrder, setCeremonyOrder] = useState<CeremonyStep[]>([]);
  const [specialNotes, setSpecialNotes] = useState("");
  const [templateId, setTemplateId] = useState("standard");
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [venue, setVenue] = useState("");
  const [sampleScripts, setSampleScripts] = useState<SampleScript[]>([]);
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => setTemplates(data))
      .catch(() => {});

    // DB에서 저장된 샘플 스크립트 로드
    fetch("/api/samples")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSampleScripts(
            data.map((d: { id: string; name: string; content: string }) => ({
              id: d.id,
              name: d.name,
              content: d.content,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!groomName || !brideName || !weddingDate || ceremonyOrder.length === 0) {
      alert("신랑, 신부 이름, 날짜, 식순을 모두 입력해 주세요.");
      return;
    }

    setIsGenerating(true);
    setScript("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ceremonyOrder,
          specialNotes,
          templateId,
          sampleScripts: sampleScripts.map((s) => s.content),
          groomName,
          brideName,
          weddingDate,
          venue,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "대본 생성 중 오류가 발생했습니다.");
        setIsGenerating(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setIsGenerating(false);
        return;
      }

      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setScript(accumulated);
      }

      // 생성된 대본을 DB에 저장
      if (accumulated) {
        fetch("/api/scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groomName,
            brideName,
            weddingDate,
            venue,
            ceremonyOrder,
            specialNotes,
            templateId,
            script: accumulated,
          }),
        }).catch(() => {});
      }
    } catch {
      alert("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const loadDefaultSteps = (id: string) => {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template && ceremonyOrder.length === 0) {
      const steps: CeremonyStep[] = template.defaultSteps.map((name) => ({
        id: crypto.randomUUID(),
        name,
        notes: "",
      }));
      setCeremonyOrder(steps);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-800">기본 정보</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    신랑 이름 *
                  </label>
                  <input
                    type="text"
                    value={groomName}
                    onChange={(e) => setGroomName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    신부 이름 *
                  </label>
                  <input
                    type="text"
                    value={brideName}
                    onChange={(e) => setBrideName(e.target.value)}
                    placeholder="김영희"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    결혼식 날짜 *
                  </label>
                  <input
                    type="date"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    장소
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="JW 메리어트 호텔"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <PdfUploadInput
                onStepsExtracted={(steps) => setCeremonyOrder(steps)}
                onInfoExtracted={(info) => {
                  if (info.groomName) setGroomName(info.groomName);
                  if (info.brideName) setBrideName(info.brideName);
                  if (info.weddingDate) setWeddingDate(info.weddingDate);
                  if (info.venue) setVenue(info.venue);
                }}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <TemplateSelector
                templates={templates}
                selectedId={templateId}
                onChange={loadDefaultSteps}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <CeremonyOrderInput
                steps={ceremonyOrder}
                onChange={setCeremonyOrder}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <SampleScriptUpload
                samples={sampleScripts}
                onChange={setSampleScripts}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <SpecialNotesInput
                value={specialNotes}
                onChange={setSpecialNotes}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isGenerating ? "생성 중..." : "대본 생성"}
              </button>
              {script && !isGenerating && (
                <button
                  onClick={handleGenerate}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  다시 생성
                </button>
              )}
            </div>
          </div>

          {/* Right: Script Display */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[600px] sticky top-6">
              <ScriptDisplay script={script} isGenerating={isGenerating} />
            </div>

            {script && !isGenerating && (
              <PdfDownloadButton
                script={script}
                groomName={groomName}
                brideName={brideName}
                weddingDate={weddingDate}
                disabled={isGenerating}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
