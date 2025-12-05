"use client";

import { FC, useEffect, useRef } from "react";
import Editor, { OnChange, useMonaco } from "@monaco-editor/react";
import Spinner from "./spinner";

interface CodeEditorProps {
  value?: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  theme?: string;
  onMount?: (editor: any) => void;
  showImages?: boolean; // 🔹 추가
}

const CodeEditor: FC<CodeEditorProps> = ({
  value,
  language = "plaintext",
  onChange,
  readOnly = false,
  theme,
  onMount,
  showImages = false, // 🔹 기본값
}) => {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);

  const handleChange: OnChange = (val) => {
    if (onChange) onChange(val ?? "");
  };

  const handleMount = (editor: any, monacoInstance: any) => {
    editorRef.current = editor;
    if (onMount) onMount(editor);

    const currentTheme =
      (typeof window !== "undefined" && window.__theme) || theme || "light";
    monacoInstance.editor.setTheme(currentTheme);
  };

  // 테마 변경 이벤트 연결
  useEffect(() => {
    if (!monaco || typeof window === "undefined") return;
    const applyTheme = (t: string) => monaco.editor.setTheme(t);
    const initialTheme = window.__theme || theme || "light";
    applyTheme(initialTheme);
    window.__onThemeChange = (t: any) => applyTheme(t);
  }, [monaco, theme]);

  // 🔹 이미지 보기 기능: showImages 토글 시 적용
  useEffect(() => {
    if (!editorRef.current) return;
    applyImageOverlays(editorRef.current, showImages);
  }, [showImages, value]);

  return (
    <Editor
      loading={null}
      height="100%"
      defaultLanguage={language}
      value={value}
      onChange={handleChange}
      onMount={handleMount}
      theme={theme}
      options={{
        lineHeight: 26,
        readOnly,
        stickyScroll: { enabled: false },
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
        bracketPairColorization: { enabled: false },
        tabSize: 2,
        wordWrap: "on",
        wrappingStrategy: "advanced",
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
        rulers: [],
        hideCursorInOverviewRuler: true,
        matchBrackets: "never", // 커서 괄호 하이라이트 제거
        hover: { enabled: false }, // 마우스 올릴 때 툴팁 제거
        codeLens: false, // 함수 위에 뜨는 주석형 정보 제거
      }}
    />
  );
};

export default CodeEditor;

/* ------------------------------------------------------------------
   🧠 applyImageOverlays()
   - showImages = true일 때 ![alt](url) 패턴을 찾아 이미지 DOM을 삽입
------------------------------------------------------------------- */
function applyImageOverlays(editor: any, showImages: boolean) {
  const monaco = (window as any).monaco;
  if (!monaco) return;

  // 기존 위젯 제거
  const existingWidgets = (editor as any)._customImageWidgets || [];
  existingWidgets.forEach((w: any) => editor.removeOverlayWidget(w));
  (editor as any)._customImageWidgets = [];

  if (!showImages) return;

  const model = editor.getModel();
  if (!model) return;
  const text = model.getValue();

  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  const widgets: any[] = [];

  while ((match = imageRegex.exec(text)) !== null) {
    const lineNumber = model.getPositionAt(match.index).lineNumber;
    const id = `image-widget-${match.index}-${Date.now()}`;
    const imgUrl = match[2];
    const alt = match[1];

    // DOM 생성
    const domNode = document.createElement("div");
    domNode.style.pointerEvents = "none";
    domNode.style.margin = "4px 0";

    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = alt;
    img.style.maxWidth = "100%";
    img.style.borderRadius = "4px";
    img.style.border = "1px solid rgba(128,128,128,0.3)";
    img.onerror = () => {
      img.style.display = "none";
    };

    domNode.appendChild(img);

    // OverlayWidget 생성
    const widget = {
      getId: () => id,
      getDomNode: () => domNode,
      getPosition: () => ({
        preference:
          monaco.editor.OverlayWidgetPositionPreference.BOTTOM_RIGHT_CORNER,
      }),
    };

    editor.addOverlayWidget(widget);
    widgets.push(widget);

    // 줄 높이 맞춰주기 (살짝 트릭)
    const decoration = {
      range: new monaco.Range(lineNumber, 1, lineNumber, 1),
      options: {
        isWholeLine: true,
        linesDecorationsClassName: "has-image-line",
      },
    };
    editor.deltaDecorations([], [decoration]);
  }

  (editor as any)._customImageWidgets = widgets;
}
