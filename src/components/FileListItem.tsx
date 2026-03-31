"use client";

import Heart from "@/components/Heart";
import CustomCheckbox from "@/components/CustomCheckbox";
import { FiFileText } from "react-icons/fi";
import { motion } from "framer-motion";
import SpinnerMini from "@/components/spinner-mini";

interface FileListItemProps {
  data: any;
  dataChecked: boolean;
  canManage: boolean;
  isPreviewMode: boolean;
  toggleSelectedItem: (item: {
    id: string;
    type: "file" | "folder";
    title: string;
    parentId: string;
  }) => void;
  setTestSwitch: React.Dispatch<React.SetStateAction<any>>;
  getMenuPositionInContent: (e: React.MouseEvent | MouseEvent) => {
    x: number;
    y: number;
  };
  openItemMenu: (
    x: number,
    y: number,
    id: string,
    fileType: string,
    parentId: string,
  ) => void;
  openPreviewFile: (fileId: string, title: string) => void;
  routerPushText: (textId: string) => void;
  idx: number;
  modSwitch: number;
  setCurrentDataId: React.Dispatch<React.SetStateAction<string>>;
  handleEditTitle: (e: React.MouseEvent, idx: number, inputId: string) => void;
  editTitle: (id: string, newTitle: string) => void;
  updateFileTitleDraft: (idx: number, value: string) => void;
}

export default function FileListItem({
  data,
  dataChecked,
  canManage,
  isPreviewMode,
  toggleSelectedItem,
  setTestSwitch,
  getMenuPositionInContent,
  openItemMenu,
  openPreviewFile,
  routerPushText,
  idx,
  modSwitch,
  setCurrentDataId,
  handleEditTitle,
  editTitle,
  updateFileTitleDraft,
}: FileListItemProps) {
  const inputId = data?.title.replace(":", "-");
  const isTemp = data.id === "temp";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{
        opacity: { duration: 0.18 },
        layout: { duration: 0.25 },
        y: { duration: 0.2 },
      }}
      className="flex w-full items-center justify-between rounded-lg border px-3 py-2"
      style={{
        borderColor: "var(--color-customBorder)",
        backgroundColor: "var(--color-bg-primary)",
        color: "var(--color-primary)",
      }}
      onClick={() => {
        if (isTemp) return;
        if (isPreviewMode) {
          openPreviewFile(data.id, data.realTitle);
          return;
        }
        routerPushText(data.id);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!canManage || isTemp) return;
        const pos = getMenuPositionInContent(e);
        openItemMenu(pos.x, pos.y, data.id, "file", data.parentId);
      }}
    >
      <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        <span className="text-lg">
          <FiFileText className="shrink-0 text-sm opacity-80 md:text-base" />
        </span>

        {isTemp ? (
          <div className="flex items-center gap-2">
            <SpinnerMini />
            <span className="truncate opacity-70">생성 중...</span>
          </div>
        ) : modSwitch === idx ? (
          <input
            id={inputId}
            className="w-full bg-transparent outline-none"
            value={data.realTitle}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
            onChange={(e) => {
              updateFileTitleDraft(idx, e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                editTitle(data.id, data.realTitle);
              }
            }}
          />
        ) : (
          <span
            className="cursor-text truncate"
            onClick={(e) => {
              e.stopPropagation();
              if (!canManage) return;
              if (isTemp) return;

              handleEditTitle(e, idx, inputId);
              setCurrentDataId(data.id);
            }}
          >
            {data.realTitle}
          </span>
        )}
      </div>

      <div
        className="flex shrink-0 items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {canManage && !isTemp && (
          <>
            <button
              type="button"
              onClick={() => {
                toggleSelectedItem({
                  id: data.id,
                  type: "file",
                  title: data.realTitle,
                  parentId: data.parentId,
                });
              }}
            >
              <CustomCheckbox
                checked={dataChecked}
                onChange={() =>
                  toggleSelectedItem({
                    id: data.id,
                    type: "file",
                    title: data.realTitle,
                    parentId: data.parentId,
                  })
                }
              />
            </button>
            <Heart data={data} liked={data.liked} setData={setTestSwitch} />
          </>
        )}
      </div>
    </motion.div>
  );
}
