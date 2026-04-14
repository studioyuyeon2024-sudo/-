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
import { CeremonyStep, SampleScript, StyleProfile, TemplateMetadata } from "@/lib/types";

type ViewMode = "input" | "script";

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
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [isExtractingProfile, setIsExtractingProfile] = useState(false);
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
      fetch("/api/style-profile").then((res) => {
        if (!res.ok) return null;
        return res.json();
      }),
    ])
      .then(([templatesData, samplesData, profileData]) => {
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
        if (profileData) {
          setStyleProfile(profileData);
        }
      })
      .catch((err) => {
        setLoadError(`초기 데이터 로드 실패: ${err.message}. 페이지를 새로고침 해주세요.`);
      });
  }, []);

  const extractStyleProfile = async () => {
    if (sampleScripts.length === 0) return;
    setIsExtractingProfile(true);
    setFormError("");
    try {
      const res = await fetch("/api/style-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sampleContents: sampleScripts.map((s) => s.content),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStyleProfile(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || "스타일 프로필 추출 실패");
      }
    } catch {
      setFormError("스타일 프로필 추출 중 네트워크 오류");
    } finally {
      setIsExtractingProfile(false);
    }
  };

  const handleGenerate = async () => {
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
    setViewMode("script");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ceremonyOrder,
          specialNotes,
          templateId,
          styleProfile: styleProfile?.profile || undefined,
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

        {/* 탭 네비게이션 - 대본이 있을 때만 표시 */}
        {script && (
          <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-1.5 max-w-md">
            <button
              onClick={() => setViewMode("input")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === "input"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              입력 정보
            </button>
            <button
              onClick={() => setViewMode("script")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === "script"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              대본 보기
            </button>
          </div>
        )}

        {/* 입력 폼 뷰 */}
        {viewMode === "input" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
                <h2 className="text-lg font-bold text-gray-800">기본 정보</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="groomName" className="block text-sm font-semibold text-gray-700 mb-1">
                      신랑 이름 *
                    </label>
                    <input
                      id="groomName"
                      type="text"
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      placeholder="홍길동"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="brideName" className="block text-sm font-semibold text-gray-700 mb-1">
                      신부 이름 *
                    </label>
                    <input
                      id="brideName"
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
                    <label htmlFor="weddingDate" className="block text-sm font-semibold text-gray-700 mb-1">
                      결혼식 날짜 *
                    </label>
                    <input
                      id="weddingDate"
                      type="date"
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="venue" className="block text-sm font-semibold text-gray-700 mb-1">
                      장소
                    </label>
                    <input
                      id="venue"
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
                <TemplateSelector
                  templates={templates}
                  selectedId={templateId}
                  onChange={loadDefaultSteps}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <CeremonyOrderInput
                  steps={ceremonyOrder}
                  onChange={setCeremonyOrder}
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <SampleScriptUpload
                  samples={sampleScripts}
                  onChange={(newSamples) => {
                    setSampleScripts(newSamples);
                    // 샘플이 변경되면 프로필이 stale함을 표시
                    if (styleProfile && newSamples.length !== styleProfile.sample_count) {
                      setStyleProfile({ ...styleProfile, sample_count: -1 });
                    }
                  }}
                />

                {/* 스타일 프로필 상태 */}
                {sampleScripts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {styleProfile && styleProfile.sample_count !== -1 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-600 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                          스타일 프로필 적용 중 ({styleProfile.sample_count}개 샘플 기반)
                        </span>
                        <button
                          type="button"
                          onClick={extractStyleProfile}
                          disabled={isExtractingProfile}
                          className="text-xs text-gray-500 hover:text-violet-600 transition-colors"
                        >
                          재분석
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={extractStyleProfile}
                        disabled={isExtractingProfile}
                        className="w-full px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg text-sm text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isExtractingProfile ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                            스타일 분석 중...
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {styleProfile?.sample_count === -1
                              ? "샘플 변경됨 - 스타일 재분석"
                              : `${sampleScripts.length}개 샘플에서 스타일 추출`}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <SpecialNotesInput
                  value={specialNotes}
                  onChange={setSpecialNotes}
                />
              </div>

              {/* 폼 에러 메시지 */}
              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" aria-live="polite">
                  {formError}
                </div>
              )}

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
                    onClick={() => setViewMode("script")}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    대본 보기
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 대본 전체화면 뷰 */}
        {viewMode === "script" && (
          <div className="max-w-4xl mx-auto">
            {/* 상단 액션 바 */}
            {!isGenerating && script && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("input")}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    입력으로 돌아가기
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    다시 생성
                  </button>
                </div>
                <PdfDownloadButton
                  script={script}
                  groomName={groomName}
                  brideName={brideName}
                  weddingDate={weddingDate}
                  disabled={isGenerating}
                />
              </div>
            )}

            {/* 대본 내용 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <ScriptDisplay
                script={script}
                isGenerating={isGenerating}
                onScriptChange={setScript}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
