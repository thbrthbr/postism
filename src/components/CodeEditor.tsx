"use client";

import { FC, memo, useRef } from "react";
import Editor, { OnChange } from "@monaco-editor/react";

interface CodeEditorProps {
  value?: string; // 초기 1회만 사용
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  theme?: string;
  onMount?: (editor: any) => void;
}

const CodeEditorBase: FC<CodeEditorProps> = ({
  value,
  language = "plaintext",
  onChange,
  readOnly = false,
  theme = "vs-dark",
  onMount,
}) => {
  const initialized = useRef(false); // ✅ 최초 1회만 setValue 방지용

  const handleChange: OnChange = (val) => {
    if (val !== undefined && onChange) onChange(val);
  };

  const handleMount = (editor: any) => {
    if (onMount) onMount(editor);

    // ✅ 최초 1회만 수동 세팅 (커서 리셋 방지)
    if (!initialized.current && value) {
      editor.setValue(value);
      initialized.current = true;
    }
  };

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
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

// ✅ React.memo로 감싸서 불필요한 리렌더 방지
const CodeEditor = memo(CodeEditorBase, () => true);
export default CodeEditor;
