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

export default function Text() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();
  const param = useParams();
  const contentRef = useRef<any>(null);
  const isMounted = useRef<any>(null);
  const [path, setPath] = useState("");
  const [checkUser, setCheckUser] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState("");
  const [txtTitle, setTxtTitle] = useState("");
  const [isMe, setIsMe] = useState(false); // 이 정도로 수정 가능하게 되어 있는데 이거 추후에 수정해야함

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
        // alert("해당 문서는 존재하지 않습니다");
        router.push("/");
      }
    }
  };

  const downloadTXT = (e: any) => {
    Swal.fire({
      // title: '알림',
      title: "다운로드",
      text: "텍스트 파일을 다운로드 하시겠습니까?",
      // icon: 'warning',
      showCancelButton: true,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
    }).then((result) => {
      if (result.isConfirmed) {
        if (contentRef.current) {
          const blob = new Blob([contentRef.current.value], {
            type: "text/plain",
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.download = txtTitle;
          a.href = url;
          a.click();
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 100);
        }
      }
    });
    // const willYou = window.confirm("텍스트 파일은 다운로드 하시겠습니까?");
    // if (willYou) {
    //   if (contentRef.current) {
    //     const blob = new Blob([contentRef.current.value], {
    //       type: "text/plain",
    //     });
    //     const url = window.URL.createObjectURL(blob);
    //     const a = document.createElement("a");
    //     a.download = txtTitle;
    //     a.href = url;
    //     a.click();
    //     setTimeout(() => {
    //       window.URL.revokeObjectURL(url);
    //     }, 100);
    //   }
    // }
  };

  const editTXT = useCallback(async () => {
    if (contentRef.current) {
      if (isMe) {
        // 여기서 다이렉트로 수정하는 건 별로임
        // 나중에 api를 하나 새로 만들고 api 요청할 때 jwt? 토큰? 을 검사해서 유효한 경우에만 아래 uploadString 요청을 보내야함
        const fileRef = ref(storage, `texts/${path}.txt`);
        await uploadString(fileRef, contentRef.current.value, "raw", {
          contentType: "text/plain;charset=utf-8",
        });
        // alert("저장되었습니다");
        toast({
          title: "알림",
          description: "저장되었습니다",
        });
        setOriginal(contentRef.current.value);
      } else {
        toast({
          title: "알림",
          description: "수정권한이 없습니다",
        });
        // alert("수정권한이 없습니다");
      }
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
      // execCommand 써야 tab한 것에 대한 컨트롤 z가 제대로 작동함 -> 바꿀 수 있으면 나중에 바꿔보자
      document.execCommand("insertText", false, `${tabSpace}`);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + tabSpace.length;
      }, 0);
    }
  };

  const handleBack = () => {
    if (contentRef.current) {
      if (contentRef.current.value !== original) {
        Swal.fire({
          title: "내용이 변경되었습니다",
          // text: "변경사항을 저장하지 않고 페이지를 이탈하시겠습니까?",
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
            router.push("/");
          }
        });
        // const confirm = window.confirm(
        //   "내용이 변경되었습니다. \n변경사항을 저장하지 않고 페이지를 이탈하시겠습니까?",
        // );
        // if (confirm) router.push("/");
      } else router.push("/");
    }
  };

  useEffect(() => {
    if (!isMounted.current) {
      getContent();
      isMounted.current = true;
    }
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      if (checkUser === session?.user?.email) {
        setIsMe(true);
        contentRef.current.readOnly = false;
      }
    }
  }, [checkUser]);

  useEffect(() => {
    document.addEventListener("keydown", handleSaveShortcut);
    return () => {
      document.removeEventListener("keydown", handleSaveShortcut);
    };
  }, [handleSaveShortcut]);

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
      <div className="flex w-full items-center justify-center gap-16 px-1 py-3">
        <button onClick={handleBack}>
          <FaArrowLeft />
        </button>
        <button onClick={editTXT}>
          <FaRegSave />
        </button>
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
      <textarea
        readOnly={true}
        ref={contentRef}
        onKeyDown={handleTabKey}
        className="scrollbar relative m-4 h-screen resize-none overflow-y-scroll outline-none"
      ></textarea>
    </div>
  );
}
