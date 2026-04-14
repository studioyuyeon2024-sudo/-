"use client";

import { useEffect, useMemo, useState } from "react";

interface Props {
  script: string;
  isGenerating: boolean;
  onScriptChange?: (newScript: string) => void;
}

interface ScriptSection {
  title: string;
  duration: string;
  content: string;
  rawLines: string[];
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
        rawLines: [line],
      };
      continue;
    }

    if (currentSection && line.match(/^\*.*소요시간.*\*/)) {
      currentSection.duration = line.replace(/\*/g, "").trim();
      currentSection.rawLines.push(line);
      continue;
    }

    if (!headerDone) {
      header += line + "\n";
    } else if (currentSection) {
      if (line.match(/^---+$/)) {
        currentSection.rawLines.push(line);
        continue;
      }
      currentSection.content += line + "\n";
      currentSection.rawLines.push(line);
    }
  }

  if (currentSection) {
    currentSection.content = currentSection.content.trim();
    sections.push(currentSection);
  }

  return { header: header.trim(), sections };
}

function rebuildScript(header: string, sections: ScriptSection[]): string {
  let result = header ? header + "\n\n" : "";
  for (const section of sections) {
    result += `## ${section.title}\n`;
    if (section.duration) {
      result += `*${section.duration}*\n`;
    }
    result += `\n${section.content}\n\n---\n\n`;
  }
  return result.trim();
}

function formatContent(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("사회자:")) {
      return (
        <p key={i} className="my-1.5">
          <span className="font-semibold text-rose-800">사회자:</span>
          <span className="text-gray-700">{line.slice(4)}</span>
        </p>
      );
    }

    const directiveMatch = line.match(/^\[(.+)\]$/);
    if (directiveMatch) {
      return (
        <p key={i} className="my-1 text-blue-600 text-sm italic">
          [{directiveMatch[1]}]
        </p>
      );
    }

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

    if (!line.trim()) return <div key={i} className="h-2" />;

    return (
      <p key={i} className="my-1 text-gray-700 leading-relaxed">
        {line}
      </p>
    );
  });
}

function SectionCard({
  section,
  index,
  isGenerating,
  onUpdate,
}: {
  section: ScriptSection;
  index: number;
  isGenerating: boolean;
  onUpdate: (newContent: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(section.content);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiInput, setShowAiInput] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [reviseError, setReviseError] = useState("");

  // 외부에서 section.content가 변경되면 editText 동기화
  useEffect(() => {
    setEditText(section.content);
  }, [section.content]);

  const formattedContent = useMemo(() => formatContent(section.content), [section.content]);

  const handleSaveEdit = () => {
    onUpdate(editText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(section.content);
    setIsEditing(false);
  };

  const handleAiRevise = async () => {
    if (!aiPrompt.trim()) return;
    setIsRevising(true);
    setReviseError("");

    try {
      const res = await fetch("/api/revise-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionTitle: section.title,
          sectionContent: section.content,
          instruction: aiPrompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate(data.content);
        setAiPrompt("");
        setShowAiInput(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setReviseError(err.error || "수정 요청 중 오류가 발생했습니다.");
      }
    } catch {
      setReviseError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsRevising(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* 카드 헤더 */}
      <div className="bg-gradient-to-r from-rose-50 to-rose-100/50 px-4 py-3 border-b border-rose-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            {index + 1}
          </span>
          <h3 className="font-bold text-rose-900 text-sm">{section.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          {section.duration && (
            <span className="text-xs text-rose-500 bg-white px-2 py-0.5 rounded-full border border-rose-200 mr-1">
              {section.duration}
            </span>
          )}
          {!isGenerating && !isEditing && (
            <>
              <button
                onClick={() => {
                  setEditText(section.content);
                  setIsEditing(true);
                  setShowAiInput(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md transition-colors"
                aria-label={`${section.title} 직접 수정`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setShowAiInput(!showAiInput);
                  setIsEditing(false);
                  setReviseError("");
                }}
                className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-white rounded-md transition-colors"
                aria-label={`${section.title} AI 수정 요청`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI 수정 요청 입력 */}
      {showAiInput && (
        <div className="px-4 py-3 bg-violet-50 border-b border-violet-100">
          <p className="text-xs text-violet-600 font-medium mb-2">AI에게 수정 요청</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) handleAiRevise();
              }}
              placeholder="예: 좀 더 따뜻한 톤으로, 축가 가수 이름 추가..."
              className="flex-1 px-3 py-2 text-sm border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none"
              disabled={isRevising}
            />
            <button
              onClick={handleAiRevise}
              disabled={isRevising || !aiPrompt.trim()}
              className="px-3 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {isRevising ? (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  수정 중
                </span>
              ) : (
                "수정"
              )}
            </button>
            <button
              onClick={() => { setShowAiInput(false); setAiPrompt(""); setReviseError(""); }}
              className="px-2 py-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="AI 수정 닫기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {reviseError && (
            <p className="mt-2 text-sm text-red-600" aria-live="polite">{reviseError}</p>
          )}
        </div>
      )}

      {/* 카드 내용 */}
      <div className="px-4 py-3 text-sm">
        {isEditing ? (
          <div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full min-h-[150px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none font-mono"
              rows={Math.max(5, editText.split("\n").length + 1)}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          formattedContent
        )}
      </div>
    </div>
  );
}

export default function ScriptDisplay({ script, isGenerating, onScriptChange }: Props) {
  const [copyMsg, setCopyMsg] = useState("");

  const parsed = useMemo(() => {
    if (!script) return null;
    return parseScriptSections(script);
  }, [script]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(script);
    setCopyMsg("복사되었습니다!");
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const handleSectionUpdate = (index: number, newContent: string) => {
    if (!parsed || !onScriptChange) return;
    const updatedSections = [...parsed.sections];
    updatedSections[index] = { ...updatedSections[index], content: newContent };
    const newScript = rebuildScript(parsed.header, updatedSections);
    onScriptChange(newScript);
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
          <div className="flex items-center gap-2">
            {copyMsg && (
              <span className="text-sm text-green-600" aria-live="polite">{copyMsg}</span>
            )}
            <button
              onClick={copyToClipboard}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              복사
            </button>
          </div>
        )}
      </div>

      {/* Script content - 카드 형태 */}
      {parsed && parsed.sections.length > 0 ? (
        <div className="space-y-4">
          {/* 헤더 */}
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
            <SectionCard
              key={`${section.title}-${i}`}
              section={section}
              index={i}
              isGenerating={isGenerating}
              onUpdate={(newContent) => handleSectionUpdate(i, newContent)}
            />
          ))}
        </div>
      ) : (
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-gray-700">
          {script}
        </div>
      )}

      {isGenerating && (
        <span className="inline-block w-0.5 h-5 bg-rose-500 animate-pulse ml-1 mt-2" />
      )}
    </div>
  );
}
