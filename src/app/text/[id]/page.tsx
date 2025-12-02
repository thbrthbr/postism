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

export default function Text() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();
  const param = useParams();
  const contentRef = useRef<any>(null);
  const isMounted = useRef<any>(null);
  const [path, setPath] = useState("");
  const [checkUser, setCheckUser] = useState<string>("");
  const [parentId, setParentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState("");
  const [txtTitle, setTxtTitle] = useState("");
  const [isMe, setIsMe] = useState(false);
  const [location, setLocation] = useState({ x: -1, y: -1 });

  const getContent = async () => {
    if (param) {
      const result = await fetch(`/api/text/${param.id}`, {
        method: "GET",
        cache: "no-store",
      });
      const final = await result.json();
      if (final.data.length > 0) {
        const path = final.data[0].path;
        const response = await fetch(path);
        const textContent = await response.text();
        setParentId(final.data[0].parentId || "0");
        setOriginal(textContent);
        setPath(final.data[0].title);
        if (contentRef.current) {
          setCheckUser(final.data[0].user);
          contentRef.current.value = textContent;
          setLoading(false);
        }
        setTxtTitle(final.data[0].realTitle);
      } else {
        toast({
          variant: "destructive",
          title: "알림",
          description: "해당 문서는 존재하지 않습니다",
        });
        router.push("/");
      }
    }
  };

  const downloadTXT = (e: any) => {
    Swal.fire({
      title: "다운로드",
      text: "텍스트 파일을 다운로드 하시겠습니까?",
      showCancelButton: true,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
    }).then((result) => {
      if (result.isConfirmed && contentRef.current) {
        const blob = new Blob([contentRef.current.value], {
          type: "text/plain",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.download = `${txtTitle}.txt`;
        a.href = url;
        a.click();
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      }
    });
  };

  const editTXT = useCallback(async () => {
    if (contentRef.current && isMe) {
      const fileRef = ref(storage, `texts/${path}.txt`);
      await uploadString(fileRef, contentRef.current.value, "raw", {
        contentType: "text/plain;charset=utf-8",
      });
      toast({
        title: "알림",
        description: "저장되었습니다",
      });
      setOriginal(contentRef.current.value);
    } else if (!isMe) {
      toast({
        title: "알림",
        description: "수정권한이 없습니다",
      });
    }
  }, [path, isMe]);

  const handleSaveShortcut = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey && (event.key === "s" || event.key === "S")) {
        event.preventDefault();
        editTXT();
      }
    },
    [editTXT],
  );

  const handleTabKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const target = event.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const tabSpace = "  ";
      target.focus();
      document.execCommand("insertText", false, `${tabSpace}`);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + tabSpace.length;
      }, 0);
    }
  };

  const handleBack = () => {
    if (!contentRef.current) return;
    if (contentRef.current.value !== original) {
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

  // 🔹 한글 입력 렉 방지용 composition 이벤트 추가
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const handleCompositionStart = () => {
      // 한글 조합 시작 시 브라우저 reflow 최소화
      el.style.willChange = "none";
      el.style.contain = "paint";
    };

    const handleCompositionEnd = () => {
      // 한글 조합 끝나면 원상 복귀
      el.style.willChange = "transform";
      el.style.contain = "layout paint";
    };

    el.addEventListener("compositionstart", handleCompositionStart);
    el.addEventListener("compositionend", handleCompositionEnd);

    return () => {
      el.removeEventListener("compositionstart", handleCompositionStart);
      el.removeEventListener("compositionend", handleCompositionEnd);
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) {
      getContent();
      isMounted.current = true;
    }
  }, []);

  useEffect(() => {
    if (contentRef.current && checkUser === session?.user?.email) {
      setIsMe(true);
      contentRef.current.readOnly = false;
    }
  }, [checkUser]);

  useEffect(() => {
    document.addEventListener("keydown", handleSaveShortcut);
    return () => document.removeEventListener("keydown", handleSaveShortcut);
  }, [handleSaveShortcut]);

  return (
    <div
      className="relative flex h-screen w-full flex-col"
      onContextMenu={(e) => {
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
            <button onClick={handleBack}>
              <FaArrowLeft />
            </button>
            <button onClick={editTXT}>
              <FaRegSave />
            </button>
          </>
        )}
        <button onClick={downloadTXT}>
          <LuDownload className="font-bold" />
        </button>
        <button
          onClick={() =>
            contentRef.current?.scrollTo({
              top: contentRef.current.scrollHeight,
            })
          }
        >
          <FaArrowDown />
        </button>
      </div>

      <div
        className="relative m-4 flex h-screen flex-col"
        style={{
          transition: "background-color 0.7s ease",
          backgroundColor: "var(--color-bg-primary)",
        }}
      >
        <textarea
          ref={contentRef}
          readOnly
          spellCheck={false}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onKeyDown={handleTabKey}
          className="scrollbar flex-1 resize-none overflow-auto bg-transparent outline-none"
          style={{
            willChange: "transform",
            contain: "layout paint",
            backfaceVisibility: "hidden",
          }}
        ></textarea>
      </div>
    </div>
  );
}
