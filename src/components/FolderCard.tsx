"use client";

import { useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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
  draggingFileId: string | null;
  folderReorderTarget: {
    draggingId: string;
    targetId: string;
    position: "before" | "after";
  } | null;
  setFolderReorderTarget: React.Dispatch<
    React.SetStateAction<{
      draggingId: string;
      targetId: string;
      position: "before" | "after";
    } | null>
  >;
  reorderFolderItems: (
    draggingId: string,
    targetId: string,
    position: "before" | "after",
  ) => Promise<void>;
  canReorderFolders: (draggingId: string, targetId: string) => boolean;
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
  draggingFileId,
  folderReorderTarget,
  setFolderReorderTarget,
  reorderFolderItems,
  canReorderFolders,
}: FolderCardProps) {
  const folderInputId = folder.title.replace(":", "-");
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `folder-sort:${folder.id}`,
    disabled: !canManage || folder.id === "temp",
  });
  const { setNodeRef: setDropRef } = useDroppable({
    id: `folder:${folder.id}`,
    disabled: !canManage || folder.id === "temp",
  });
  const setNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      setSortableRef(node);
      setDropRef(node);
    },
    [setSortableRef, setDropRef],
  );
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.35 : 1,
  };
  return (
    <motion.div
      ref={setNodeRef}
      style={sortableStyle}
      data-folder-id={folder.id}
      className={`actioned z-40 flex w-[112px] select-none sm:w-[140px] ${
        folder.id !== "temp" && "cursor-pointer"
      } flex-col items-center`}
      key={folder.title}
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
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
    >
      <div
        {...attributes}
        {...listeners}
        onClick={() => {
          if (folder.id === "temp") return;
          routerPushFolder(folder.id);
        }}
        style={{
          backgroundColor:
            dragOverFolderId === folder.id
              ? "rgba(0,0,255,0.12)"
              : "var(--color-bg-primary)",
          transition:
            "background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
          boxShadow:
            dragOverFolderId === folder.id
              ? "0 0 0 2px rgba(59,130,246,0.6), 0 12px 28px rgba(0,0,0,0.12)"
              : isDragging
                ? "0 10px 24px rgba(0,0,0,0.18)"
                : folderChecked
                  ? "0 0 0 2px rgba(59,130,246,0.45)"
                  : "none",
          touchAction: "none",
        }}
        className="relative h-[160px] w-[112px] rounded-md border-2 border-customBorder sm:h-[200px] sm:w-[140px]"
      >
        <>
          <div className="absolute bottom-2 right-1 z-20">
            <label
              className="flex cursor-pointer items-center gap-1 px-2 py-1 text-xs"
              style={{
                borderColor: "var(--color-customBorder)",
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-primary)",
              }}
              onPointerDown={(e) => e.stopPropagation()}
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

          {canManage && (
            <div
              className="absolute left-2 top-2 z-10"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Heart
                data={folder}
                liked={folder.liked}
                setData={setTestSwitch}
              />
            </div>
          )}
          {canManage && (
            <div
              className="absolute end-0 p-1"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                deleteFolder(folder.id);
              }}
            >
              <IoIosClose />
            </div>
          )}
        </>
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
        onPointerDown={(e) => e.stopPropagation()}
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
