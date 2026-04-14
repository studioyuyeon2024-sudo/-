"use client";

import { useState, useEffect, useCallback } from "react";
import { StepTemplate } from "@/lib/types";

const COMMON_STEPS = [
  "개식선언", "신랑입장", "신부입장", "신부 인도", "혼인서약",
  "성혼선언", "주례사", "축가", "양가 부모님께 인사", "내빈께 인사",
  "화촉점화", "폐식선언", "축사", "성혼 선서",
];

export default function StepTemplateManager() {
  const [templates, setTemplates] = useState<StepTemplate[]>([]);
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

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/step-templates");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setTemplates(data);
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // 식순별 그룹핑
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
      setAddStepName("");
      setAddLabel("");
      setAddContent("");
      setCustomStepName("");
      setIsAdding(false);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">식순별 대본 관리</h2>
          <p className="text-sm text-gray-500 mt-1">각 식순에 여러 버전의 대본을 저장하고 조합할 때 선택할 수 있습니다</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          대본 추가
        </button>
      </div>

      {/* 새 대본 추가 폼 */}
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

      {/* 로딩 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <span className="w-5 h-5 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin mr-3" />
          불러오는 중...
        </div>
      ) : stepNames.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">아직 등록된 대본이 없습니다</p>
          <p className="text-gray-400 text-xs mt-1">&quot;대본 추가&quot; 버튼을 눌러 식순별 대본을 등록하세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stepNames.map((stepName) => {
            const items = stepGroups[stepName];
            const isOpen = selectedStep === stepName;

            return (
              <div key={stepName} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                {/* 식순 헤더 */}
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

                {/* 버전 목록 */}
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
