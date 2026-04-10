"use client";

import { useState, useRef } from "react";
import { SampleScript } from "@/lib/types";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList) => {
    setError("");
    setIsProcessing(true);

    const newSamples: SampleScript[] = [];

    for (const file of Array.from(files)) {
      try {
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
            setError(data.error || `${file.name} 처리 실패`);
            continue;
          }

          const data = await response.json();
          content = data.text;
        } else {
          content = await file.text();
        }

        if (content.trim()) {
          // DB에 저장
          const res = await fetch("/api/samples", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: file.name, content: content.trim() }),
          });

          if (res.ok) {
            const saved = await res.json();
            newSamples.push({
              id: saved.id,
              name: saved.name,
              content: saved.content,
            });
          } else {
            const errData = await res.json().catch(() => ({}));
            setError(errData.error || `${file.name} 저장 실패`);
          }
        }
      } catch {
        setError(`${file.name} 처리 중 오류가 발생했습니다.`);
      }
    }

    if (newSamples.length > 0) {
      onChange([...samples, ...newSamples]);
    }
    setIsProcessing(false);
  };

  const removeSample = async (id: string) => {
    // DB에서 삭제
    await fetch(`/api/samples?id=${id}`, { method: "DELETE" });
    onChange(samples.filter((s) => s.id !== id));
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">
        대본 샘플 업로드
      </h2>
      <p className="text-sm text-gray-500 mb-3">
        기존에 사용한 사회 대본을 업로드하면 AI가 그 스타일을 참고하여 생성합니다.
        업로드한 샘플은 저장되어 다음에도 사용됩니다.
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-rose-300 hover:bg-rose-50/50 transition-colors disabled:opacity-50"
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
              파일 처리 중...
            </span>
          ) : (
            <span>PDF, TXT, MD 파일 선택 (복수 가능)</span>
          )}
        </button>

        {samples.length > 0 && (
          <ul className="space-y-2">
            {samples.map((sample) => (
              <li
                key={sample.id}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg
                    className="w-4 h-4 text-rose-500 shrink-0"
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
                  <span className="truncate text-gray-700">{sample.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    ({Math.round(sample.content.length / 100) * 100}자)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSample(sample.id)}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
