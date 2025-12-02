"use client";

import { FC } from "react";
import Editor, { OnChange } from "@monaco-editor/react";

interface CodeEditorProps {
  value?: string; // ✅ optional로 변경 (초기값만 받음)
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

  const handleMount = (editor: any) => {
    if (onMount) onMount(editor);
    // ✅ 최초 1회만 수동으로 값 세팅
    if (value) editor.setValue(value);
  };

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      // ❌ 여기서 value를 넘기지 말 것
      onChange={handleChange}
      onMount={handleMount}
      theme={theme}
      options={{
        readOnly,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 16,
        automaticLayout: true,
        lineNumbers: "off",
        lineNumbersMinChars: 0,
        glyphMargin: false,
        folding: false,
        minimap: { enabled: false },
        smoothScrolling: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: "on",
        wordWrapColumn: 0,
        wrappingIndent: "none",
        cursorBlinking: "smooth",
        renderWhitespace: "none",
        quickSuggestions: false,
        contextmenu: false,
        fixedOverflowWidgets: true,
        scrollbar: {
          verticalHasArrows: false,
          horizontalHasArrows: false,
          useShadows: false,
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
          handleMouseWheel: true,
          vertical: "visible",
        },
        scrollBeyondLastColumn: 0,
        lineDecorationsWidth: 0,
        padding: { top: 8, bottom: 8 },
        overviewRulerLanes: 0,
        overviewRulerBorder: false,
        renderLineHighlight: "none",
        selectionHighlight: false,
        occurrencesHighlight: "off",
        renderLineHighlightOnlyWhenFocus: false,
      }}
    />
  );
};

export default CodeEditor;
