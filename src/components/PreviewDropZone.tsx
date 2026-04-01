"use client";

import { useDroppable } from "@dnd-kit/core";

interface Props {
  isFileDragging: boolean;
  isPreviewZoneActive: boolean;
}

export default function PreviewDropZone({
  isFileDragging,
  isPreviewZoneActive,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: "preview-drop-zone",
  });

  return (
    <div
      ref={setNodeRef}
      data-preview-zone="true"
      className="fixed bottom-0 left-0 right-0 z-[9998] px-3 pb-3 md:px-4 md:pb-4"
      style={{
        opacity: isFileDragging ? 1 : 0,
        transform: isFileDragging ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
        pointerEvents: isFileDragging ? "auto" : "none",
      }}
    >
      <div
        className="flex h-[72px] w-full items-center justify-center rounded-2xl border-2 text-base font-bold shadow-2xl md:h-[84px] md:text-lg"
        style={{
          backgroundColor: "var(--color-bg-primary)",
          color: "var(--color-primary)",
          borderColor:
            isPreviewZoneActive || isOver
              ? "rgba(59,130,246,0.8)"
              : "var(--color-customBorder)",
          boxShadow:
            isPreviewZoneActive || isOver
              ? "0 0 0 2px rgba(59,130,246,0.45), 0 12px 28px rgba(0,0,0,0.18)"
              : "0 8px 20px rgba(0,0,0,0.12)",
        }}
      >
        여기에 놓아 미리보기
      </div>
    </div>
  );
}
