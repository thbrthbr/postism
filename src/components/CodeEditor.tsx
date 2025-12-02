"use client";

import { FC } from "react";
import Editor, { OnMount } from "@monaco-editor/react";

export interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  theme?: "light" | "dark" | "wood" | "pink";
}

const CodeEditor: FC<CodeEditorProps> = ({
  value,
  language = "plaintext",
  onChange,
  readOnly = false,
  theme = "light",
}) => {
  // ✅ onChange에서 undefined 처리 없이 문자열만 받게
  const handleChange = (val?: string) => {
    if (onChange && typeof val === "string") onChange(val);
  };

  // ✅ Tab 눌렀을 때 공백 2칸 삽입
  const handleMount: OnMount = (editor, monaco) => {
    editor.onKeyDown((e) => {
      if (e.code === "Tab") {
        e.preventDefault();

        const model = editor.getModel();
        const selection = editor.getSelection();
        if (!model || !selection) return;

        editor.executeEdits("insert-two-spaces", [
          {
            range: selection,
            text: "  ",
            forceMoveMarkers: true,
          },
        ]);
      }
    });
  };

  return (
    <Editor
      height="100vh"
      defaultLanguage={language}
      value={value}
      onChange={handleChange}
      onMount={handleMount}
      theme={theme}
      options={{
        readOnly,
        fontFamily: "JetBrains Mono, Consolas, monospace",
        fontSize: 14,
        automaticLayout: true,
        lineNumbers: "on",
        minimap: { enabled: false },
        smoothScrolling: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: "off",
        cursorBlinking: "smooth",
        renderWhitespace: "none",
        quickSuggestions: false,
        fixedOverflowWidgets: true,
      }}
    />
  );
};

export default CodeEditor;
