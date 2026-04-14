"use client";

import { useState, useEffect } from "react";
import { StepOption } from "@/lib/types";

interface Props {
  stepName: string;
  stepIndex: number;
  onContentChange: (content: string) => void;
  variables: { groomName: string; brideName: string; weddingDate: string; venue: string };
}

function applyVariables(text: string, vars: Props["variables"]): string {
  return text
    .replace(/\{\{groomName\}\}/g, vars.groomName || "OOO")
    .replace(/\{\{brideName\}\}/g, vars.brideName || "OOO")
    .replace(/\{\{weddingDate\}\}/g, vars.weddingDate || "")
    .replace(/\{\{venue\}\}/g, vars.venue || "");
}

export default function StepScriptSelector({ stepName, stepIndex, onContentChange, variables }: Props) {
  const [options, setOptions] = useState<StepOption[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/step-options?stepName=${encodeURIComponent(stepName)}`)
      .then((res) => res.json())
      .then((data: StepOption[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setOptions(data);
          setSelectedIdx(0);
          const applied = applyVariables(data[0].content, variables);
          onContentChange(applied);
        } else {
          setOptions([]);
        }
      })
      .catch(() => setOptions([]))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepName]);

  const selectOption = (idx: number) => {
    setSelectedIdx(idx);
    setIsEditing(false);
    const applied = applyVariables(options[idx].content, variables);
    onContentChange(applied);
  };

  const handlePrev = () => {
    if (selectedIdx > 0) selectOption(selectedIdx - 1);
  };

  const handleNext = () => {
    if (selectedIdx < options.length - 1) selectOption(selectedIdx + 1);
  };

  const handleEdit = () => {
    const current = options[selectedIdx];
    setEditText(applyVariables(current.content, variables));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onContentChange(editText);
    setIsEditing(false);
  };

  const currentOption = options[selectedIdx];
  const displayContent = currentOption ? applyVariables(currentOption.content, variables) : "";

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-rose-50 to-rose-100/50 px-4 py-3 border-b border-rose-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            {stepIndex + 1}
          </span>
          <h3 className="font-bold text-rose-900 text-sm">{stepName}</h3>
        </div>
        {options.length > 0 && !isEditing && (
          <button
            onClick={handleEdit}
            className="text-xs text-gray-500 hover:text-rose-600 transition-colors"
          >
            직접 편집
          </button>
        )}
      </div>

      {/* 선택기 */}
      {isLoading ? (
        <div className="px-4 py-8 text-center text-sm text-gray-400">
          <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin mr-2" />
          대본 옵션 불러오는 중...
        </div>
      ) : options.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-gray-400 mb-2">이 식순에 해당하는 대본이 없습니다</p>
          <button
            onClick={() => {
              setEditText("");
              setIsEditing(true);
            }}
            className="text-sm text-rose-600 hover:text-rose-700"
          >
            직접 작성하기
          </button>
        </div>
      ) : isEditing ? (
        <div className="px-4 py-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full min-h-[150px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none font-mono"
            rows={Math.max(6, editText.split("\n").length + 1)}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1.5 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700"
            >
              적용
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 슬라이드 네비게이션 */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
            <button
              onClick={handlePrev}
              disabled={selectedIdx === 0}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
              aria-label="이전 대본"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <span className="text-xs font-medium text-rose-600">{currentOption.sourceName}</span>
              <span className="text-xs text-gray-400 ml-2">
                {selectedIdx + 1} / {options.length}
              </span>
            </div>

            <button
              onClick={handleNext}
              disabled={selectedIdx === options.length - 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
              aria-label="다음 대본"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 대본 미리보기 */}
          <div className="px-4 py-3 text-sm max-h-60 overflow-y-auto">
            {displayContent.split("\n").map((line, i) => {
              if (line.startsWith("사회자:")) {
                return (
                  <p key={i} className="my-1">
                    <span className="font-semibold text-rose-800">사회자:</span>
                    <span className="text-gray-700">{line.slice(4)}</span>
                  </p>
                );
              }
              if (line.match(/^\[.+\]$/) || line.match(/^\(.+\)$/)) {
                return <p key={i} className="my-1 text-blue-600 text-xs italic">{line}</p>;
              }
              if (line.match(/^\*.+\*$/)) {
                return <p key={i} className="my-0.5 text-xs text-gray-400 italic">{line}</p>;
              }
              if (!line.trim()) return <div key={i} className="h-1.5" />;
              return <p key={i} className="my-1 text-gray-700 leading-relaxed">{line}</p>;
            })}
          </div>
        </>
      )}
    </div>
  );
}
