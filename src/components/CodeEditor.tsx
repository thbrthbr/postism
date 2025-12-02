"use client";

import { FC } from "react";
import Editor, { OnChange } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  theme?: string;
  onMount?: (editor: any) => void;
}

const CodeEditor: FC<CodeEditorProps> = ({
  value,
  language = "plaintext",
  onChange,
  readOnly = false,
  theme = "vs-dark",
  onMount,
}) => {
  const handleChange: OnChange = (val) => {
    if (val !== undefined && onChange) onChange(val);
  };

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      value={value}
      onChange={handleChange}
      onMount={(editor) => {
        if (onMount) onMount(editor);
      }}
      theme={theme}
      options={{
        readOnly,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 14,
        automaticLayout: true,
        lineNumbers: "off",
        minimap: { enabled: false },
        smoothScrolling: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: "on",
        cursorBlinking: "smooth",
        renderWhitespace: "none",
        quickSuggestions: false,
        fixedOverflowWidgets: true,
        scrollbar: {
          verticalHasArrows: false,
          horizontalHasArrows: false,
          useShadows: false, // ✅ 그림자 효과 제거
          verticalScrollbarSize: 8, // ✅ 두께 줄이기
          horizontalScrollbarSize: 8,
          handleMouseWheel: true,
          vertical: "visible", // ✅ 스크롤 thumb만 표시
        },

        // ✅ 시각적 효과 최소화
        overviewRulerLanes: 0, // 우측 얇은 색 표시줄 제거
        overviewRulerBorder: false, // 우측 테두리 제거
        renderLineHighlight: "none", // ← 클릭된 줄 강조 비활성화
        selectionHighlight: false, // ← 선택 영역 주변 하이라이트 제거
        occurrencesHighlight: "off", // ← 동일 단어 자동 하이라이트 제거
        renderLineHighlightOnlyWhenFocus: false, // ← 포커스 시에도 유지하지 않음
      }}
    />
  );
};

export default CodeEditor;
