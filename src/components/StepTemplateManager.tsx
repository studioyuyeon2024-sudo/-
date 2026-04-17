"use client";

import { useState, useEffect, useCallback } from "react";
import { StepTemplate, SampleScript } from "@/lib/types";

const COMMON_STEPS = [
  "개식선언", "신랑입장", "신부입장", "신부 인도", "혼인서약",
  "성혼선언", "주례사", "축가", "양가 부모님께 인사", "내빈께 인사",
  "화촉점화", "폐식선언", "축사", "성혼 선서",
];

export default function StepTemplateManager() {
  const [templates, setTemplates] = useState<StepTemplate[]>([]);
  const [samples, setSamples] = useState<SampleScript[]>([]);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addStepName, setAddStepName] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addContent, setAddContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [customStepName, setCustomStepName] = useState("");

  // 샘플 매핑 모드
  const [mappingMode, setMappingMode] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [mapStepName, setMapStepName] = useState("");
  const [mapLabel, setMapLabel] = useState("");
  const [mapCustomStep, setMapCustomStep] = useState("");
  const [sampleGroomName, setSampleGroomName] = useState("");
  const [sampleBrideName, setSampleBrideName] = useState("");
  const [sampleVenue, setSampleVenue] = useState("");

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch("/api/step-templates"),
        fetch("/api/samples"),
      ]);
      if (tRes.ok) {
        const data = await tRes.json();
        if (Array.isArray(data)) setTemplates(data);
      }
      if (sRes.ok) {
        const data = await sRes.json();
        if (Array.isArray(data)) setSamples(data);
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const stepGroups = templates.reduce<Record<string, StepTemplate[]>>((acc, t) => {
    if (!acc[t.step_name]) acc[t.step_name] = [];
    acc[t.step_name].push(t);
    return acc;
  }, {});

  const stepNames = Object.keys(stepGroups);

  const handleAdd = async () => {
    const stepName = addStepName === "__custom__" ? customStepName.trim() : addStepName;
    if (!stepName || !addContent.trim()) return;

    const res = await fetch("/api/step-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stepName,
        label: addLabel.trim() || `${stepName} 버전`,
        content: addContent.trim(),
      }),
    });

    if (res.ok) {
      setAddStepName(""); setAddLabel(""); setAddContent(""); setCustomStepName("");
      setIsAdding(false);
      loadTemplates();
    }
  };

  const handleMapSave = async () => {
    const stepName = mapStepName === "__custom__" ? mapCustomStep.trim() : mapStepName;
    if (!stepName || !selectedText.trim()) return;

    // 이름/장소를 변수로 치환
    let content = selectedText.trim();
    if (sampleGroomName.trim()) {
      const escaped = sampleGroomName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      content = content.replace(new RegExp(escaped, "g"), "{{groomName}}");
    }
    if (sampleBrideName.trim()) {
      const escaped = sampleBrideName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      content = content.replace(new RegExp(escaped, "g"), "{{brideName}}");
    }
    if (sampleVenue.trim()) {
      const escaped = sampleVenue.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      content = content.replace(new RegExp(escaped, "g"), "{{venue}}");
    }

    const sample = samples.find((s) => s.id === selectedSampleId);
    const res = await fetch("/api/step-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stepName,
        label: mapLabel.trim() || `${sample?.name || "샘플"} - ${stepName}`,
        content,
      }),
    });

    if (res.ok) {
      setSelectedText(""); setMapStepName(""); setMapLabel(""); setMapCustomStep("");
      loadTemplates();
    }
  };

  const handleUpdate = async (id: string) => {
    await fetch("/api/step-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, label: editLabel, content: editContent }),
    });
    setEditingId(null);
    loadTemplates();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/step-templates?id=${id}`, { method: "DELETE" });
    loadTemplates();
  };

  const selectedSample = samples.find((s) => s.id === selectedSampleId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">식순별 대본 관리</h2>
          <p className="text-sm text-gray-500 mt-1">각 식순에 여러 버전의 대본을 저장하고 조합할 때 선택할 수 있습니다</p>
        </div>
        <div className="flex gap-2">
          {samples.length > 0 && (
            <button
              onClick={() => { setMappingMode(!mappingMode); setIsAdding(false); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 ${
                mappingMode
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              샘플에서 매핑
            </button>
          )}
          <button
            onClick={() => { setIsAdding(!isAdding); setMappingMode(false); }}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            직접 추가
          </button>
        </div>
      </div>

      {/* === 샘플 매핑 모드 === */}
      {mappingMode && (
        <div className="mb-6 border border-violet-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-3 border-b border-violet-200">
            <h3 className="text-sm font-bold text-violet-900">샘플에서 식순 매핑</h3>
            <p className="text-xs text-violet-600 mt-0.5">샘플을 선택 → 해당 부분을 드래그/선택 → 식순 지정 → 저장</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-violet-100">
            {/* 왼쪽: 샘플 목록/내용 */}
            <div className="p-4">
              {!selectedSampleId ? (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-3">샘플 선택 ({samples.length}개)</p>
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {samples.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => setSelectedSampleId(sample.id)}
                        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-sm"
                      >
                        <span className="font-medium text-gray-800">{sample.name}</span>
                        <span className="block text-xs text-gray-400 mt-0.5 truncate">{sample.content.slice(0, 80)}...</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => { setSelectedSampleId(null); setSelectedText(""); setSampleGroomName(""); setSampleBrideName(""); setSampleVenue(""); }}
                      className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      다른 샘플
                    </button>
                    <span className="text-xs font-medium text-gray-600">{selectedSample?.name}</span>
                  </div>

                  {/* 이 샘플의 실제 이름 입력 (치환용) */}
                  <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-amber-800 mb-2">
                      이 샘플에 등장하는 실제 이름/장소 (저장 시 자동으로 변수로 치환됩니다)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={sampleGroomName}
                        onChange={(e) => setSampleGroomName(e.target.value)}
                        placeholder="신랑 이름 (예: 김철수)"
                        className="px-2.5 py-1.5 text-xs border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-300 outline-none bg-white"
                      />
                      <input
                        type="text"
                        value={sampleBrideName}
                        onChange={(e) => setSampleBrideName(e.target.value)}
                        placeholder="신부 이름 (예: 이영희)"
                        className="px-2.5 py-1.5 text-xs border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-300 outline-none bg-white"
                      />
                      <input
                        type="text"
                        value={sampleVenue}
                        onChange={(e) => setSampleVenue(e.target.value)}
                        placeholder="장소 (선택)"
                        className="px-2.5 py-1.5 text-xs border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-300 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-violet-500 mb-2 bg-violet-50 px-3 py-1.5 rounded-lg">
                    아래 대본에서 원하는 부분을 마우스로 드래그하여 선택하세요
                  </p>
                  <div
                    className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-50 rounded-xl p-4 border border-gray-200 select-text cursor-text"
                    onMouseUp={() => {
                      const selection = window.getSelection()?.toString();
                      if (selection && selection.trim()) {
                        setSelectedText(selection.trim());
                      }
                    }}
                  >
                    {selectedSample?.content}
                  </div>
                </div>
              )}
            </div>

            {/* 오른쪽: 선택된 텍스트 + 식순 매핑 */}
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">
                {selectedText ? "선택된 텍스트 → 식순에 저장" : "왼쪽에서 텍스트를 선택하세요"}
              </p>

              {selectedText ? (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                    <p className="text-xs text-amber-800 whitespace-pre-wrap leading-relaxed">{selectedText.slice(0, 500)}{selectedText.length > 500 ? "..." : ""}</p>
                  </div>

                  {/* 치환 미리보기 */}
                  {(sampleGroomName.trim() || sampleBrideName.trim() || sampleVenue.trim()) && (() => {
                    let preview = selectedText.slice(0, 500);
                    if (sampleGroomName.trim()) {
                      const esc = sampleGroomName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                      preview = preview.replace(new RegExp(esc, "g"), "{{groomName}}");
                    }
                    if (sampleBrideName.trim()) {
                      const esc = sampleBrideName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                      preview = preview.replace(new RegExp(esc, "g"), "{{brideName}}");
                    }
                    if (sampleVenue.trim()) {
                      const esc = sampleVenue.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                      preview = preview.replace(new RegExp(esc, "g"), "{{venue}}");
                    }
                    return (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                        <p className="text-[10px] font-semibold text-green-700 mb-1">저장될 내용 (미리보기)</p>
                        <p className="text-xs text-green-900 whitespace-pre-wrap leading-relaxed">{preview}{selectedText.length > 500 ? "..." : ""}</p>
                      </div>
                    );
                  })()}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">이 텍스트가 속하는 식순</label>
                    <select
                      value={mapStepName}
                      onChange={(e) => setMapStepName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 outline-none bg-white"
                    >
                      <option value="">식순 선택</option>
                      {COMMON_STEPS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="__custom__">직접 입력...</option>
                    </select>
                    {mapStepName === "__custom__" && (
                      <input
                        type="text"
                        value={mapCustomStep}
                        onChange={(e) => setMapCustomStep(e.target.value)}
                        placeholder="식순명 입력"
                        className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">버전 이름 (선택)</label>
                    <input
                      type="text"
                      value={mapLabel}
                      onChange={(e) => setMapLabel(e.target.value)}
                      placeholder="예: 감성 버전"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedText("")}
                      className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
                    >
                      선택 해제
                    </button>
                    <button
                      onClick={handleMapSave}
                      disabled={!(mapStepName === "__custom__" ? mapCustomStep.trim() : mapStepName)}
                      className="flex-1 px-3 py-2 text-sm text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-40 font-semibold"
                    >
                      식순에 저장
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-300">
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <p className="text-xs">텍스트를 드래그하면<br />여기서 매핑할 수 있습니다</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === 직접 추가 폼 === */}
      {isAdding && (
        <div className="mb-6 bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-rose-900 mb-4">새 대본 추가</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">식순 선택</label>
              <select
                value={addStepName}
                onChange={(e) => setAddStepName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none bg-white"
              >
                <option value="">식순을 선택하세요</option>
                {COMMON_STEPS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="__custom__">직접 입력...</option>
              </select>
              {addStepName === "__custom__" && (
                <input
                  type="text"
                  value={customStepName}
                  onChange={(e) => setCustomStepName(e.target.value)}
                  placeholder="식순명 직접 입력"
                  className="mt-2 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-300 outline-none"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">버전 이름 (선택)</label>
              <input
                type="text"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="예: 감성 버전, 교회식 버전"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-300 outline-none"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">대본 내용</label>
            <textarea
              value={addContent}
              onChange={(e) => setAddContent(e.target.value)}
              placeholder="실제 사회 대본을 여기에 붙여넣으세요..."
              className="w-full min-h-[200px] px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-300 outline-none font-mono leading-relaxed resize-y"
              rows={10}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setIsAdding(false); setAddContent(""); setAddStepName(""); }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleAdd}
              disabled={!(addStepName === "__custom__" ? customStepName.trim() : addStepName) || !addContent.trim()}
              className="px-5 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-40 transition-all"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* === 등록된 대본 목록 === */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <span className="w-5 h-5 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin mr-3" />
          불러오는 중...
        </div>
      ) : stepNames.length === 0 && !mappingMode && !isAdding ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">아직 등록된 대본이 없습니다</p>
          <p className="text-gray-400 text-xs mt-1">
            {samples.length > 0
              ? "\"샘플에서 매핑\" 버튼으로 기존 샘플에서 식순을 매핑하세요"
              : "\"직접 추가\" 버튼을 눌러 식순별 대본을 등록하세요"}
          </p>
        </div>
      ) : stepNames.length > 0 && (
        <div className="space-y-3">
          {stepNames.map((stepName) => {
            const items = stepGroups[stepName];
            const isOpen = selectedStep === stepName;

            return (
              <div key={stepName} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => setSelectedStep(isOpen ? null : stepName)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-xl flex items-center justify-center text-xs font-bold shadow-sm">
                      {items.length}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-sm">{stepName}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{items.length}개 버전</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100">
                    {items.map((item) => (
                      <div key={item.id} className="border-b border-gray-50 last:border-b-0">
                        {editingId === item.id ? (
                          <div className="p-5 bg-amber-50/50">
                            <input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-3 focus:ring-2 focus:ring-amber-300 outline-none"
                              placeholder="버전 이름"
                            />
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full min-h-[160px] px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-300 outline-none leading-relaxed resize-y"
                              rows={8}
                            />
                            <div className="flex justify-end gap-2 mt-3">
                              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
                              <button onClick={() => handleUpdate(item.id)} className="px-4 py-1.5 text-sm text-white bg-amber-600 rounded-lg hover:bg-amber-700">저장</button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-5 hover:bg-gray-50/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => { setEditingId(item.id); setEditContent(item.content); setEditLabel(item.label); }}
                                  className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                                  aria-label="수정"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                  aria-label="삭제"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 leading-relaxed line-clamp-4 whitespace-pre-line bg-gray-50/80 rounded-xl px-4 py-3">
                              {item.content.slice(0, 300)}{item.content.length > 300 ? "..." : ""}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
