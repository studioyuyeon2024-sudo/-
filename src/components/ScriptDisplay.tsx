"use client";

import { useMemo } from "react";

interface Props {
  script: string;
  isGenerating: boolean;
}

interface ScriptSection {
  title: string;
  duration: string;
  content: string;
}

function parseScriptSections(script: string): {
  header: string;
  sections: ScriptSection[];
} {
  const lines = script.split("\n");
  let header = "";
  const sections: ScriptSection[] = [];
  let currentSection: ScriptSection | null = null;
  let headerDone = false;

  for (const line of lines) {
    // ## 로 시작하는 식순 섹션 감지
    if (line.match(/^##\s+/)) {
      headerDone = true;
      if (currentSection) {
        currentSection.content = currentSection.content.trim();
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace(/^##\s+/, "").trim(),
        duration: "",
        content: "",
      };
      continue;
    }

    // *예상 소요시간* 감지
    if (currentSection && line.match(/^\*.*소요시간.*\*/)) {
      currentSection.duration = line.replace(/\*/g, "").trim();
      continue;
    }

    if (!headerDone) {
      header += line + "\n";
    } else if (currentSection) {
      // --- 구분선 제외
      if (line.match(/^---+$/)) continue;
      currentSection.content += line + "\n";
    }
  }

  if (currentSection) {
    currentSection.content = currentSection.content.trim();
    sections.push(currentSection);
  }

  return { header: header.trim(), sections };
}

function formatContent(text: string) {
  return text.split("\n").map((line, i) => {
    // 사회자 멘트
    if (line.startsWith("사회자:")) {
      return (
        <p key={i} className="my-1.5">
          <span className="font-semibold text-rose-800">사회자:</span>
          <span className="text-gray-700">{line.slice(4)}</span>
        </p>
      );
    }

    // [지시사항] 형태
    const directiveMatch = line.match(/^\[(.+)\]$/);
    if (directiveMatch) {
      return (
        <p key={i} className="my-1 text-blue-600 text-sm italic">
          [{directiveMatch[1]}]
        </p>
      );
    }

    // **굵은 텍스트** 처리
    if (line.match(/\*\*.+\*\*/)) {
      const parts = line.split(/(\*\*.+?\*\*)/g);
      return (
        <p key={i} className="my-1 text-gray-700">
          {parts.map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={j} className="text-rose-800">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    }

    // 빈 줄
    if (!line.trim()) return <div key={i} className="h-2" />;

    // 일반 텍스트
    return (
      <p key={i} className="my-1 text-gray-700 leading-relaxed">
        {line}
      </p>
    );
  });
}

export default function ScriptDisplay({ script, isGenerating }: Props) {
  const parsed = useMemo(() => {
    if (!script) return null;
    return parseScriptSections(script);
  }, [script]);

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

      {/* Script content - 카드 형태 */}
      {parsed && parsed.sections.length > 0 ? (
        <div className="space-y-4">
          {/* 헤더 (일시, 장소, 신랑/신부) */}
          {parsed.header && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              {parsed.header.split("\n").map((line, i) => {
                if (line.startsWith("# ")) {
                  return (
                    <h1 key={i} className="text-lg font-bold text-rose-900 mb-2">
                      {line.slice(2)}
                    </h1>
                  );
                }
                if (line.match(/\*\*.+\*\*/)) {
                  const parts = line.split(/(\*\*.+?\*\*)/g);
                  return (
                    <p key={i} className="text-sm text-rose-700">
                      {parts.map((part, j) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return <strong key={j}>{part.slice(2, -2)}</strong>;
                        }
                        return <span key={j}>{part}</span>;
                      })}
                    </p>
                  );
                }
                if (line.match(/^---+$/)) return null;
                if (!line.trim()) return null;
                return (
                  <p key={i} className="text-sm text-rose-700">
                    {line}
                  </p>
                );
              })}
            </div>
          )}

          {/* 식순별 카드 */}
          {parsed.sections.map((section, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
            >
              {/* 카드 헤더 */}
              <div className="bg-gradient-to-r from-rose-50 to-rose-100/50 px-4 py-3 border-b border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <h3 className="font-bold text-rose-900 text-sm">
                    {section.title}
                  </h3>
                </div>
                {section.duration && (
                  <span className="text-xs text-rose-500 bg-white px-2 py-0.5 rounded-full border border-rose-200">
                    {section.duration}
                  </span>
                )}
              </div>
              {/* 카드 내용 */}
              <div className="px-4 py-3 text-sm">
                {formatContent(section.content)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 파싱 전이거나 생성 중일 때 기본 표시 */
        <div className="prose prose-sm max-w-none prose-headings:text-rose-900 prose-h1:text-xl prose-h2:text-lg prose-strong:text-rose-800 prose-p:text-gray-700 prose-p:leading-relaxed whitespace-pre-wrap text-sm text-gray-700">
          {script}
        </div>
      )}

      {isGenerating && (
        <span className="inline-block w-0.5 h-5 bg-rose-500 animate-pulse ml-1 mt-2" />
      )}
    </div>
  );
}
