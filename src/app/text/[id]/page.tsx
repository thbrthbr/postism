"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { ref as storageRef, uploadString } from "firebase/storage";
import { storage } from "@/firebase/firebaseConfig";
import { FaArrowLeft, FaArrowDown, FaRegSave } from "react-icons/fa";
import Spinner from "@/components/spinner";
import { LuDownload } from "react-icons/lu";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import Swal from "sweetalert2";
import Menu from "@/components/menu";
import CodeEditor from "@/components/CodeEditor";
import { useMonaco } from "@monaco-editor/react";

declare global {
  interface Window {
    __theme: "light" | "dark" | "wood" | "pink";
    __onThemeChange: (theme: "light" | "dark" | "wood" | "pink") => void;
    __setPreferredTheme: (theme: "light" | "dark" | "wood" | "pink") => void;
  }
}

export default function Text() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();
  const param = useParams();
  const monaco = useMonaco();

  const editorRef = useRef<any>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const isMounted = useRef(false);

  const [path, setPath] = useState("");
  const [checkUser, setCheckUser] = useState<string>("");
  const [parentId, setParentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState("");
  const [txtTitle, setTxtTitle] = useState("");
  const [isMe, setIsMe] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "wood" | "pink">(
    "light",
  );
  const [location, setLocation] = useState({ x: -1, y: -1 });
  const [isMobile, setIsMobile] = useState(false);

  // ✅ 클라이언트에서만 모바일 여부 판별
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    setIsMobile(/Mobi|Android|iPhone|iPad/i.test(ua));
  }, []);

  // ✅ CSS 변수 읽기
  const getColorVar = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // ✅ 색상 포맷 정리 (#fff → #ffffff)
  const normalizeColor = (color: string) => {
    if (!color) return "#000000";
    const hex = color.replace("#", "").trim();
    if (hex.length === 3)
      return (
        "#" +
        hex
          .split("")
          .map((c) => c + c)
          .join("")
      );
    if (hex.length === 6) return "#" + hex;
    return color;
  };

  // ✅ Monaco 테마 정의
  const defineMonacoThemes = useCallback(() => {
    if (!monaco) return;

    const themes: ("light" | "dark" | "wood" | "pink")[] = [
      "light",
      "dark",
      "wood",
      "pink",
    ];

    for (const t of themes) {
      document.documentElement.dataset.theme = t;

      const bg = normalizeColor(getColorVar("--color-bg-primary"));
      const fg = normalizeColor(getColorVar("--color-primary"));

      monaco.editor.defineTheme(t, {
        base: t === "dark" ? "vs-dark" : "vs",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": bg,
          "editor.foreground": fg,
          "editorLineNumber.foreground": fg + "55",
          "editorLineNumber.activeForeground": fg,
          "editor.lineHighlightBackground": fg + "15",
          "editor.selectionBackground": fg + "66",
          "editor.selectionHighlightBackground": fg + "55",
          "editorCursor.foreground": fg,
        },
      });
    }

    document.documentElement.dataset.theme = window.__theme || "light";
  }, [monaco]);

  // ✅ 테마 동기화
  useEffect(() => {
    if (!monaco || typeof window === "undefined") return;
    defineMonacoThemes();
    setTheme(window.__theme || "light");
    window.__onThemeChange = (newTheme) => {
      setTheme(newTheme);
      defineMonacoThemes();
    };
  }, [monaco, defineMonacoThemes]);

  // ✅ 파일 불러오기
  const getContent = async () => {
    if (!param) return;
    const result = await fetch(`/api/text/${param.id}`, { cache: "no-store" });
    const final = await result.json();

    if (final.data.length > 0) {
      const file = final.data[0];
      const res = await fetch(file.path);
      const text = await res.text();

      setPath(file.title);
      setTxtTitle(file.realTitle);
      setParentId(file.parentId || "0");
      setCheckUser(file.user);
      setOriginal(text);

      if (isMobile && textAreaRef.current) {
        textAreaRef.current.value = text;
      } else if (editorRef.current) {
        editorRef.current.setValue(text);
      }

      setLoading(false);
    } else {
      toast({
        variant: "destructive",
        title: "알림",
        description: "해당 문서는 존재하지 않습니다",
      });
      router.push("/");
    }
  };

  // ✅ 현재 내용 가져오기 (PC/모바일 공통)
  const getCurrentContent = () => {
    if (isMobile) return textAreaRef.current?.value || "";
    if (editorRef.current) return editorRef.current.getValue();
    return "";
  };

  // ✅ 저장
  const editTXT = useCallback(async () => {
    const content = getCurrentContent();
    if (!isMe) {
      toast({
        title: "알림",
        description: "수정권한이 없습니다",
      });
      return;
    }
    const fileRef = storageRef(storage, `texts/${path}.txt`);
    await uploadString(fileRef, content, "raw", {
      contentType: "text/plain;charset=utf-8",
    });
    setOriginal(content);
    toast({ title: "알림", description: "저장되었습니다" });
  }, [path, isMe]);

  // ✅ Ctrl+S 저장
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        editTXT();
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [editTXT]);

  // ✅ mount 시 최초 데이터 로드
  useEffect(() => {
    if (!isMounted.current) {
      getContent();
      isMounted.current = true;
    }
  }, []);

  // ✅ 권한 체크
  useEffect(() => {
    if (checkUser === session?.user?.email) setIsMe(true);
  }, [checkUser, session?.user?.email]);

  // ✅ Monaco Editor mount 시 ref 연결
  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  // ✅ Tab 입력 (textarea 전용)
  const handleTabKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const target = event.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const tabSpace = "  ";

      const before = target.value.slice(0, start);
      const after = target.value.slice(end);
      target.value = before + tabSpace + after;

      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + tabSpace.length;
      });
    }
  };

  // ✅ 뒤로가기
  const handleBack = () => {
    const current = getCurrentContent();
    if (current !== original) {
      Swal.fire({
        title: "내용이 변경되었습니다",
        html: "<div>변경사항을 저장하지 않고</div><div>페이지를 이탈하시겠습니까?</div>",
        icon: "warning",
        customClass: { title: "text-xl" },
        showCancelButton: true,
        confirmButtonText: "확인",
        cancelButtonText: "취소",
      }).then((result) => {
        if (result.isConfirmed) {
          if (parentId === "0") router.push("/");
          else router.push(`/folder/${parentId}`);
        }
      });
    } else {
      if (parentId === "0") router.push("/");
      else router.push(`/folder/${parentId}`);
    }
  };

  // ✅ 맨 아래로 스크롤
  const scrollToBottom = () => {
    if (isMobile && textAreaRef.current) {
      textAreaRef.current.scrollTo({
        top: textAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
      return;
    }
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;
    editor.revealLine(model.getLineCount());
  };

  return (
    <div
      className="relative flex h-screen w-full flex-col"
      onContextMenu={(e) => {
        if (isMobile) return;
        e.preventDefault();
        setLocation({ x: e.pageX, y: e.pageY });
      }}
      onClick={() => setLocation({ x: -1, y: -1 })}
    >
      {location.x !== -1 && <Menu location={location} type="inFile" />}

      {loading && (
        <div
          style={{ backgroundColor: "var(--color-bg-primary)" }}
          className="absolute z-50 flex h-screen w-full items-center justify-center text-white"
        >
          <Spinner />
        </div>
      )}

      {/* 상단 메뉴바 */}
      <div className="flex w-full items-center justify-center gap-16 px-1 py-3">
        {isMe && (
          <>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleBack}
            >
              <FaArrowLeft />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={editTXT}>
              <FaRegSave />
            </button>
          </>
        )}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const content = getCurrentContent();
            const blob = new Blob([content], { type: "text/plain" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${txtTitle}.txt`;
            a.click();
            window.URL.revokeObjectURL(url);
          }}
        >
          <LuDownload className="font-bold" />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={scrollToBottom}
        >
          <FaArrowDown />
        </button>
      </div>

      {/* 본문: PC는 Monaco, 모바일은 textarea */}
      {isMobile ? (
        <textarea
          ref={textAreaRef}
          spellCheck={false}
          readOnly={!isMe}
          onKeyDown={handleTabKey}
          className="scrollbar relative m-4 h-full resize-none overflow-y-scroll outline-none"
          style={{
            transition: "background-color 0.7s ease",
            backgroundColor: "var(--color-bg-primary)",
          }}
        />
      ) : (
        <div
          className="relative m-4 flex-1 overflow-hidden rounded-md"
          style={{
            transition: "background-color 0.7s ease",
            backgroundColor: "var(--color-bg-primary)",
          }}
        >
          <CodeEditor
            value={original}
            readOnly={!isMe}
            theme={theme}
            onMount={handleEditorMount}
          />
        </div>
      )}
    </div>
  );
}
