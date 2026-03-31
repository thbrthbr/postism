"use client";

import { motion } from "framer-motion";
import { IoIosClose } from "react-icons/io";
import { FaRegFolderOpen } from "react-icons/fa";
import SpinnerMini from "@/components/spinner-mini";
import Heart from "@/components/Heart";
import CustomCheckbox from "@/components/CustomCheckbox";
import type {
  FileMenuPosition,
  MenuPosition,
  TouchDragState,
  SetState,
} from "@/types/explorer";

interface FolderCardProps {
  folder: any;
  idx: number;
  folderChecked: boolean;
  modSwitch: number;
  currentDataId: string;
  sessionEmail?: string | null;
  owner?: string;
  pageId?: string;
  draggingFolderId: string | null;
  dragOverFolderId: string | null;
  folders: any[];
  setFolders: React.Dispatch<React.SetStateAction<any[]>>;
  setDraggingFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  setTouchGhost: React.Dispatch<
    React.SetStateAction<{ title: string; x: number; y: number } | null>
  >;
  setDragOverFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsPreviewZoneActive: React.Dispatch<React.SetStateAction<boolean>>;
  setLocation: SetState<MenuPosition>;
  setLocation2: SetState<FileMenuPosition>;
  setCurrentDataId: React.Dispatch<React.SetStateAction<string>>;
  setModSwitch: React.Dispatch<React.SetStateAction<number>>;
  setTestSwitch: React.Dispatch<React.SetStateAction<any>>;
  touchDragRef: React.MutableRefObject<TouchDragState>;
  isSelected: (id: string, type: "file" | "folder") => boolean;
  toggleSelectedItem: (item: {
    id: string;
    type: "file" | "folder";
    title: string;
    parentId: string;
  }) => void;
  deleteFolder: (id: string) => void;
  moveFolderToFolder: (
    folderId: string,
    title: string,
    parentId: string,
    targetFolderId: string,
    targetFolderTitle?: string,
  ) => void;
  moveSelectedItemsToFolder: (
    targetFolderId: string,
    targetFolderTitle?: string,
  ) => void;
  handleEditTitle: (e: React.MouseEvent, idx: number, inputId: string) => void;
  editTitle: (id: string, newTitle: string) => void;
  getMenuPositionInContent: (e: React.MouseEvent | MouseEvent) => {
    x: number;
    y: number;
  };
  resetDragVisualState: () => void;
  routerPushFolder: (folderId: string) => void;
  moveFileToFolder: (
    fileId: string,
    title: string,
    parentId: string,
    folderId: string,
    folderTitle?: string,
  ) => void;
  selectedItems: {
    id: string;
    type: "file" | "folder";
    title: string;
    parentId: string;
  }[];
  clearSelectedItems: () => void;
  canManage: boolean;
}

export default function FolderCard({
  folder,
  idx,
  folderChecked,
  modSwitch,
  sessionEmail,
  owner,
  pageId,
  draggingFolderId,
  dragOverFolderId,
  folders,
  setFolders,
  setDraggingFolderId,
  setTouchGhost,
  setDragOverFolderId,
  setIsPreviewZoneActive,
  setLocation,
  setLocation2,
  setCurrentDataId,
  setTestSwitch,
  touchDragRef,
  toggleSelectedItem,
  deleteFolder,
  moveFolderToFolder,
  moveSelectedItemsToFolder,
  moveFileToFolder,
  handleEditTitle,
  editTitle,
  getMenuPositionInContent,
  resetDragVisualState,
  routerPushFolder,
  selectedItems,
  clearSelectedItems,
  canManage,
}: FolderCardProps) {
  const folderInputId = folder.title.replace(":", "-");

  return (
    <motion.div
      data-folder-id={folder.id}
      className={`actioned z-40 flex w-[112px] select-none sm:w-[140px] ${
        folder.id !== "temp" && "cursor-pointer"
      } flex-col items-center`}
      key={folder.title}
      onClick={() => {
        if (folder.id === "temp") return;
        routerPushFolder(folder.id);
      }}
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.8 }}
      onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
        if (!canManage) return;
        e.preventDefault();
        if (folder.id === "temp") return;
        setDragOverFolderId(folder.id);
      }}
      onDragLeave={() => {
        setDragOverFolderId(null);
      }}
      onDrop={(e: React.DragEvent<HTMLDivElement>) => {
        if (!canManage) return;

        e.preventDefault();
        e.stopPropagation();

        if (folder.id === "temp") {
          setDragOverFolderId(null);
          return;
        }

        const dragType = e.dataTransfer.getData("drag-type");
        const itemId = e.dataTransfer.getData("item-id");
        const title = e.dataTransfer.getData("item-title");
        const parentId = e.dataTransfer.getData("item-parent");

        if (!itemId) {
          setDragOverFolderId(null);
          return;
        }

        const isDraggedItemSelected = selectedItems.some(
          (item) =>
            item.id === itemId &&
            item.type === (dragType === "folder" ? "folder" : "file"),
        );

        if (isDraggedItemSelected) {
          moveSelectedItemsToFolder(folder.id, folder.realTitle);
          setDragOverFolderId(null);
          return;
        }

        if (dragType === "file") {
          moveFileToFolder(
            itemId,
            title,
            parentId,
            folder.id,
            folder.realTitle,
          );
        } else if (dragType === "folder") {
          moveFolderToFolder(
            itemId,
            title,
            parentId,
            folder.id,
            folder.realTitle,
          );
        }

        setDragOverFolderId(null);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setLocation({ x: -1, y: -1 });
        const pos = getMenuPositionInContent(e);
        setLocation2({
          x: pos.x,
          y: pos.y,
          id: folder.id,
          fileType: "folder",
          parentId: folder.parentId,
        });
      }}
      onPointerDown={(e) => {
        if (!canManage) return;
        if (e.pointerType === "mouse") return;
        if (folder.id === "temp") return;

        (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);

        touchDragRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          dragging: false,
          itemType: "folder",
          itemId: folder.id,
          title: folder.realTitle,
          parentId: folder.parentId,
        };
      }}
      onPointerMove={(e) => {
        const t = touchDragRef.current;
        if (!t) return;
        if (e.pointerType === "mouse") return;
        if (t.pointerId !== e.pointerId) return;
        if (t.itemType !== "folder") return;

        const dist = Math.hypot(e.clientX - t.startX, e.clientY - t.startY);

        if (!t.dragging && dist > 15) {
          t.dragging = true;
        }

        if (!t.dragging) return;

        e.preventDefault();

        setDraggingFolderId(t.itemId);
        setTouchGhost({
          title: t.title,
          x: e.clientX,
          y: e.clientY,
        });

        const el = document.elementFromPoint(
          e.clientX,
          e.clientY,
        ) as HTMLElement | null;
        const previewEl = el?.closest(
          "[data-preview-zone='true']",
        ) as HTMLElement | null;
        const folderEl = el?.closest("[data-folder-id]") as HTMLElement | null;

        if (previewEl) {
          setIsPreviewZoneActive(false);
          setDragOverFolderId(null);
          return;
        }

        const targetFolderId = folderEl?.dataset.folderId;
        if (targetFolderId && targetFolderId !== t.itemId) {
          setDragOverFolderId(targetFolderId);
        } else {
          setDragOverFolderId(null);
        }
      }}
      onPointerUp={(e) => {
        const t = touchDragRef.current;
        if (!t) return;
        if (e.pointerType === "mouse") return;
        if (t.pointerId !== e.pointerId) return;
        if (t.itemType !== "folder") return;

        if (t.dragging) {
          e.preventDefault();

          const el = document.elementFromPoint(
            e.clientX,
            e.clientY,
          ) as HTMLElement | null;
          const folderEl = el?.closest(
            "[data-folder-id]",
          ) as HTMLElement | null;

          const targetFolderId = folderEl?.dataset.folderId;
          if (targetFolderId && targetFolderId !== t.itemId) {
            const targetFolder = folders.find(
              (f: any) => f.id === targetFolderId,
            );
            moveFolderToFolder(
              t.itemId,
              t.title,
              t.parentId,
              targetFolderId,
              targetFolder?.realTitle,
            );
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
    >
      <div
        draggable={canManage && folder.id !== "temp"}
        onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
          if (!canManage || folder.id === "temp") return;

          e.dataTransfer.setData("drag-type", "folder");
          e.dataTransfer.setData("item-id", folder.id);
          e.dataTransfer.setData("item-title", folder.realTitle);
          e.dataTransfer.setData("item-parent", folder.parentId);

          setDraggingFolderId(folder.id);
        }}
        onDragEnd={() => {
          resetDragVisualState();
        }}
        style={{
          backgroundColor:
            dragOverFolderId === folder.id
              ? "rgba(0,0,255,0.12)"
              : "var(--color-bg-primary)",
          transition:
            "background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
          transform:
            draggingFolderId === folder.id
              ? "scale(0.96)"
              : dragOverFolderId === folder.id
                ? "scale(1.04)"
                : "scale(1)",
          boxShadow:
            dragOverFolderId === folder.id
              ? "0 0 0 2px rgba(59,130,246,0.6), 0 12px 28px rgba(0,0,0,0.12)"
              : draggingFolderId === folder.id
                ? "0 10px 24px rgba(0,0,0,0.18)"
                : folderChecked
                  ? "0 0 0 2px rgba(59,130,246,0.45)"
                  : "none",
          opacity: draggingFolderId === folder.id ? 0.35 : 1,
          touchAction: "none",
        }}
        className="relative h-[160px] w-[112px] rounded-md border-2 border-customBorder sm:h-[200px] sm:w-[140px]"
      >
        {canManage && (
          <>
            <div className="absolute bottom-2 right-1 z-20">
              <label
                className="flex cursor-pointer items-center gap-1 px-2 py-1 text-xs"
                style={{
                  borderColor: "var(--color-customBorder)",
                  backgroundColor: "var(--color-bg-primary)",
                  color: "var(--color-primary)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <CustomCheckbox
                  checked={folderChecked}
                  onChange={() =>
                    toggleSelectedItem({
                      id: folder.id,
                      type: "folder",
                      title: folder.realTitle,
                      parentId: folder.parentId,
                    })
                  }
                />
              </label>
            </div>

            <div className="absolute left-2 top-2 z-10">
              <Heart
                data={folder}
                liked={folder.liked}
                setData={setTestSwitch}
              />
            </div>

            <div
              className="absolute end-0 p-1"
              onClick={(e) => {
                e.stopPropagation();
                deleteFolder(folder.id);
              }}
            >
              <IoIosClose />
            </div>
          </>
        )}

        <div className="ml-4 mr-4 flex h-full items-center justify-center">
          {folder.id === "temp" ? (
            <div className="flex items-center justify-center text-center">
              <SpinnerMini />
            </div>
          ) : (
            <div className="flex w-full items-center justify-center text-center">
              <FaRegFolderOpen className="text-7xl" />
            </div>
          )}
        </div>
      </div>

      <div
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();

          if (owner == sessionEmail || pageId == undefined) {
            if (folder.id !== "temp") {
              handleEditTitle(e, (idx + 1) * -1 * 1000, folderInputId);
              setCurrentDataId(folder.id);
            }
          }
        }}
      >
        {modSwitch == (idx + 1) * -1 * 1000 ? (
          <div>
            <input
              id={folderInputId}
              className="w-full text-center text-black outline-none"
              value={folder.realTitle}
              onContextMenu={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onChange={(e) => {
                const temp = folders.slice(0);
                temp[idx].realTitle = e.target.value;
                setFolders(temp);
              }}
              onKeyDown={(e) => {
                if (e.key == "Enter") {
                  editTitle(folder.id, folders[idx].realTitle);
                }
              }}
            />
          </div>
        ) : (
          <div className="text-overflow-2 w-full text-center">
            {folder.realTitle}
          </div>
        )}
      </div>
    </motion.div>
  );
}
