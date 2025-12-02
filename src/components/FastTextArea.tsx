import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
  KeyboardEvent,
} from "react";

// ✅ 외부로 노출할 ref 타입
export interface FastTextareaRef {
  value: string;
  scrollHeight: number;
  scrollTo: (xOrOptions?: number | ScrollToOptions, y?: number) => void;
}

interface Props {
  initialValue: string;
}

const FastTextarea = forwardRef<FastTextareaRef, Props>(
  ({ initialValue }, ref) => {
    const editableRef = useRef<HTMLDivElement>(null);
    const [text, setText] = useState(initialValue);

    useEffect(() => {
      if (editableRef.current) editableRef.current.innerText = initialValue;
    }, [initialValue]);

    useImperativeHandle(
      ref,
      (): FastTextareaRef => ({
        get value() {
          return editableRef.current?.innerText || "";
        },
        set value(v: string) {
          if (editableRef.current) editableRef.current.innerText = v;
        },
        get scrollHeight() {
          return editableRef.current?.scrollHeight ?? 0;
        },
        scrollTo(xOrOptions?: number | ScrollToOptions, y?: number) {
          if (!editableRef.current) return;
          if (typeof xOrOptions === "number") {
            editableRef.current.scrollTo(xOrOptions, y ?? 0);
          } else {
            editableRef.current.scrollTo(xOrOptions);
          }
        },
      }),
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        const tabNode = document.createTextNode("  ");
        range.insertNode(tabNode);
        range.setStartAfter(tabNode);
        range.setEndAfter(tabNode);
        sel.removeAllRanges();
        sel.addRange(range);
        setText(editableRef.current?.innerText || "");
      }
    };

    const handleInput = () => {
      if (editableRef.current) setText(editableRef.current.innerText);
    };

    return (
      <div
        className="relative m-4 flex flex-1"
        style={{
          transition: "background-color 0.7s ease",
          backgroundColor: "var(--color-bg-primary)",
        }}
      >
        <div
          ref={editableRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="scrollbar flex-1 overflow-auto whitespace-pre-wrap break-words bg-transparent p-2 font-mono text-[14px] leading-5 outline-none"
          style={{
            willChange: "transform",
            contain: "layout paint",
          }}
        />
      </div>
    );
  },
);

FastTextarea.displayName = "FastTextarea";
export default FastTextarea;
