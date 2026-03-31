"use client";

import { motion } from "framer-motion";
import { IoIosClose } from "react-icons/io";
import SpinnerMini from "@/components/spinner-mini";
import Heart from "@/components/Heart";
import CustomCheckbox from "@/components/CustomCheckbox";

interface FileCardProps {
  data: any;
  idx: number;
  dataChecked: boolean;
  modSwitch: number;
  sessionEmail?: string | null;
  owner?: string;
  pageId?: string;
  isPreviewMode: boolean;
  draggingFileId: string | null;
  folders: any[];
  setDraggingFileId: React.Dispatch<React.SetStateAction<string | null>>;
  setTouchGhost: React.Dispatch<
    React.SetStateAction<{ title: string; x: number; y: number } | null>
  >;
  setDragOverFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsPreviewZoneActive: React.Dispatch<React.SetStateAction<boolean>>;
  setLocation: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
    }>
  >;
  setLocation2: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
      id: string;
      fileType: string;
      parentId: string;
    }>
  >;
  setCurrentDataId: React.Dispatch<React.SetStateAction<string>>;
  setIsDesktopFileDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setTestSwitch: React.Dispatch<React.SetStateAction<any>>;
  touchDragRef: React.MutableRefObject<{
    pointerId: number;
    startX: number;
    startY: number;
    dragging: boolean;
    itemType: "file" | "folder";
    itemId: string;
    title: string;
    parentId: string;
  } | null>;
  toggleSelectedItem: (item: {
    id: string;
    type: "file" | "folder";
    title: string;
    parentId: string;
  }) => void;
  deleteWritten: (id: string, title: string) => void;
  moveFileToFolder: (
    fileId: string,
    title: string,
    parentId: string,
    folderId: string,
    folderTitle?: string,
  ) => void;
  handleEditTitle: (e: React.MouseEvent, idx: number, inputId: string) => void;
  editTitle: (id: string, newTitle: string) => void;
  updateFileTitleDraft: (idx: number, value: string) => void;
  getMenuPositionInContent: (e: React.MouseEvent | MouseEvent) => {
    x: number;
    y: number;
  };
  resetDragVisualState: () => void;
  openPreviewFile: (fileId: string, title: string) => void;
  routerPushText: (textId: string) => void;
  canManage: boolean;
}

export default function FileCard({
  data,
  idx,
  dataChecked,
  modSwitch,
  sessionEmail,
  owner,
  pageId,
  isPreviewMode,
  draggingFileId,
  folders,
  setDraggingFileId,
  setTouchGhost,
  setDragOverFolderId,
  setIsPreviewZoneActive,
  setLocation,
  setLocation2,
  setCurrentDataId,
  setIsDesktopFileDragging,
  setTestSwitch,
  touchDragRef,
  toggleSelectedItem,
  deleteWritten,
  moveFileToFolder,
  handleEditTitle,
  editTitle,
  updateFileTitleDraft,
  getMenuPositionInContent,
  resetDragVisualState,
  openPreviewFile,
  routerPushText,
  canManage,
}: FileCardProps) {
  const inputId = data?.title.replace(":", "-");

  return (
    <motion.div
      className={`actioned z-40 flex w-[112px] select-none sm:w-[140px] ${
        data.id !== "temp" && "cursor-pointer"
      } flex-col items-center`}
      key={data.title}
      onPointerDown={(e) => {
        if (!canManage) return;
        if (e.pointerType === "mouse") return;
        if (data.id === "temp") return;

        (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
        touchDragRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          dragging: false,
          itemType: "file",
          itemId: data.id,
          title: data.realTitle,
          parentId: data.parentId,
        };
      }}
      onPointerMove={(e) => {
        const t = touchDragRef.current;
        if (!t) return;
        if (e.pointerType === "mouse") return;
        if (t.pointerId !== e.pointerId) return;
        if (t.itemType !== "file") return;

        const dist = Math.hypot(e.clientX - t.startX, e.clientY - t.startY);

        if (!t.dragging && dist > 15) {
          t.dragging = true;
        }

        if (!t.dragging) return;

        e.preventDefault();

        setDraggingFileId(t.itemId);
        setTouchGhost({
          title: t.title,
          x: e.clientX,
          y: e.clientY,
        });

        const el = document.elementFromPoint(
          e.clientX,
          e.clientY,
        ) as HTMLElement | null;
        const previewZoneEl = el?.closest(
          "[data-preview-zone='true']",
        ) as HTMLElement | null;
        const previewPanelEl = el?.closest(
          "[data-preview-panel='true']",
        ) as HTMLElement | null;
        const folderEl = el?.closest("[data-folder-id]") as HTMLElement | null;

        if (previewZoneEl || previewPanelEl) {
          setIsPreviewZoneActive(true);
          setDragOverFolderId(null);
        } else if (folderEl?.dataset.folderId) {
          setIsPreviewZoneActive(false);
          setDragOverFolderId(folderEl.dataset.folderId);
        } else {
          setIsPreviewZoneActive(false);
          setDragOverFolderId(null);
        }
      }}
      onPointerUp={(e) => {
        const t = touchDragRef.current;
        if (!t) return;
        if (e.pointerType === "mouse") return;
        if (t.pointerId !== e.pointerId) return;
        if (t.itemType !== "file") return;

        if (t.dragging) {
          e.preventDefault();

          const el = document.elementFromPoint(
            e.clientX,
            e.clientY,
          ) as HTMLElement | null;
          const previewZoneEl = el?.closest(
            "[data-preview-zone='true']",
          ) as HTMLElement | null;
          const previewPanelEl = el?.closest(
            "[data-preview-panel='true']",
          ) as HTMLElement | null;
          const folderEl = el?.closest(
            "[data-folder-id]",
          ) as HTMLElement | null;

          if (previewZoneEl || previewPanelEl) {
            openPreviewFile(t.itemId, t.title);
          } else {
            const folderId = folderEl?.dataset.folderId;
            if (folderId) {
              const targetFolder = folders.find((f: any) => f.id === folderId);
              moveFileToFolder(
                t.itemId,
                t.title,
                t.parentId,
                folderId,
                targetFolder?.realTitle,
              );
            }
          }
        }

        (e.currentTarget as HTMLDivElement).releasePointerCapture?.(
          e.pointerId,
        );
        touchDragRef.current = null;
        resetDragVisualState();
      }}
      onPointerCancel={(e) => {
        (e.currentTarget as HTMLDivElement).releasePointerCapture?.(
          e.pointerId,
        );
        touchDragRef.current = null;
        resetDragVisualState();
      }}
      onClick={() => {
        if (data.id === "temp") return;
        if (isPreviewMode) {
          openPreviewFile(data.id, data.realTitle);
          return;
        }
        routerPushText(data.id);
      }}
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.8 }}
      onContextMenu={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setLocation({
          x: -1,
          y: -1,
        });
        const pos = getMenuPositionInContent(e);
        setLocation2({
          x: pos.x,
          y: pos.y,
          id: data.id,
          fileType: "file",
          parentId: data.parentId,
        });
      }}
    >
      <div
        draggable={canManage && data.id !== "temp"}
        onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
          if (!canManage || data.id === "temp") return;

          e.dataTransfer.setData("drag-type", "file");
          e.dataTransfer.setData("item-id", data.id);
          e.dataTransfer.setData("item-title", data.realTitle);
          e.dataTransfer.setData("item-parent", data.parentId);
          e.dataTransfer.effectAllowed = "move";

          requestAnimationFrame(() => {
            setDraggingFileId(data.id);
            setIsDesktopFileDragging(true);
          });
        }}
        onDragEnd={() => {
          setIsDesktopFileDragging(false);
          resetDragVisualState();
        }}
        style={{
          backgroundColor: "var(--color-bg-primary)",
          transition:
            "background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease",
          touchAction: "none",
          opacity: draggingFileId === data.id ? 0.35 : 1,
          transform: draggingFileId === data.id ? "scale(0.96)" : "scale(1)",
          boxShadow:
            draggingFileId === data.id
              ? "0 10px 24px rgba(0,0,0,0.18)"
              : dataChecked
                ? "0 0 0 2px rgba(59,130,246,0.45)"
                : "none",
        }}
        className="relative h-[160px] w-[112px] rounded-md border-2 border-customBorder sm:h-[200px] sm:w-[140px]"
      >
        {canManage && (
          <>
            <div className="absolute bottom-2 right-1">
              <label
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs"
                style={{
                  borderColor: "var(--color-customBorder)",
                  backgroundColor: "var(--color-bg-primary)",
                  color: "var(--color-primary)",
                }}
                onClick={(e) => e.stopPropagation()}
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
              </label>
            </div>

            <div className="absolute left-2 top-2">
              <Heart data={data} liked={data.liked} setData={setTestSwitch} />
            </div>

            <div
              className="absolute end-0 p-1"
              onClick={(e) => {
                e.stopPropagation();
                deleteWritten(data.id, data.title);
              }}
            >
              <IoIosClose />
            </div>
          </>
        )}

        <div className="ml-4 mr-4 flex h-full items-center justify-center">
          {data.id === "temp" ? (
            <div className="flex items-center justify-center text-center">
              <SpinnerMini />
            </div>
          ) : (
            <div className="text-overflow flex w-full items-center justify-center text-center">
              {data.realTitle}
            </div>
          )}
        </div>
      </div>

      <div
        className="w-full"
        onClick={(e) => {
          if (owner == sessionEmail || pageId == undefined) {
            if (data.id !== "temp") {
              handleEditTitle(e, idx, inputId);
              setCurrentDataId(data.id);
            }
          }
        }}
      >
        {modSwitch == idx ? (
          <div>
            <input
              id={inputId}
              className="w-full text-center text-black outline-none"
              value={data.realTitle}
              onContextMenu={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onChange={(e) => {
                updateFileTitleDraft(idx, e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key == "Enter") {
                  editTitle(data.id, data.realTitle);
                }
              }}
            />
          </div>
        ) : (
          <div className="text-overflow-2 w-full text-center">
            {data.realTitle}
          </div>
        )}
      </div>
    </motion.div>
  );
}
