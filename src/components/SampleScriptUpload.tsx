"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SampleScript } from "@/lib/types";
import { fileToBase64 } from "@/lib/utils";

interface SampleScriptUploadProps {
  samples: SampleScript[];
  onChange: (samples: SampleScript[]) => void;
}

export default function SampleScriptUpload({
  samples,
  onChange,
}: SampleScriptUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const processFile = useCallback(async (file: File): Promise<SampleScript | null> => {
    let content = "";

    if (file.type === "application/pdf") {
      const pdfBase64 = await fileToBase64(file);
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64, mode: "sample" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `${file.name} 처리 실패`);
      }

      const data = await response.json();
      content = data.text;
    } else {
      content = await file.text();
    }

    if (!content.trim()) return null;

    const res = await fetch("/api/samples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, content: content.trim() }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `${file.name} 저장 실패`);
    }

    const saved = await res.json();
    return { id: saved.id, name: saved.name, content: saved.content };
  }, []);

  const handleFiles = async (files: FileList) => {
    setError("");
    setIsProcessing(true);

    const results = await Promise.allSettled(
      Array.from(files).map((file) => processFile(file))
    );

    const newSamples: SampleScript[] = [];
    const errors: string[] = [];

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        newSamples.push(result.value);
      } else if (result.status === "rejected") {
        errors.push(result.reason?.message || "알 수 없는 오류");
      }
    }

    if (errors.length > 0) {
      setError(errors.join(", "));
    }

    if (newSamples.length > 0) {
      onChange([...samples, ...newSamples]);
    }
    setIsProcessing(false);
  };

  const removeSample = async (id: string) => {
    try {
      const res = await fetch(`/api/samples?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("삭제에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      onChange(samples.filter((s) => s.id !== id));
    } catch {
      setError("삭제 중 네트워크 오류가 발생했습니다.");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">
        대본 샘플 업로드
      </h2>
      <p className="text-sm text-gray-500 mb-3">
        기존에 사용한 사회 대본을 업로드하면 AI가 그 스타일을 참고하여 생성합니다.
      </p>

      <div className="space-y-3">
        {/* 업로드 버튼 + 드롭다운 한 줄 */}
        <div className="flex gap-2">
          <label
            className={`flex-1 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-rose-300 hover:bg-rose-50/50 transition-colors cursor-pointer text-center ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                처리 중...
              </span>
            ) : (
              <span>+ 샘플 추가</span>
            )}
          </label>

          {samples.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="h-full px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 font-medium hover:bg-rose-100 transition-colors flex items-center gap-2"
              >
                <span>{samples.length}개 저장됨</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {samples.map((sample) => (
                    <div
                      key={sample.id}
                      className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <svg
                          className="w-4 h-4 text-rose-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="truncate text-sm text-gray-700">{sample.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSample(sample.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        aria-label={`${sample.name} 삭제`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600" aria-live="polite">{error}</p>}
      </div>
    </div>
  );
}
