import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from "react";

// ✅ ref 타입 정의
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

    // 초기값 설정
    useEffect(() => {
      if (editableRef.current) editableRef.current.innerText = initialValue;
    }, [initialValue]);

    // 외부로 노출할 인터페이스
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
          // ✅ scrollHeight 노출
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

    const handleInput = () => {
      if (editableRef.current) setText(editableRef.current.innerText);
    };

    return (
      <div
        className="relative m-4 flex h-screen flex-col"
        style={{
          transition: "background-color 0.7s ease",
          backgroundColor: "var(--color-bg-primary)",
        }}
      >
        <div
          ref={editableRef}
          contentEditable
          onInput={handleInput}
          spellCheck={false}
          className="scrollbar flex-1 overflow-auto whitespace-pre-wrap break-words bg-transparent p-2 font-mono text-sm outline-none"
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
