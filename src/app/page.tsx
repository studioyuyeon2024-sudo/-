"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import CeremonyOrderInput from "@/components/CeremonyOrderInput";
import SpecialNotesInput from "@/components/SpecialNotesInput";
import TemplateSelector from "@/components/TemplateSelector";
import ScriptDisplay from "@/components/ScriptDisplay";
import PdfDownloadButton from "@/components/PdfDownloadButton";
import PdfUploadInput from "@/components/PdfUploadInput";
import SampleScriptUpload from "@/components/SampleScriptUpload";
import StepScriptSelector from "@/components/StepScriptSelector";
import ScriptArchive from "@/components/ScriptArchive";
import { CeremonyStep, SampleScript, ArchivedScript, TemplateMetadata } from "@/lib/types";

type ViewMode = "input" | "compose" | "preview" | "archive";

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
  const [stepContents, setStepContents] = useState<Record<string, string>>({});
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("input");
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/templates").then((res) => {
        if (!res.ok) throw new Error("템플릿");
        return res.json();
      }),
      fetch("/api/samples").then((res) => {
        if (!res.ok) throw new Error("샘플");
        return res.json();
      }),
    ])
      .then(([templatesData, samplesData]) => {
        setTemplates(templatesData);
        if (Array.isArray(samplesData)) {
          setSampleScripts(
            samplesData.map((d: { id: string; name: string; content: string }) => ({
              id: d.id,
              name: d.name,
              content: d.content,
            }))
          );
        }
      })
      .catch((err) => {
        setLoadError(`초기 데이터 로드 실패: ${err.message}. 페이지를 새로고침 해주세요.`);
      });
  }, []);

  const variables = { groomName, brideName, weddingDate, venue };

  const handleStepContentChange = useCallback((stepName: string, content: string) => {
    setStepContents((prev) => ({ ...prev, [stepName]: content }));
  }, []);

  // 식순 조합 → 대본 미리보기
  const handleCompose = () => {
    const missing: string[] = [];
    if (!groomName) missing.push("신랑 이름");
    if (!brideName) missing.push("신부 이름");
    if (ceremonyOrder.length === 0) missing.push("식순");

    if (missing.length > 0) {
      setFormError(`다음 항목을 입력해 주세요: ${missing.join(", ")}`);
      return;
    }
    setFormError("");
    setViewMode("compose");
  };

  // 조합된 대본을 하나로 합치기
  const buildFullScript = () => {
    let result = `# 결혼식 사회 대본\n**일시**: ${weddingDate} | **장소**: ${venue || "미정"}\n**신랑**: ${groomName} | **신부**: ${brideName}\n\n---\n\n`;

    for (const step of ceremonyOrder) {
      const content = stepContents[step.name] || "(대본 미선택)";
      result += `## ${step.name}\n\n${content}\n\n---\n\n`;
    }

    return result.trim();
  };

  // 대본 완성 및 저장
  const handleFinalize = async () => {
    const fullScript = buildFullScript();
    setScript(fullScript);
    setViewMode("preview");

    // DB에 저장
    try {
      await fetch("/api/scripts", {
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
          script: fullScript,
        }),
      });
    } catch {
      // 저장 실패해도 대본은 보여줌
    }
  };

  // AI 생성 (기존 방식, 선택적)
  const handleAiGenerate = async () => {
    const missing: string[] = [];
    if (!groomName) missing.push("신랑 이름");
    if (!brideName) missing.push("신부 이름");
    if (!weddingDate) missing.push("날짜");
    if (ceremonyOrder.length === 0) missing.push("식순");

    if (missing.length > 0) {
      setFormError(`다음 항목을 입력해 주세요: ${missing.join(", ")}`);
      return;
    }

    setFormError("");
    setIsGenerating(true);
    setScript("");
    setViewMode("preview");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ceremonyOrder,
          specialNotes,
          templateId,
          groomName,
          brideName,
          weddingDate,
          venue,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setFormError(err.error || "대본 생성 중 오류가 발생했습니다.");
        setIsGenerating(false);
        setViewMode("input");
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
      setFormError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
      setViewMode("input");
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

  const handleLoadArchive = (archived: ArchivedScript) => {
    setGroomName(archived.groom_name);
    setBrideName(archived.bride_name);
    setWeddingDate(archived.wedding_date || "");
    setVenue(archived.venue || "");
    if (archived.ceremony_order) {
      setCeremonyOrder(archived.ceremony_order);
    }
    setScript(archived.script);
    setViewMode("preview");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 로드 에러 */}
        {loadError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" aria-live="polite">
            {loadError}
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-1.5 max-w-lg">
          {[
            { key: "input" as ViewMode, label: "대본 작성" },
            ...(ceremonyOrder.length > 0 ? [{ key: "compose" as ViewMode, label: "식순 조합" }] : []),
            ...(script ? [{ key: "preview" as ViewMode, label: "대본 보기" }] : []),
            { key: "archive" as ViewMode, label: "아카이브" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === tab.key
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* === 대본 작성 탭 === */}
        {viewMode === "input" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
                <h2 className="text-lg font-bold text-gray-800">기본 정보</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="groomName" className="block text-sm font-semibold text-gray-700 mb-1">신랑 이름 *</label>
                    <input id="groomName" type="text" value={groomName} onChange={(e) => setGroomName(e.target.value)} placeholder="홍길동" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none" />
                  </div>
                  <div>
                    <label htmlFor="brideName" className="block text-sm font-semibold text-gray-700 mb-1">신부 이름 *</label>
                    <input id="brideName" type="text" value={brideName} onChange={(e) => setBrideName(e.target.value)} placeholder="김영희" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="weddingDate" className="block text-sm font-semibold text-gray-700 mb-1">결혼식 날짜</label>
                    <input id="weddingDate" type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none" />
                  </div>
                  <div>
                    <label htmlFor="venue" className="block text-sm font-semibold text-gray-700 mb-1">장소</label>
                    <input id="venue" type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="JW 메리어트 호텔" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <PdfUploadInput
                  onStepsExtracted={(steps) => setCeremonyOrder(steps)}
                  onInfoExtracted={(info) => {
                    if (info.groomName) setGroomName(info.groomName);
                    if (info.brideName) setBrideName(info.brideName);
                    if (info.weddingDate) {
                      const dateMatch = info.weddingDate.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
                      if (dateMatch) {
                        const [, y, m, d] = dateMatch;
                        setWeddingDate(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
                      } else {
                        setWeddingDate(info.weddingDate);
                      }
                    }
                    if (info.venue) setVenue(info.venue);
                  }}
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <TemplateSelector templates={templates} selectedId={templateId} onChange={loadDefaultSteps} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <CeremonyOrderInput steps={ceremonyOrder} onChange={setCeremonyOrder} />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <SampleScriptUpload samples={sampleScripts} onChange={setSampleScripts} />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <SpecialNotesInput value={specialNotes} onChange={setSpecialNotes} />
              </div>

              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" aria-live="polite">
                  {formError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCompose}
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors shadow-sm"
                >
                  식순별 대본 조합
                </button>
                <button
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isGenerating ? "생성 중..." : "AI 생성"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === 식순 조합 탭 === */}
        {viewMode === "compose" && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setViewMode("input")}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                입력으로 돌아가기
              </button>
              <button
                onClick={handleFinalize}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 shadow-sm"
              >
                대본 완성 및 저장
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-rose-700">
                <strong>{groomName}</strong> ♥ <strong>{brideName}</strong>
                {weddingDate && <span className="ml-2">| {weddingDate}</span>}
                {venue && <span className="ml-2">| {venue}</span>}
              </p>
              <p className="text-xs text-rose-500 mt-1">
                각 식순마다 좌우 화살표로 대본을 선택하세요. &quot;직접 편집&quot;으로 수정도 가능합니다.
              </p>
            </div>

            <div className="space-y-4">
              {ceremonyOrder.map((step, i) => (
                <StepScriptSelector
                  key={step.id}
                  stepName={step.name}
                  stepIndex={i}
                  variables={variables}
                  onContentChange={(content) => handleStepContentChange(step.name, content)}
                />
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleFinalize}
                className="px-8 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-sm"
              >
                대본 완성 및 저장
              </button>
            </div>
          </div>
        )}

        {/* === 대본 보기 탭 === */}
        {viewMode === "preview" && (
          <div className="max-w-4xl mx-auto">
            {!isGenerating && script && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("input")}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    입력으로
                  </button>
                  <button
                    onClick={() => setViewMode("compose")}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    조합으로
                  </button>
                </div>
                <PdfDownloadButton script={script} groomName={groomName} brideName={brideName} weddingDate={weddingDate} disabled={isGenerating} />
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <ScriptDisplay script={script} isGenerating={isGenerating} onScriptChange={setScript} />
            </div>
          </div>
        )}

        {/* === 아카이브 탭 === */}
        {viewMode === "archive" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4">저장된 대본</h2>
            <ScriptArchive onLoadScript={handleLoadArchive} />
          </div>
        )}
      </main>
    </div>
  );
}
