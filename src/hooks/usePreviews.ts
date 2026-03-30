import { useEffect, useState } from "react";
import { fetchPreviewTextById } from "@/lib/explorer-api";
import type { PreviewTarget } from "@/types/explorer";

interface UsePreviewParams {
  onAfterOpen?: () => void;
}

export default function usePreview({ onAfterOpen }: UsePreviewParams = {}) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const openPreviewFile = (fileId: string, title: string) => {
    setPreviewTarget({ id: fileId, title });
    setIsPreviewMode(true);
    onAfterOpen?.();
  };

  const closePreview = () => {
    setIsPreviewMode(false);
    setPreviewTarget(null);
    setPreviewContent("");
  };

  useEffect(() => {
    const fetchPreviewContent = async () => {
      if (!previewTarget?.id) return;

      setIsPreviewLoading(true);
      setPreviewContent("");

      try {
        const final = await fetchPreviewTextById(previewTarget.id);

        if (final.data && final.data.length > 0) {
          const file = final.data[0];
          const res = await fetch(file.path);
          const text = await res.text();
          setPreviewContent(text);
        } else {
          setPreviewContent("해당 문서를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error(error);
        setPreviewContent("시스템 오류가 발생하여 내용을 불러올 수 없습니다.");
      } finally {
        setIsPreviewLoading(false);
      }
    };

    fetchPreviewContent();
  }, [previewTarget?.id]);

  return {
    isPreviewMode,
    setIsPreviewMode,
    previewTarget,
    setPreviewTarget,
    previewContent,
    isPreviewLoading,
    openPreviewFile,
    closePreview,
  };
}
