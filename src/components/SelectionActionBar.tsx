"use client";

import { LuDownload } from "react-icons/lu";
import { FaRegTrashAlt } from "react-icons/fa";
import { TbFolderSymlink } from "react-icons/tb";
import { BiSelectMultiple } from "react-icons/bi";
import { IoClose } from "react-icons/io5";

interface Props {
  selectedCount: number;
  isDownloading: boolean;
  bulkMoveMenuOpen: boolean;
  bulkMoveButtonRef: React.Ref<HTMLButtonElement>;
  canManage: boolean;
  onDownload: () => void;
  onDelete: () => void;
  onMoveMenuToggle: () => void;
  onSelectAll: () => void;
  onClear: () => void;
}

export default function SelectionActionBar({
  selectedCount,
  isDownloading,
  bulkMoveMenuOpen,
  bulkMoveButtonRef,
  canManage,
  onDownload,
  onDelete,
  onMoveMenuToggle,
  onSelectAll,
  onClear,
}: Props) {
  return (
    <div
      className="sticky top-0 z-[60] mt-4 w-[calc(100%-2rem)] rounded-xl border-2 px-2 py-2 sm:px-4 sm:py-3"
      style={{
        borderColor: "var(--color-customBorder)",
        backgroundColor: "var(--color-bg-primary)",
        color: "var(--color-primary)",
      }}
    >
      <div className="relative min-h-[56px] sm:min-h-0">
        <div className="overflow-x-auto pr-[96px] [-ms-overflow-style:none] [scrollbar-width:none] sm:pr-0 [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max flex-nowrap items-center gap-1 sm:flex-wrap sm:justify-end sm:gap-2">
            <button
              disabled={isDownloading}
              className="h-8 shrink-0 rounded-md border px-2 py-1.5 text-[11px] disabled:opacity-50 sm:px-3 sm:py-1.5 sm:text-sm"
              style={{ borderColor: "var(--color-customBorder)" }}
              onClick={(e) => {
                e.stopPropagation();
                if (isDownloading) return;
                onDownload();
              }}
            >
              {isDownloading ? (
                "다운로드 중..."
              ) : (
                <LuDownload className="font-bold" />
              )}
            </button>

            {canManage && (
              <button
                disabled={!canManage}
                className="h-8 shrink-0 rounded-md border px-2 py-1.5 text-[11px] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-1.5 sm:text-sm"
                style={{ borderColor: "var(--color-customBorder)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canManage) return;
                  onDelete();
                }}
              >
                <FaRegTrashAlt />
              </button>
            )}
            {canManage && (
              <button
                ref={bulkMoveButtonRef}
                disabled={!canManage}
                className="h-8 shrink-0 rounded-md border px-2 py-1.5 text-[11px] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-1.5 sm:text-sm"
                style={{ borderColor: "var(--color-customBorder)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canManage) return;
                  onMoveMenuToggle();
                }}
              >
                <TbFolderSymlink />
              </button>
            )}
            <button
              className="h-8 shrink-0 rounded-md border px-2 py-1.5 text-[11px] sm:px-3 sm:py-1.5 sm:text-sm"
              style={{ borderColor: "var(--color-customBorder)" }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectAll();
              }}
            >
              <BiSelectMultiple />
            </button>

            <button
              className="h-8 shrink-0 rounded-md border px-2 py-1.5 text-[11px] sm:px-3 sm:py-1.5 sm:text-sm"
              style={{ borderColor: "var(--color-customBorder)" }}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              <IoClose />
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 text-[11px] sm:static sm:mt-0 sm:text-sm">
          {selectedCount}개 선택됨
        </div>
      </div>
    </div>
  );
}
