import { useState } from "react";
import JSZip from "jszip";
import { appSwal, icons } from "@/lib/swal";
import {
  addFilesToZipFolder,
  addFolderRecursivelyToZip,
  triggerDownloadBlob,
} from "@/lib/explorer-download";
import { makeUniqueName } from "@/lib/explorer-utils";
import type { SelectedItem } from "@/types/explorer";

interface UseDownloadParams {
  sessionEmail?: string | null;
  selectedItems: SelectedItem[];
  datas: any[];
  folders: any[];
  toast: (args: { title: string; description: string }) => void;
}

export default function useDownload({
  sessionEmail,
  selectedItems,
  datas,
  folders,
  toast,
}: UseDownloadParams) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");

  const downloadSelectedItems = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "알림",
        description: "선택된 항목이 없습니다",
      });
      return;
    }

    if (!sessionEmail) {
      toast({
        title: "알림",
        description: "로그인 정보가 필요합니다",
      });
      return;
    }

    const result = await appSwal.fire({
      title: "다운로드 확인",
      text: `${selectedItems.length}개 항목을 다운로드하시겠습니까?`,
      icon: icons.question.icon,
      iconColor: icons.question.color,
      showCancelButton: true,
      confirmButtonText: "다운로드",
      cancelButtonText: "취소",
    });

    if (!result.isConfirmed) return;

    setIsDownloading(true);
    setDownloadMessage("선택된 항목을 준비하는 중...");

    try {
      const selectedFiles = selectedItems.filter(
        (item) => item.type === "file",
      );
      const selectedFolders = selectedItems.filter(
        (item) => item.type === "folder",
      );

      const isSinglePlainFileDownload =
        selectedFiles.length === 1 && selectedFolders.length === 0;

      if (isSinglePlainFileDownload) {
        const fileItem = selectedFiles[0];
        const fileData = datas.find((data: any) => data.id === fileItem.id);

        if (!fileData?.path) {
          throw new Error("파일 정보를 찾을 수 없습니다");
        }

        setDownloadMessage("파일을 다운로드하는 중...");
        const response = await fetch(fileData.path, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`파일 다운로드 실패: ${fileData.realTitle}`);
        }

        const blob = await response.blob();
        triggerDownloadBlob(blob, `${fileData.realTitle}.txt`);

        toast({
          title: "알림",
          description: "파일을 다운로드했습니다",
        });

        return;
      }

      setDownloadMessage("선택된 항목을 압축하는 중...");
      const zip = new JSZip();

      await addFilesToZipFolder(
        zip,
        selectedFiles
          .map((item) => datas.find((data: any) => data.id === item.id))
          .filter(Boolean),
      );

      const usedRootFolderNames = new Set<string>();

      for (const folderItem of selectedFolders) {
        const folderData = folders.find(
          (folder: any) => folder.id === folderItem.id,
        );

        const folderName = makeUniqueName(
          folderData?.realTitle || folderItem.title,
          usedRootFolderNames,
        );

        await addFolderRecursivelyToZip(
          zip,
          sessionEmail,
          folderItem.id,
          folderName,
        );
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });

      triggerDownloadBlob(zipBlob, `postism-${Date.now()}.zip`);

      toast({
        title: "알림",
        description: "선택한 항목들을 zip으로 다운로드했습니다",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "알림",
        description: "일괄 다운로드 중 오류가 발생했습니다",
      });
    } finally {
      setIsDownloading(false);
      setDownloadMessage("선택된 항목을 압축하는 중...");
    }
  };

  return {
    isDownloading,
    downloadMessage,
    downloadSelectedItems,
  };
}
