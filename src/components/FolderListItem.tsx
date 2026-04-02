"use client";

import Heart from "@/components/Heart";
import CustomCheckbox from "@/components/CustomCheckbox";
import { FaRegFolderOpen } from "react-icons/fa";
import { motion } from "framer-motion";
import { IoIosClose } from "react-icons/io";

interface FolderListItemProps {
  folder: any;
  folderChecked: boolean;
  canManage: boolean;
  sessionEmail?: string | null;
  owner?: string;
  pageId?: string;
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
  routerPushFolder: (folderId: string) => void;
  idx: number;
  modSwitch: number;
  folders: any[];
  setFolders: React.Dispatch<React.SetStateAction<any[]>>;
  setCurrentDataId: React.Dispatch<React.SetStateAction<string>>;
  handleEditTitle: (e: React.MouseEvent, idx: number, inputId: string) => void;
  editTitle: (id: string, newTitle: string) => void;
  deleteFolder: (id: string) => void;
}

export default function FolderListItem({
  folder,
  folderChecked,
  canManage,
  toggleSelectedItem,
  setTestSwitch,
  getMenuPositionInContent,
  openItemMenu,
  routerPushFolder,
  idx,
  modSwitch,
  folders,
  setFolders,
  setCurrentDataId,
  handleEditTitle,
  editTitle,
  deleteFolder,
}: FolderListItemProps) {
  const folderInputId = folder.title.replace(":", "-");
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
        if (folder.id === "temp") return;
        routerPushFolder(folder.id);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!canManage) return;
        const pos = getMenuPositionInContent(e);
        openItemMenu(pos.x, pos.y, folder.id, "folder", folder.parentId);
      }}
    >
      <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        <span className="text-lg">
          <FaRegFolderOpen className="shrink-0 text-sm opacity-80 md:text-base" />
        </span>

        {modSwitch === (idx + 1) * -1 * 1000 ? (
          <input
            id={folderInputId}
            className="w-full bg-transparent outline-none"
            value={folder.realTitle}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
            onChange={(e) => {
              setFolders((prev: any[]) => {
                const temp = [...prev];
                temp[idx] = {
                  ...temp[idx],
                  realTitle: e.target.value,
                };
                return temp;
              });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                editTitle(folder.id, folder.realTitle);
              }
            }}
          />
        ) : (
          <span
            className="cursor-text truncate"
            onClick={(e) => {
              e.stopPropagation();
              if (!canManage) return;
              if (folder.id === "temp") return;

              handleEditTitle(e, (idx + 1) * -1 * 1000, folderInputId);
              setCurrentDataId(folder.id);
            }}
          >
            {folder.realTitle}
          </span>
        )}
      </div>
      <div
        className="flex shrink-0 items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <>
          <button
            type="button"
            onClick={() => {
              toggleSelectedItem({
                id: folder.id,
                type: "folder",
                title: folder.realTitle,
                parentId: folder.parentId,
              });
            }}
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
          </button>
          {canManage && (
            <Heart data={folder} liked={folder.liked} setData={setTestSwitch} />
          )}
          {canManage && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                deleteFolder(folder.id);
              }}
            >
              <IoIosClose />
            </div>
          )}
        </>
      </div>
    </motion.div>
  );
}
