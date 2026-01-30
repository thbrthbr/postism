"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { ref as storageRef, uploadString } from "firebase/storage";
import { storage } from "@/firebase/firebaseConfig";
import { FaArrowLeft, FaArrowDown, FaRegSave } from "react-icons/fa";
import { MdImage } from "react-icons/md";
import Spinner from "@/components/spinner";
import { LuDownload } from "react-icons/lu";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import Swal from "sweetalert2";
import Menu from "@/components/menu";
import CodeEditor from "@/components/CodeEditor";
import MarkdownImageEditor, {
  MarkdownImageEditorRef,
} from "@/components/MarkdownImageEditor";
import { useMonaco } from "@monaco-editor/react";

declare global {
  interface Window {
    __theme: "light" | "dark" | "wood" | "pink";
    __onThemeChange: (theme: "light" | "dark" | "wood" | "pink") => void;
    __setPreferredTheme: (theme: "light" | "dark" | "wood" | "pink") => void;
  }
}

if (typeof window !== "undefined") {
  const origThen = Promise.prototype.then as any;

  Promise.prototype.then = function (onFulfilled: any, onRejected: any) {
    const safeRejected = (reason: any) => {
      if (
        reason &&
        typeof reason === "object" &&
        reason.type === "cancelation"
      ) {
        return; // cancellation 완전 무시
      }
      if (onRejected) return onRejected(reason);
    };

    return origThen.call(this, onFulfilled, safeRejected) as any;
  };

  window.addEventListener("unhandledrejection", (event) => {
    const r = event.reason;
    if (r && typeof r === "object" && r.type === "cancelation") {
      event.preventDefault(); // dev overlay 에러 차단
    }
  });
}

export default function Text() {
  const [clientReady, setClientReady] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();
  const param = useParams();
  const monaco = useMonaco();

  const editorRef = useRef<any>(null);
  const markdownEditorRef = useRef<MarkdownImageEditorRef | null>(null);
  const originalRef = useRef<string>("");
  const isMounted = useRef(false);

  const [path, setPath] = useState("");
  const [checkUser, setCheckUser] = useState<string>("");
  const [parentId, setParentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [txtTitle, setTxtTitle] = useState("");
  const [isMe, setIsMe] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "wood" | "pink">(
    "light",
  );
  const [location, setLocation] = useState({ x: -1, y: -1 });
  const [isMobile, setIsMobile] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [showTitle, setShowTitle] = useState("");

  // 🔹 PC에서 Monaco가 사용하는 내용
  const [content, setContent] = useState("");

  // 모바일 판별
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    setIsMobile(mobile);
    setClientReady(true);
  }, []);

  // cancelation 에러만 씹기
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (
        reason &&
        typeof reason === "object" &&
        (reason as any).type === "cancelation"
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handler);
    return () => {
      window.removeEventListener("unhandledrejection", handler);
    };
  }, []);

  // CSS 변수
  const getColorVar = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

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

  // 테마 정의
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
          "editor.background": "#00000000",
          "editor.foreground": fg,
          "editor.lineHighlightBackground": fg + "15",
          "editor.selectionBackground": fg + "66",
          "editor.selectionHighlightBackground": fg + "55",
          "editorCursor.foreground": fg,
          "scrollbarSlider.background": fg + "33", // 기본
          "scrollbarSlider.hoverBackground": fg + "66", // hover 시
          "scrollbarSlider.activeBackground": fg + "99", // 드래그 중
        },
      });
    }
    document.documentElement.dataset.theme = window.__theme || "light";
  }, [monaco]);

  // 테마 동기화
  useEffect(() => {
    if (!monaco || typeof window === "undefined") return;
    defineMonacoThemes();
    setTheme(window.__theme || "light");
    window.__onThemeChange = (newTheme) => {
      setTheme(newTheme);
      defineMonacoThemes();
    };
  }, [monaco, defineMonacoThemes]);

  // 파일 불러오기
  const getContent = async () => {
    if (!param) return;
    const result = await fetch(`/api/text/${param.id}`, { cache: "no-store" });
    const final = await result.json();
    if (final.data.length === 0) {
      toast({
        variant: "destructive",
        title: "알림",
        description: "해당 문서는 존재하지 않습니다",
      });
      router.push("/");
      return;
    }

    const file = final.data[0];
    const res = await fetch(file.path);
    const text = await res.text();

    setShowTitle(file.realTitle);
    setPath(file.title);
    setTxtTitle(file.realTitle);
    setParentId(file.parentId || "0");
    setCheckUser(file.user);

    originalRef.current = text;
    setContent(text);
    setLoading(false);
  };

  // 🔹 현재 내용 가져오기 (모바일 + 이미지 모드일 땐 MarkdownImageEditor에서)
  const getCurrentContent = () => {
    if ((isMobile || showImages) && markdownEditorRef.current) {
      return markdownEditorRef.current.getValue();
    }
    return content;
  };

  // 저장
  const editTXT = useCallback(async () => {
    const current = getCurrentContent();
    if (!isMe) {
      toast({ title: "알림", description: "수정권한이 없습니다" });
      return;
    }

    const fileRef = storageRef(storage, `texts/${path}.txt`);
    await uploadString(fileRef, current, "raw", {
      contentType: "text/plain;charset=utf-8",
    });

    originalRef.current = current;
    toast({ title: "알림", description: "저장되었습니다" });
  }, [path, isMe, content, isMobile, showImages]);

  // Ctrl+S 저장
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

  // 최초 로드
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      getContent();
    }
  }, []);

  // 권한 체크
  useEffect(() => {
    if (checkUser === session?.user?.email) {
      setIsMe(true);
      setShowImages(false);
    } else {
      setShowImages(true);
    }
  }, [checkUser, session?.user?.email]);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  // 🔹 MarkdownImageEditor mount 시 초기 값 주입 (모바일 + PC 공통)
  const handleMarkdownMount = () => {
    if (!markdownEditorRef.current) return;

    // 우선순위: 아직 편집 안 했으면 originalRef → 이미 Monaco 편집했으면 content
    const base = originalRef.current || content;
    markdownEditorRef.current.setValue(base);
  };

  // 뒤로가기
  const handleBack = () => {
    const current = getCurrentContent();
    if (current !== originalRef.current) {
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

  const scrollToBottom = () => {
    if ((isMobile || showImages) && markdownEditorRef.current) {
      const editorElement = document.querySelector('[contenteditable="true"]');
      if (editorElement) {
        (editorElement as HTMLElement).scrollTo({
          top: editorElement.scrollHeight,
          behavior: "smooth",
        });
      }
      return;
    }
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;
    editor.revealLine(model.getLineCount());
  };

  // 🔹 이미지 보기 토글
  const toggleImageView = () => {
    // 모바일은 어차피 항상 MarkdownImageEditor만 쓰므로 단순 토글
    if (isMobile) {
      setShowImages((prev) => !prev);
      return;
    }

    // PC에서는 showImages true일 때 Markdown → false일 때 Monaco로 돌아가면서 내용 sync
    setShowImages((prev) => {
      if (prev) {
        // 이미지 모드 → 텍스트 모드로 돌아갈 때, Markdown 내용 → content로 sync
        if (markdownEditorRef.current) {
          const text = markdownEditorRef.current.getValue();
          setContent(text);
        }
      }
      return !prev;
    });
  };

  useEffect(() => {
    if (!markdownEditorRef.current) return;
    if (loading) return;

    const base = originalRef.current || content;
    markdownEditorRef.current.setValue(base);
  }, [loading, content, showImages]);

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
            const current = getCurrentContent();
            const blob = new Blob([current], { type: "text/plain" });
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

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleImageView}
          style={{
            color: showImages ? "red" : "var(--color-primary)",
          }}
        >
          <MdImage className="text-xl" />
        </button>
      </div>
      <div className="w-full text-center italic text-gray-500">
        {showTitle}.txt
      </div>

      {/* 🔹 모바일이거나, 이미지 보기 모드일 때는 MarkdownImageEditor 사용 */}
      {isMobile || showImages ? (
        <div className="m-4 h-full overflow-hidden">
          <MarkdownImageEditor
            ref={markdownEditorRef}
            readOnly={!isMe}
            showImages={showImages}
            className="scrollbar"
            style={{
              transition: "background-color 0.7s ease",
              backgroundColor: "var(--color-bg-primary)",
            }}
            onMount={handleMarkdownMount}
          />
        </div>
      ) : (
        // 🔹 PC + 텍스트 모드일 때만 Monaco CodeEditor 사용
        <div
          className="relative m-4 flex-1 overflow-hidden rounded-md"
          style={{
            transition: "background-color 0.7s ease",
            backgroundColor: "var(--color-bg-primary)",
          }}
        >
          <CodeEditor
            readOnly={!isMe}
            theme={theme}
            value={content}
            onChange={(val) => setContent(val)}
            onMount={handleEditorMount}
          />
        </div>
      )}
    </div>
  );
}
