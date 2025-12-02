"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { ref, uploadString } from "firebase/storage";
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
  const isMounted = useRef(false);

  const [path, setPath] = useState("");
  const [checkUser, setCheckUser] = useState<string>("");
  const [parentId, setParentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState("");
  const [txtTitle, setTxtTitle] = useState("");
  const [isMe, setIsMe] = useState(false);
  const [value, setValue] = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | "wood" | "pink">(
    "light",
  );
  const [location, setLocation] = useState({ x: -1, y: -1 });

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
          "editor.lineHighlightBackground": fg + "20",
          "editor.selectionBackground": fg + "33",
          "editorCursor.foreground": fg,
        },
      });
    }

    // 원래 테마 복귀
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
      setValue(text);
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

  // ✅ 저장
  const editTXT = useCallback(async () => {
    if (!editorRef.current || !isMe) return;
    const content = editorRef.current.getValue();
    const fileRef = ref(storage, `texts/${path}.txt`);
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

  // ✅ Editor mount 시 ref 연결
  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  // ✅ 내용 변경 핸들러
  const handleChange = (val?: string) => {
    if (val !== undefined) setValue(val);
  };

  // ✅ 뒤로가기
  const handleBack = () => {
    if (!editorRef.current) return;
    const current = editorRef.current.getValue();
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

  return (
    <div
      className="relative flex h-screen w-full flex-col"
      onContextMenu={(e) => {
        e.preventDefault();
        setLocation({ x: e.pageX, y: e.pageY });
      }}
      onClick={(e) => {
        e.preventDefault();
        setLocation({ x: -1, y: -1 });
      }}
    >
      {/* ✅ 우클릭 메뉴 */}
      {location.x !== -1 && <Menu location={location} type="inFile" />}

      {/* ✅ 로딩 오버레이 */}
      {loading && (
        <div
          style={{ backgroundColor: "var(--color-bg-primary)" }}
          className="absolute z-50 flex h-screen w-full items-center justify-center text-white"
        >
          <Spinner />
        </div>
      )}

      {/* ✅ 상단 메뉴바 */}
      <div className="flex w-full items-center justify-center gap-16 px-1 py-3">
        {isMe && (
          <>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleBack();
              }}
            >
              <FaArrowLeft />
            </button>

            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                editTXT();
              }}
            >
              <FaRegSave />
            </button>
          </>
        )}

        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            const blob = new Blob([value], { type: "text/plain" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${txtTitle}.txt`;
            a.click();
            window.URL.revokeObjectURL(url);
          }}
        >
          <LuDownload />
        </button>

        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            const editor = editorRef.current;
            if (!editor) return;
            const model = editor.getModel();
            editor.revealLine(model.getLineCount());
          }}
        >
          <FaArrowDown />
        </button>
      </div>

      {/* ✅ Monaco Code Editor */}
      <div
        className="relative m-4 flex-1 overflow-hidden rounded-md"
        style={{
          transition: "background-color 0.7s ease",
          backgroundColor: "var(--color-bg-primary)",
        }}
      >
        <CodeEditor
          value={value}
          onChange={handleChange}
          readOnly={!isMe}
          theme={theme}
        />
      </div>
    </div>
  );
}
