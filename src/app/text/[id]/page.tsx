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
import FastTextarea, { FastTextareaRef } from "@/components/FastTextArea"; // ✅ ref 타입도 함께 import

export default function Text() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();
  const param = useParams();

  // ✅ 타입 명시
  const contentRef = useRef<FastTextareaRef>(null);
  const isMounted = useRef(false);

  const [path, setPath] = useState("");
  const [checkUser, setCheckUser] = useState<string>("");
  const [parentId, setParentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState("");
  const [txtTitle, setTxtTitle] = useState("");
  const [isMe, setIsMe] = useState(false);
  const [location, setLocation] = useState({ x: -1, y: -1 });

  // 🔹 파일 내용 가져오기
  const getContent = async () => {
    if (!param) return;
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
      setTxtTitle(final.data[0].realTitle);
      setCheckUser(final.data[0].user);

      if (contentRef.current) {
        contentRef.current.value = textContent; // ✅ FastTextarea의 커스텀 value
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

  // 🔹 파일 다운로드
  const downloadTXT = () => {
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

  // 🔹 저장 기능
  const editTXT = useCallback(async () => {
    if (!contentRef.current) return;
    if (isMe) {
      const fileRef = ref(storage, `texts/${path}.txt`);
      await uploadString(fileRef, contentRef.current.value, "raw", {
        contentType: "text/plain;charset=utf-8",
      });
      toast({ title: "알림", description: "저장되었습니다" });
      setOriginal(contentRef.current.value);
    } else {
      toast({
        title: "알림",
        description: "수정권한이 없습니다",
      });
    }
  }, [path, isMe]);

  // 🔹 Ctrl+S 단축키 저장
  const handleSaveShortcut = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey && (event.key === "s" || event.key === "S")) {
        event.preventDefault();
        editTXT();
      }
    },
    [editTXT],
  );

  // 🔹 뒤로가기 확인
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

  // 🔹 mount 시 실행
  useEffect(() => {
    if (!isMounted.current) {
      getContent();
      isMounted.current = true;
    }
  }, []);

  // 🔹 권한 확인
  useEffect(() => {
    if (contentRef.current && checkUser === session?.user?.email) {
      setIsMe(true);
    }
  }, [checkUser]);

  // 🔹 단축키 이벤트 등록
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

      {/* 로딩 */}
      {loading && (
        <div
          style={{ backgroundColor: "var(--color-bg-primary)" }}
          className="absolute z-50 flex h-screen w-full items-center justify-center text-white"
        >
          <Spinner />
        </div>
      )}

      {/* 상단 버튼 */}
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
          onClick={() => {
            const el = contentRef.current;
            if (!el) return;
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          }}
        >
          <FaArrowDown />
        </button>
      </div>

      {/* ✅ textarea → FastTextarea 대체 */}
      <FastTextarea ref={contentRef} initialValue={original} />
    </div>
  );
}
