"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import clsx from "clsx";

interface FakeTextareaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  showImages?: boolean; // ✅ 이미지 보기 토글
  className?: string;
  style?: React.CSSProperties;
}

export interface FakeTextareaHandle {
  value: string;
  focus: () => void;
}

/**
 * ✅ 이미지 보기 토글 지원형 FakeTextarea
 * - showImages=false → 텍스트 그대로
 * - showImages=true → ![]()만 <img>로 보여주지만 편집 가능
 */
const FakeTextarea = forwardRef<FakeTextareaHandle, FakeTextareaProps>(
  (
    {
      value = "",
      onChange,
      placeholder,
      readOnly = false,
      showImages = false,
      className,
      style,
    },
    ref,
  ) => {
    const divRef = useRef<HTMLDivElement>(null);

    // expose .value
    useImperativeHandle(ref, () => ({
      get value() {
        return divRef.current?.innerText || "";
      },
      set value(v: string) {
        if (divRef.current) {
          render(v);
        }
      },
      focus() {
        divRef.current?.focus();
      },
    }));

    // 렌더 함수
    const render = (text: string) => {
      if (!divRef.current) return;
      if (showImages) {
        const html = text
          .replace(
            /!\[(.*?)\]\((["']?)(.*?)\2\)/g,
            (_, alt, _q, url) =>
              `<span data-md="![${alt}](${url})" contenteditable="false" class="md-img">
                <img src="${url}" alt="${alt}" style="max-width:100%;border-radius:4px;display:block;margin:6px 0;"/>
              </span>`,
          )
          .replace(/\n/g, "<br>");
        divRef.current.innerHTML = html;
      } else {
        divRef.current.innerText = text;
      }
    };

    // 초기 렌더 / showImages 토글 반응
    useEffect(() => {
      render(value);
    }, [value, showImages]);

    // 입력 이벤트
    const handleInput = () => {
      const newValue = extractMarkdown(divRef.current);
      onChange?.(newValue);
    };

    // 원본 추출
    const extractMarkdown = (root: HTMLElement | null): string => {
      if (!root) return "";
      let result = "";
      root.childNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) result += n.textContent;
        else if (n.nodeType === Node.ELEMENT_NODE) {
          const el = n as HTMLElement;
          if (el.dataset.md) result += el.dataset.md;
          else if (el.tagName === "BR") result += "\n";
          else result += extractMarkdown(el);
        }
      });
      return result;
    };

    // Backspace 시 이미지 통째 삭제
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (showImages && (e.key === "Backspace" || e.key === "Delete")) {
        const sel = window.getSelection();
        const node = sel?.anchorNode?.parentElement;
        if (node?.classList.contains("md-img")) {
          e.preventDefault();
          node.remove();
          handleInput();
        }
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        document.execCommand("insertHTML", false, "\n");
      }
    };

    return (
      <div
        ref={divRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        spellCheck={false}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder || ""}
        className={clsx(
          "fake-textarea scrollbar",
          readOnly && "cursor-default opacity-70",
          className,
        )}
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          outline: "none",
          ...style,
        }}
      />
    );
  },
);

FakeTextarea.displayName = "FakeTextarea";
export default FakeTextarea;
