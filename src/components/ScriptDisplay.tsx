"use client";

import ReactMarkdown from "react-markdown";

interface Props {
  script: string;
  isGenerating: boolean;
}

export default function ScriptDisplay({ script, isGenerating }: Props) {
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(script);
    alert("대본이 클립보드에 복사되었습니다.");
  };

  if (!script && !isGenerating) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-gray-400">
        <div className="text-center">
          <div className="text-5xl mb-4">&#128221;</div>
          <p className="text-sm">
            왼쪽에서 정보를 입력하고
            <br />
            &quot;대본 생성&quot; 버튼을 눌러주세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        {isGenerating ? (
          <span className="inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            생성 중...
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
            생성 완료
          </span>
        )}
        {script && !isGenerating && (
          <button
            onClick={copyToClipboard}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            복사
          </button>
        )}
      </div>

      {/* Script content */}
      <div className="prose prose-sm max-w-none prose-headings:text-rose-900 prose-h1:text-xl prose-h2:text-lg prose-h2:border-b prose-h2:border-rose-100 prose-h2:pb-2 prose-strong:text-rose-800 prose-p:text-gray-700 prose-p:leading-relaxed">
        <ReactMarkdown>{script}</ReactMarkdown>
      </div>

      {isGenerating && (
        <span className="inline-block w-0.5 h-5 bg-rose-500 animate-pulse ml-1" />
      )}
    </div>
  );
}
