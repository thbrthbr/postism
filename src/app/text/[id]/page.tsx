"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { ref, uploadString } from "firebase/storage";
import { storage } from "@/firebase/firebaseConfig";
import { FaArrowDown, FaRegSave } from "react-icons/fa";
import Spinner from "@/components/spinner";
import { LuDownload } from "react-icons/lu";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import CodeEditor from "@/components/CodeEditor";
import { useMonaco } from "@monaco-editor/react"; // ✅ OnChange 불필요

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

  // 🔹 현재 CSS 변수값 읽기
  const getColorVar = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // 🔹 Monaco 테마 정의
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

      const bg = getColorVar("--color-bg-primary");
      const fg = getColorVar("--color-primary");

      monaco.editor.defineTheme(t, {
        base: t === "dark" || t === "wood" ? "vs-dark" : "vs",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": bg,
          "editor.foreground": fg,
          "editor.lineHighlightBackground": `${fg}20`,
          "editor.selectionBackground": `${fg}33`,
          "editorCursor.foreground": fg,
        },
      });
    }

    // 원래 테마 복구
    document.documentElement.dataset.theme = window.__theme || "light";
  }, [monaco]);

  // 🔹 테마 동기화
  useEffect(() => {
    if (!monaco || typeof window === "undefined") return;
    defineMonacoThemes();
    setTheme(window.__theme || "light");
    window.__onThemeChange = (newTheme) => {
      setTheme(newTheme);
      defineMonacoThemes();
    };
  }, [monaco, defineMonacoThemes]);

  // 🔹 파일 불러오기
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

  // 🔹 저장
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

  // 🔹 Ctrl+S 저장 단축키
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

  // 🔹 mount
  useEffect(() => {
    getContent();
  }, []);

  // 🔹 권한
  useEffect(() => {
    if (checkUser === session?.user?.email) setIsMe(true);
  }, [checkUser, session?.user?.email]);

  // 🔹 에디터 마운트 시 ref 저장
  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  // 🔹 변경 감지
  const handleChange = (val?: string) => {
    if (val !== undefined) setValue(val);
  };

  return (
    <div className="relative flex h-screen w-full flex-col">
      {loading && (
        <div
          style={{ backgroundColor: "var(--color-bg-primary)" }}
          className="absolute z-50 flex h-screen w-full items-center justify-center text-white"
        >
          <Spinner />
        </div>
      )}
      <div className="flex justify-center gap-16 px-1 py-3">
        {isMe && (
          <button onClick={editTXT}>
            <FaRegSave />
          </button>
        )}
        <button
          onClick={() => {
            const blob = new Blob([value], { type: "text/plain" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${txtTitle}.txt`;
            a.click();
          }}
        >
          <LuDownload />
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

      {/* ✅ 코드 에디터 */}
      <CodeEditor
        value={value}
        onChange={handleChange}
        readOnly={!isMe}
        theme={theme}
      />
    </div>
  );
}
