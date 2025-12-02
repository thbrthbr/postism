"use client";

import { FC, useRef } from "react";
import Editor, { OnChange } from "@monaco-editor/react";

interface CodeEditorProps {
  value?: string;
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
  const initialized = useRef(false);

  const handleChange: OnChange = (val) => {
    if (val !== undefined && onChange) onChange(val);
  };

  const handleMount = (editor: any, monaco: any) => {
    if (onMount) onMount(editor);

    // ✅ 최초 1회만 값 설정
    if (!initialized.current && value) {
      editor.setValue(value);
      initialized.current = true;
    }

    // ✅ 테마 강제 적용 (React 렌더링 안 타도 유지)
    if (theme && monaco) {
      monaco.editor.setTheme(theme);
    }
  };

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      onChange={handleChange}
      onMount={handleMount}
      theme={theme} // 여전히 props로 유지 (초기 렌더엔 반영됨)
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
