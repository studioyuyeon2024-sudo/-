"use client";

import { useState, useEffect } from "react";
import { ArchivedScript } from "@/lib/types";

interface Props {
  onLoadScript?: (script: ArchivedScript) => void;
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
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-3">&#128218;</div>
        <p className="text-sm">저장된 대본이 없습니다</p>
        <p className="text-xs mt-1">대본을 작성하고 저장하면 여기에 표시됩니다</p>
      </div>
    );
  }

  // 상세 보기
  if (selectedScript) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedId(null)}
            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </button>
          {onLoadScript && (
            <button
              onClick={() => onLoadScript(selectedScript)}
              className="px-4 py-1.5 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700"
            >
              이 대본 불러오기
            </button>
          )}
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4">
          <h2 className="font-bold text-rose-900">
            {selectedScript.groom_name} ♥ {selectedScript.bride_name}
          </h2>
          <p className="text-sm text-rose-700 mt-1">
            {selectedScript.wedding_date} | {selectedScript.venue}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 prose prose-sm max-w-none">
          {selectedScript.script.split("\n").map((line, i) => {
            if (line.startsWith("# ")) return <h1 key={i} className="text-lg font-bold text-rose-900 mb-2">{line.slice(2)}</h1>;
            if (line.startsWith("## ")) return <h2 key={i} className="text-base font-bold text-rose-800 mt-6 mb-2">{line.slice(3)}</h2>;
            if (line.startsWith("사회자:")) {
              return (
                <p key={i} className="my-1">
                  <span className="font-semibold text-rose-800">사회자:</span>
                  <span className="text-gray-700">{line.slice(4)}</span>
                </p>
              );
            }
            if (line.match(/^\[.+\]$/) || line.match(/^\(.+\)$/)) {
              return <p key={i} className="my-1 text-blue-600 text-sm italic">{line}</p>;
            }
            if (!line.trim()) return <div key={i} className="h-2" />;
            return <p key={i} className="my-1 text-gray-700 text-sm leading-relaxed">{line}</p>;
          })}
        </div>
      </div>
    );
  }

  // 목록 보기
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {scripts.map((script) => (
        <div
          key={script.id}
          className="bg-white border border-gray-200 rounded-xl p-4 hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-800">
                {script.groom_name} ♥ {script.bride_name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {script.wedding_date || "날짜 미정"} | {script.venue || "장소 미정"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {script.created_at?.slice(0, 10)}에 저장
                {script.ceremony_order && ` · 식순 ${script.ceremony_order.length}개`}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setSelectedId(script.id)}
              className="flex-1 px-3 py-1.5 text-sm text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
            >
              열기
            </button>
            {onLoadScript && (
              <button
                onClick={() => onLoadScript(script)}
                className="flex-1 px-3 py-1.5 text-sm text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors"
              >
                식순 가져오기
              </button>
            )}
            <button
              onClick={() => handleDelete(script.id)}
              className="px-3 py-1.5 text-sm text-gray-400 border border-gray-200 rounded-lg hover:text-red-500 hover:border-red-200 transition-colors"
              aria-label="삭제"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
