"use client";

interface Props {
  script: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  disabled: boolean;
}

export default function PdfDownloadButton({
  script,
  groomName,
  brideName,
  weddingDate,
  disabled,
}: Props) {
  const handleDownload = () => {
    // Create a printable HTML document and trigger print/save as PDF
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Convert markdown-like text to simple HTML
    const htmlContent = script
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^---$/gm, "<hr>")
      .replace(/\[(.+?)\]/g, '<span class="direction">[$1]</span>')
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>${groomName} & ${brideName} 결혼식 사회 대본</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Noto Sans KR', sans-serif;
            font-size: 14px;
            line-height: 1.8;
            color: #333;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 { font-size: 22px; text-align: center; margin: 20px 0; color: #881337; }
          h2 { font-size: 17px; color: #9f1239; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #fecdd3; }
          h3 { font-size: 15px; color: #555; margin: 16px 0 8px; }
          p { margin: 8px 0; }
          strong { color: #881337; }
          em { color: #6b7280; font-style: italic; }
          hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
          .direction { color: #2563eb; font-weight: 500; }
          @media print {
            body { padding: 20px; }
            h2 { break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <p>${htmlContent}</p>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled}
      className="w-full px-4 py-2.5 bg-white border-2 border-rose-500 text-rose-600 rounded-lg text-sm font-semibold hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      PDF 다운로드 / 인쇄
    </button>
  );
}
