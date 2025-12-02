"use client";

import { FC, useEffect, useRef } from "react";
import Editor, { OnChange, useMonaco } from "@monaco-editor/react";

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
  theme,
  onMount,
}) => {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const initialized = useRef(false);

  const handleChange: OnChange = (val) => {
    if (val !== undefined && onChange) onChange(val);
  };

  const handleMount = (editor: any, monacoInstance: any) => {
    editorRef.current = editor;
    if (onMount) onMount(editor);

    // ✅ 최초 1회 값 세팅
    if (!initialized.current && value) {
      editor.setValue(value);
      initialized.current = true;
    }

    // ✅ 현재 window.__theme 반영
    const currentTheme = window.__theme || theme || "light";
    monacoInstance.editor.setTheme(currentTheme);
  };

  // ✅ 테마 변경 이벤트 연결 (마운트 이후 반영)
  useEffect(() => {
    if (!monaco) return;

    const applyTheme = (t: string) => {
      monaco.editor.setTheme(t);
    };

    // 최초 적용
    const initialTheme = window.__theme || theme || "light";
    applyTheme(initialTheme);

    // 변경 시 반영
    window.__onThemeChange = (t: any) => {
      applyTheme(t);
    };
  }, [monaco, theme]);

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      onChange={handleChange}
      onMount={handleMount}
      theme={theme} // 초기 렌더용
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
        wordWrap: "bounded",
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
        padding: { top: 8, bottom: 8 }, // ✅ right/left 명시
        overviewRulerLanes: 0,
        overviewRulerBorder: false,
        renderLineHighlight: "none",
        selectionHighlight: false,
        occurrencesHighlight: "off",
        renderLineHighlightOnlyWhenFocus: false,
        rulers: [], // 가이드라인 여백 제거
        // renderMarginRevertPadding: false, // minimap 자투리 제거
        // overviewRulerBorderWidth: 0, // 내부 경계선 폭 제거
        hideCursorInOverviewRuler: true, // ruler 관련 커서 여백 제거
      }}
    />
  );
};

export default CodeEditor;
