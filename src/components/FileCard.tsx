"use client";

import { motion } from "framer-motion";
import { IoIosClose } from "react-icons/io";
import SpinnerMini from "@/components/spinner-mini";
import Heart from "@/components/Heart";
import CustomCheckbox from "@/components/CustomCheckbox";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  setLocation,
  setLocation2,
  setCurrentDataId,
  setTestSwitch,
  toggleSelectedItem,
  deleteWritten,
  handleEditTitle,
  editTitle,
  updateFileTitleDraft,
  getMenuPositionInContent,
  openPreviewFile,
  routerPushText,
  canManage,
}: FileCardProps) {
  const inputId = data?.title.replace(":", "-");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: data.id,
    disabled: !canManage || data.id === "temp",
  });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      data-file-id={data.id}
      style={sortableStyle}
      className={`actioned z-40 flex w-[112px] select-none sm:w-[140px] ${
        data.id !== "temp" && "cursor-pointer"
      } flex-col items-center`}
      key={data.title}
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
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
        {...attributes}
        {...listeners}
        style={{
          backgroundColor: "var(--color-bg-primary)",
          transition:
            "background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease",
          touchAction: "none",
          boxShadow: isDragging
            ? "0 10px 24px rgba(0,0,0,0.18)"
            : dataChecked
              ? "0 0 0 2px rgba(59,130,246,0.45)"
              : "none",
        }}
        className="relative h-[160px] w-[112px] rounded-md border-2 border-customBorder sm:h-[200px] sm:w-[140px]"
        onClick={() => {
          if (data.id === "temp") return;
          if (isPreviewMode) {
            openPreviewFile(data.id, data.realTitle);
            return;
          }
          routerPushText(data.id);
        }}
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
                onPointerDown={(e) => e.stopPropagation()}
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

            <div
              className="absolute left-2 top-2"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Heart data={data} liked={data.liked} setData={setTestSwitch} />
            </div>

            <div
              className="absolute end-0 p-1"
              onPointerDown={(e) => e.stopPropagation()}
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
        onPointerDown={(e) => e.stopPropagation()}
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
