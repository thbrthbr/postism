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
        fontFamily: "JetBrains Mono, Consolas, monospace",
        fontSize: 14,
        automaticLayout: true,
        lineNumbers: "off",
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
