"use client";

import { useState, useRef, DragEvent } from "react";
import { CeremonyStep } from "@/lib/types";
import { fileToBase64 } from "@/lib/utils";

interface PdfUploadInputProps {
  onStepsExtracted: (steps: CeremonyStep[]) => void;
  onInfoExtracted?: (info: {
    groomName: string;
    brideName: string;
    weddingDate: string;
    venue: string;
  }) => void;
}

export default function PdfUploadInput({
  onStepsExtracted,
  onInfoExtracted,
}: PdfUploadInputProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("PDF 파일만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("파일 크기가 10MB를 초과합니다.");
      return;
    }

    setError("");
    setFileName(file.name);
    setIsParsing(true);

    try {
      const pdfBase64 = await fileToBase64(file);

      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64, mode: "ceremony" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "PDF 처리 중 오류가 발생했습니다.");
        return;
      }

      if (data.steps) {
        onStepsExtracted(data.steps);
      }

      if (data.info && onInfoExtracted) {
        onInfoExtracted(data.info);
      }
    } catch {
      setError("PDF 업로드 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-3">
        식순 PDF 업로드
      </h2>
      <p className="text-sm text-gray-500 mb-3">
        식순이 포함된 PDF를 업로드하면 자동으로 식순이 추출됩니다.
      </p>

      <div
        role="button"
        tabIndex={0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
        aria-label="PDF 파일 업로드 영역. 클릭하거나 파일을 드래그하세요."
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver
            ? "border-rose-400 bg-rose-50"
            : "border-gray-300 hover:border-rose-300 hover:bg-rose-50/50"
        } ${isParsing ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        {isParsing ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
            <span className="text-sm text-gray-600">
              PDF 분석 중... 식순을 추출하고 있습니다.
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-sm text-gray-600">
              {fileName
                ? `${fileName} 업로드 완료`
                : "PDF 파일을 드래그하거나 클릭하여 선택하세요"}
            </span>
            <span className="text-xs text-gray-400">
              식순 항목, 날짜, 장소, 신랑/신부 정보를 자동 추출합니다
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" aria-live="polite">{error}</p>
      )}
    </div>
  );
}
