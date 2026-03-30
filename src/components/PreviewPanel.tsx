"use client";

import Spinner from "@/components/spinner";

interface PreviewTarget {
  id: string;
  title: string;
}

interface Props {
  previewTarget: PreviewTarget | null;
  previewContent: string;
  isPreviewLoading: boolean;
  isPreviewZoneActive: boolean;
  canEdit: boolean;
  isFileDragging: boolean;
  onEdit: () => void;
  onClose: () => void;
  onDropFile: (itemId: string, title: string) => void;
  onResetDragVisualState: () => void;
}

export default function PreviewPanel({
  previewTarget,
  previewContent,
  isPreviewLoading,
  isPreviewZoneActive,
  canEdit,
  isFileDragging,
  onEdit,
  onClose,
  onDropFile,
  onResetDragVisualState,
}: Props) {
  return (
    <div
      className="relative z-10 order-1 flex h-1/2 w-full flex-col overflow-hidden border-b-2 md:order-2 md:h-screen md:w-1/2 md:border-b-0 md:border-l-2"
      style={{
        borderColor: "var(--color-customBorder)",
        backgroundColor: "var(--color-bg-primary)",
        transition: "background-color 0.7s ease, box-shadow 0.2s ease",
        boxShadow: isPreviewZoneActive
          ? "inset 0 0 0 2px rgba(59,130,246,0.45)"
          : "none",
      }}
      data-preview-panel="true"
      onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
        if (!isFileDragging) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const dragType = e.dataTransfer.getData("drag-type");
        const itemId = e.dataTransfer.getData("item-id");
        const title = e.dataTransfer.getData("item-title");

        if (dragType === "file" && itemId) {
          onDropFile(itemId, title);
        } else {
          onResetDragVisualState();
        }
      }}
    >
      <div
        className="flex items-center justify-between border-b p-4 shadow-sm"
        style={{ borderColor: "var(--color-customBorder)" }}
      >
        <h2
          className="truncate pr-4 text-lg font-bold"
          style={{ color: "var(--color-primary)" }}
        >
          {previewTarget?.title}
        </h2>

        <div className="flex gap-x-2">
          {canEdit && (
            <button
              onClick={onEdit}
              className="whitespace-nowrap rounded-md border-2 px-4 py-2 text-sm font-medium transition-colors"
              style={{
                borderColor: "var(--color-customBorder)",
                color: "var(--color-primary)",
                backgroundColor: "transparent",
              }}
            >
              편집모드로
            </button>
          )}

          <button
            onClick={onClose}
            className="whitespace-nowrap rounded-md border-2 px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: "var(--color-customBorder)",
              color: "var(--color-primary)",
              backgroundColor: "transparent",
            }}
          >
            닫기
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isPreviewLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div
            className="h-full w-full overflow-auto whitespace-pre-wrap rounded-md border-2 p-6 shadow-inner outline-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              borderColor: "var(--color-customBorder)",
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-primary)",
              transition: "background-color 0.7s ease",
            }}
          >
            {previewContent}
          </div>
        )}
      </div>
    </div>
  );
}
