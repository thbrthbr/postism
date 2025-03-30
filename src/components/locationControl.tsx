import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const locationControl = (
  contentRef: React.RefObject<HTMLTextAreaElement>,
  original: string,
) => {
  const router = useRouter();
  const originalRef = useRef(original); // 🔹 최신 original 값을 저장
  const isHandlingPopState = useRef(false); // 🔹 popstate 중복 실행 방지

  useEffect(() => {
    originalRef.current = original; // 🔹 original 값이 변경될 때마다 최신 값으로 업데이트
  }, [original]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // 이미 popstate가 처리 중이면 return
      if (isHandlingPopState.current) {
        router.back();
        return;
      }

      if (contentRef.current) {
        if (contentRef.current.value !== originalRef.current) {
          event.preventDefault(); // 기본 뒤로 가기 동작 막기

          // `window.confirm()` 사용하여 확인/취소 팝업 띄우기
          const confirmLeave = window.confirm(
            "변경사항이 저장되지 않을 수 있습니다.",
          );

          if (confirmLeave) {
            // 확인을 누르면 뒤로 가기
            isHandlingPopState.current = true;
            router.back();
          } else {
            // 취소 시 현재 페이지 유지
            isHandlingPopState.current = false;
            return;
          }
        } else {
          router.back(); // 내용이 변경되지 않았다면 바로 뒤로 가기
        }
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (contentRef.current) {
        if (contentRef.current.value !== originalRef.current) {
          event.preventDefault();
          event.returnValue = "";
        }
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [router, contentRef]);

  return null;
};

export default locationControl;
