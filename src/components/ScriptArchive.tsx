"use client";

import { useState, useEffect } from "react";
import { ArchivedScript } from "@/lib/types";

interface Props {
  onLoadScript?: (script: ArchivedScript) => void;
}

function parseStepNames(script: string): string[] {
  return script
    .split("\n")
    .filter((line) => line.match(/^##\s+/))
    .map((line) => line.replace(/^##\s+(?:\d+\.\s*)?/, "").trim());
}

export default function ScriptArchive({ onLoadScript }: Props) {
  const [scripts, setScripts] = useState<ArchivedScript[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/scripts")
      .then((res) => {
        if (!res.ok) throw new Error("불러오기 실패");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setScripts(data);
      })
      .catch(() => setError("대본 목록을 불러오지 못했습니다"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/scripts?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setScripts(scripts.filter((s) => s.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const selectedScript = scripts.find((s) => s.id === selectedId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <span className="w-5 h-5 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin mr-3" />
        불러오는 중...
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-sm text-red-600">{error}</div>;
  }

  if (scripts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">저장된 대본이 없습니다</p>
        <p className="text-gray-400 text-xs mt-1">대본을 작성하고 저장하면 여기에 표시됩니다</p>
      </div>
    );
  }

  // 상세 보기
  if (selectedScript) {
    const stepNames = parseStepNames(selectedScript.script);

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedId(null)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </button>
          {onLoadScript && (
            <button
              onClick={() => onLoadScript(selectedScript)}
              className="px-5 py-2 text-sm text-white bg-rose-600 rounded-xl hover:bg-rose-700 font-semibold shadow-sm transition-all"
            >
              이 대본 불러오기
            </button>
          )}
        </div>

        {/* 대본 정보 헤더 */}
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedScript.groom_name} <span className="text-rose-400">&hearts;</span> {selectedScript.bride_name}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                {selectedScript.wedding_date && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {selectedScript.wedding_date}
                  </span>
                )}
                {selectedScript.venue && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {selectedScript.venue}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 식순 태그 */}
          {stepNames.length > 0 && (
            <div className="mt-4 pt-4 border-t border-rose-200/50">
              <p className="text-xs font-semibold text-rose-600 mb-2">식순 ({stepNames.length}개)</p>
              <div className="flex flex-wrap gap-1.5">
                {stepNames.map((name, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-white/80 text-rose-700 text-xs rounded-lg border border-rose-200/50 shadow-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 대본 내용 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {selectedScript.script.split("\n").map((line, i) => {
            if (line.startsWith("# ")) return <h1 key={i} className="text-lg font-bold text-gray-900 mb-3">{line.slice(2)}</h1>;
            if (line.startsWith("## ")) return <h2 key={i} className="text-base font-bold text-rose-800 mt-8 mb-3 pb-2 border-b border-rose-100">{line.slice(3)}</h2>;
            if (line.startsWith("사회자:")) {
              return (
                <p key={i} className="my-1.5">
                  <span className="font-semibold text-rose-800">사회자:</span>
                  <span className="text-gray-700">{line.slice(4)}</span>
                </p>
              );
            }
            if (line.match(/^\(.+\)$/)) return <p key={i} className="my-1 text-blue-600 text-xs font-medium">{line}</p>;
            if (line.match(/^\[.+\]$/)) return <p key={i} className="my-1 text-violet-600 text-xs italic">{line}</p>;
            if (line.match(/^\*\*.+\*\*/)) {
              const parts = line.split(/(\*\*.+?\*\*)/g);
              return (
                <p key={i} className="my-1 text-sm text-gray-700">
                  {parts.map((part, j) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={j} className="text-gray-900">{part.slice(2, -2)}</strong>
                      : <span key={j}>{part}</span>
                  )}
                </p>
              );
            }
            if (line.match(/^\*.+\*$/)) return <p key={i} className="my-0.5 text-xs text-gray-400 italic">{line}</p>;
            if (!line.trim()) return <div key={i} className="h-3" />;
            return <p key={i} className="my-1 text-sm text-gray-700 leading-relaxed">{line}</p>;
          })}
        </div>
      </div>
    );
  }

  // 목록 보기
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {scripts.map((script) => {
        const stepNames = parseStepNames(script.script);

        return (
          <div
            key={script.id}
            className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-rose-200 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="mb-3">
              <h3 className="font-bold text-gray-900 text-base">
                {script.groom_name} <span className="text-rose-400">&hearts;</span> {script.bride_name}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                {script.wedding_date && <span>{script.wedding_date}</span>}
                {script.venue && <span>{script.venue}</span>}
              </div>
            </div>

            {/* 식순 태그 */}
            {stepNames.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {stepNames.slice(0, 6).map((name, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-md"
                    >
                      {name}
                    </span>
                  ))}
                  {stepNames.length > 6 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded-md">
                      +{stepNames.length - 6}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="text-[10px] text-gray-400 mb-3">
              {script.created_at?.slice(0, 10)}에 저장
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedId(script.id)}
                className="flex-1 px-3 py-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors font-medium"
              >
                열기
              </button>
              {onLoadScript && (
                <button
                  onClick={() => onLoadScript(script)}
                  className="flex-1 px-3 py-2 text-sm text-violet-600 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-colors font-medium"
                >
                  불러오기
                </button>
              )}
              <button
                onClick={() => handleDelete(script.id)}
                className="px-3 py-2 text-gray-400 border border-gray-200 rounded-xl hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                aria-label="삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
