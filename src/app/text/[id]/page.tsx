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
  const isMounted = useRef<boolean>(false);

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

  // ===== CSS 변수 읽기 & 색상 정규화 =====
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

  // ===== Monaco 테마 정의 (light/dark/wood/pink 전부) =====
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
          "editor.selectionBackground": fg + "55",
          "editorCursor.foreground": fg,
        },
      });
    }

    // 원래 테마 복귀
    document.documentElement.dataset.theme = window.__theme || "light";
  }, [monaco]);

  // ===== 테마 동기화 =====
  useEffect(() => {
    if (!monaco || typeof window === "undefined") return;
    defineMonacoThemes();
    setTheme(window.__theme || "light");
    window.__onThemeChange = (newTheme) => {
      setTheme(newTheme);
      defineMonacoThemes();
    };
  }, [monaco, defineMonacoThemes]);

  // ===== 파일 불러오기 (원래 로직 그대로) =====
  const getContent = async () => {
    if (!param) return;
    const result = await fetch(`/api/text/${param.id}`, {
      method: "GET",
      cache: "no-store",
    });
    const final = await result.json();
    if (final.data.length > 0) {
      const file = final.data[0];
      const response = await fetch(file.path);
      const textContent = await response.text();
      setParentId(file.parentId || "0");
      setOriginal(textContent);
      setPath(file.title);
      setCheckUser(file.user);
      setTxtTitle(file.realTitle);
      setValue(textContent); // textarea.value 대신 상태로 관리
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

  // ===== 저장 (원래 editTXT 로직, textarea → value 사용) =====
  const editTXT = useCallback(async () => {
    if (!isMe) {
      toast({
        title: "알림",
        description: "수정권한이 없습니다",
      });
      return;
    }
    const content = editorRef.current ? editorRef.current.getValue() : value; // 혹시 모를 경우 대비

    const fileRef = ref(storage, `texts/${path}.txt`);
    await uploadString(fileRef, content, "raw", {
      contentType: "text/plain;charset=utf-8",
    });
    toast({
      title: "알림",
      description: "저장되었습니다",
    });
    setOriginal(content);
  }, [isMe, path, value, toast]);

  // ===== Ctrl+S 단축키 (원래 handleSaveShortcut) =====
  useEffect(() => {
    const fn = (event: KeyboardEvent) => {
      if (event.ctrlKey && (event.key === "s" || event.key === "S")) {
        event.preventDefault();
        editTXT();
      }
    };
    document.addEventListener("keydown", fn);
    return () => {
      document.removeEventListener("keydown", fn);
    };
  }, [editTXT]);

  // ===== mount 시 최초 1회 콘텐츠 로드 =====
  useEffect(() => {
    if (!isMounted.current) {
      getContent();
      isMounted.current = true;
    }
  }, []);

  // ===== 권한 체크 (원래 checkUser === session.email 로직) =====
  useEffect(() => {
    if (checkUser === session?.user?.email) {
      setIsMe(true);
    }
  }, [checkUser, session?.user?.email]);

  // ===== 뒤로가기 (원래 handleBack 로직, textarea → editorRef/value) =====
  const handleBack = () => {
    const current = editorRef.current ? editorRef.current.getValue() : value;

    if (current !== original) {
      Swal.fire({
        title: "내용이 변경되었습니다",
        html: "<div>변경사항을 저장하지 않고</div> <div>페이지를 이탈하시겠습니까?</div>",
        icon: "warning",
        customClass: {
          title: "text-xl",
        },
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

  // ===== Editor mount 시 인스턴스 ref에 연결 =====
  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  // ===== Editor 내용 변경시 value 업데이트 =====
  const handleChange = (val: string) => {
    setValue(val);
  };

  return (
    <div
      className="relative flex h-screen w-full flex-col"
      onContextMenu={(e) => {
        e.preventDefault();
        setLocation({
          x: e.pageX,
          y: e.pageY,
        });
      }}
      onClick={(e) => {
        e.preventDefault();
        setLocation({
          x: -1,
          y: -1,
        });
      }}
    >
      {/* 우클릭 메뉴 (원래 그대로) */}
      {location.x !== -1 && <Menu location={location} type="inFile" />}

      {/* 로딩 오버레이 (원래 그대로) */}
      {loading && (
        <div
          style={{ backgroundColor: "var(--color-bg-primary)" }}
          className="absolute z-50 flex h-screen w-full items-center justify-center text-white"
        >
          <Spinner />
        </div>
      )}

      {/* 상단 메뉴바 – 원래 버튼들 전부 유지 */}
      <div className="flex w-full items-center justify-center gap-16 px-1 py-3">
        {isMe && (
          <>
            <button onClick={handleBack}>
              <FaArrowLeft />
            </button>
            <button onClick={editTXT}>
              <FaRegSave />
            </button>
          </>
        )}
        <button
          onClick={() => {
            const blob = new Blob([value], {
              type: "text/plain",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.download = `${txtTitle}.txt`;
            a.href = url;
            a.click();
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 100);
          }}
        >
          <LuDownload className="font-bold" />
        </button>
        <button
          onClick={() => {
            const editor = editorRef.current;
            if (!editor) return;
            const model = editor.getModel();
            editor.revealLine(model.getLineCount());
          }}
        >
          <FaArrowDown />
        </button>
      </div>

      {/* textarea → CodeEditor로 교체 (기능만 바뀜) */}
      <div
        className="relative m-4 flex-1 overflow-hidden rounded-md"
        style={{
          transition: "background-color 0.7s ease",
          backgroundColor: "var(--color-bg-primary)",
          WebkitUserSelect: "text", // ✅ iOS에서 텍스트 드래그 허용
          userSelect: "text", // ✅ 안드로이드에서도 허용
        }}
      >
        <CodeEditor
          value={value}
          onChange={handleChange}
          readOnly={!isMe}
          theme={theme}
          onMount={handleEditorMount}
        />
      </div>
    </div>
  );
}
