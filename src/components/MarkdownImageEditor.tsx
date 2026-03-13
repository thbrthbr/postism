//MarkdownImageEditor.tsx

import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

interface MarkdownImageEditorProps {
  readOnly?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  showImages?: boolean;
  onMount?: () => void; // ⭐ 추가
}

export interface MarkdownImageEditorRef {
  getValue: () => string;
  setValue: (value: string) => void;
}

const MarkdownImageEditor = forwardRef<
  MarkdownImageEditorRef,
  MarkdownImageEditorProps
>(function MarkdownImageEditor(
  {
    readOnly = false,
    onKeyDown,
    className = "",
    style = {},
    showImages = false,
    onMount,
  },
  ref,
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<string>("");
  const [, forceUpdate] = useState({});

  useImperativeHandle(ref, () => ({
    getValue: () => contentRef.current,
    setValue: (value: string) => {
      contentRef.current = value;
      if (editorRef.current) {
        updateEditorContent();
      }
    },
  }));

  const extractTextFromNode = (node: Node): string => {
    // 1. 텍스트 노드
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      // 2. 이미지 블록 (우선 처리)
      if (element.hasAttribute("data-image-raw")) {
        return element.getAttribute("data-image-raw") || "";
      }

      // 3. BR 태그 (명시적 줄바꿈)
      if (element.tagName === "BR") {
        return "\n";
      }

      // 4. 블록 요소 (DIV, P 등) 처리
      let text = "";
      Array.from(node.childNodes).forEach((child) => {
        text += extractTextFromNode(child);
      });

      // ⭐ 핵심 로직: 모바일의 <div>내용</div> 구조 대응
      // div가 비어있거나 안에 <br>만 있는 경우(빈 줄) \n 반환
      if (element.tagName === "DIV") {
        if (text === "" || text === "\n") {
          return "\n";
        }
        // 내용이 있는 div라면 끝에 줄바꿈을 붙여서 다음 줄과 분리
        return text.endsWith("\n") ? text : text + "\n";
      }

      return text;
    }

    return "";
  };

  const updateContentFromEditor = () => {
    if (!editorRef.current) return;

    let text = "";
    const nodes = Array.from(editorRef.current.childNodes);

    nodes.forEach((node, index) => {
      if (node.nodeType === Node.TEXT_NODE) {
        // 텍스트 노드는 그대로 추가
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;

        // 1. 이미지 블록 처리
        if (el.hasAttribute("data-image-raw")) {
          text += el.getAttribute("data-image-raw");
        }
        // 2. <br> 태그 처리
        else if (el.tagName === "BR") {
          text += "\n";
        }
        // 3. <div> 태그 (모바일 엔터) 처리
        else if (el.tagName === "DIV") {
          const divContent = el.innerText;

          // 앞선 텍스트가 있고, 현재 div가 시작된다면 줄바꿈을 하나 추가해야 함
          // (단, 이미 text 끝에 \n이 있다면 추가하지 않음)
          if (text !== "" && !text.endsWith("\n")) {
            text += "\n";
          }

          // <div><br></div> 형태인 경우 (빈 줄) \n 하나로 처리
          if (
            el.innerHTML === "<br>" ||
            divContent === "\n" ||
            divContent === ""
          ) {
            text += "\n";
          } else {
            // 내용이 있는 div인 경우 내용 추가 (innerText가 마지막 \n을 포함할 수 있으므로 trim)
            text += divContent.replace(/\n$/, "");
          }
        }
      }
    });

    // 최종 결과물에서 3개 이상의 연속 줄바꿈 방지 및 마무리
    contentRef.current = text.replace(/\n{3,}/g, "\n\n").trimEnd();
  };

  const updateEditorContent = () => {
    if (!editorRef.current) return;

    const content = contentRef.current;
    editorRef.current.innerHTML = "";

    if (!showImages) {
      // 텍스트 모드: 그냥 텍스트 그대로
      editorRef.current.textContent = content;
      return;
    }

    // 이미지 모드: 파싱해서 렌더링
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match: any;

    const fragment = document.createDocumentFragment();

    while ((match = imageRegex.exec(content)) !== null) {
      // 이미지 앞의 텍스트
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        const lines = textBefore.split("\n");
        lines.forEach((line, i) => {
          if (i > 0) fragment.appendChild(document.createElement("br"));
          if (line) fragment.appendChild(document.createTextNode(line));
        });
      }

      // 이미지 요소
      const imgContainer = document.createElement("span");
      imgContainer.contentEditable = "false";
      imgContainer.setAttribute("data-image-raw", match[0]);
      imgContainer.style.display = "inline-block";
      imgContainer.style.margin = "4px 2px";
      imgContainer.style.verticalAlign = "middle";
      imgContainer.style.maxWidth = "100%";
      imgContainer.style.cursor = "default";

      const img = document.createElement("img");
      img.src = match[2];
      img.alt = match[1];
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.display = "block";
      img.style.borderRadius = "4px";
      img.style.border = "1px solid rgba(128, 128, 128, 0.3)";

      img.onerror = () => {
        imgContainer.textContent = match[0];
        imgContainer.style.color = "red";
      };

      imgContainer.appendChild(img);
      fragment.appendChild(imgContainer);

      lastIndex = match.index + match[0].length;
    }

    // 마지막 텍스트
    if (lastIndex < content.length) {
      const textAfter = content.slice(lastIndex);
      const lines = textAfter.split("\n");
      lines.forEach((line, i) => {
        if (i > 0) fragment.appendChild(document.createElement("br"));
        if (line) fragment.appendChild(document.createTextNode(line));
      });
    }

    editorRef.current.appendChild(fragment);
  };

  const handleInput = () => {
    updateContentFromEditor();
    forceUpdate({});
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "  ");
      return;
    }

    if (showImages && e.key === "Backspace") {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);

      // 선택 영역이 있으면 기본 동작
      if (!range.collapsed) return;

      const container = range.startContainer;
      const offset = range.startOffset;

      // 이미지 블록 찾기
      let imageBlock: HTMLElement | null = null;
      if (container.nodeType === Node.ELEMENT_NODE) {
        const element = container as HTMLElement;
        if (offset > 0) {
          const prevNode = element.childNodes[offset - 1];
          if (prevNode && prevNode.nodeType === Node.ELEMENT_NODE) {
            const prevElement = prevNode as HTMLElement;
            if (prevElement.hasAttribute("data-image-raw")) {
              imageBlock = prevElement;
            }
          }
        }
      } else if (container.nodeType === Node.TEXT_NODE && offset === 0) {
        const prevSibling = container.previousSibling;
        if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE) {
          const prevElement = prevSibling as HTMLElement;
          if (prevElement.hasAttribute("data-image-raw")) {
            imageBlock = prevElement;
          }
        }
      }

      if (imageBlock) {
        e.preventDefault();
        imageBlock.remove();
        updateContentFromEditor();
        return;
      }
    }

    onKeyDown?.(e);
  };

  useEffect(() => {
    updateEditorContent();
  }, [showImages]);

  useEffect(() => {
    if (editorRef.current) {
      onMount?.(); // ⭐ 여기서 mount 완료 시 알려줌
    }
  }, []);

  return (
    <div className="relative h-full w-full">
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className={`h-full w-full overflow-y-auto py-2 outline-none ${className}`}
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "16px",
          lineHeight: "26px",
          ...style,
        }}
      />
    </div>
  );
});

MarkdownImageEditor.displayName = "MarkdownImageEditor";

export default MarkdownImageEditor;
