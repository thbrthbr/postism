"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IoSearch, IoClose } from "react-icons/io5";
import { FaRegFolderOpen } from "react-icons/fa";
import { FiFileText } from "react-icons/fi";

type SearchItemType = "file" | "folder";

type SearchResult = {
  id: string;
  type: SearchItemType;
  realTitle: string;
  parentId: string;
  order: number;
  pathText: string;
  createdAtText: string;
};

interface SearchMenuProps {
  email?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (fileId: string) => void;
  onOpenFolder: (folderId: string) => void;
  anchorRect: DOMRect | null;
}

type PanelPlacement = "right" | "left" | "bottom" | "top";

export default function SearchMenu({
  email,
  isOpen,
  onClose,
  onOpenFile,
  onOpenFolder,
  anchorRect,
}: SearchMenuProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "file" | "folder">(
    "all",
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const [placement, setPlacement] = useState<PanelPlacement>("right");
  const [isMobile, setIsMobile] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ left: 8, top: 8 });

  const viewportW = window.innerWidth;
  const mobile = viewportW < 640;

  const panelWidth = mobile ? Math.min(320, viewportW - 16) : 420;

  useEffect(() => {
    if (!isOpen || !email) return;

    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(async () => {
      setLoading(true);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SITE}/api/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: email,
            queryText: trimmed,
            type: searchType,
          }),
          cache: "no-store",
        });

        const json = await res.json();

        if (cancelled) return;

        setResults(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        console.error("SearchMenu search error:", error);
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isOpen, email, query, searchType]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSearchType("all");
      setResults([]);
      setLoading(false);
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRect) return;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const mobile = viewportW < 640;

    const gap = mobile ? 8 : 10;
    const safe = 8;
    const width = mobile ? Math.min(320, viewportW - 16) : 420;
    const height = mobile ? Math.min(viewportH * 0.55, 420) : 420;

    let left = anchorRect.right + gap;
    let top = anchorRect.top;

    const rightFits = left + width <= viewportW - safe;
    const leftFits = anchorRect.left - gap - width >= safe;
    const bottomFits = anchorRect.top + height <= viewportH - safe;
    const topFits = anchorRect.bottom - height >= safe;

    if (!mobile) {
      if (rightFits) {
        left = anchorRect.right + gap;
        top = anchorRect.top;
      } else if (leftFits) {
        left = anchorRect.left - gap - width;
        top = anchorRect.top;
      } else if (bottomFits) {
        left = Math.min(anchorRect.left, viewportW - width - safe);
        top = anchorRect.bottom + gap;
      } else {
        left = Math.min(anchorRect.left, viewportW - width - safe);
        top = Math.max(safe, anchorRect.top - gap - height);
      }
    } else {
      left = Math.max(
        safe,
        Math.min(anchorRect.left, viewportW - width - safe),
      );

      if (anchorRect.bottom + gap + height <= viewportH - safe) {
        top = anchorRect.bottom + gap;
      } else {
        top = Math.max(safe, anchorRect.top - gap - height);
      }
    }

    left = Math.max(safe, Math.min(left, viewportW - width - safe));
    top = Math.max(safe, Math.min(top, viewportH - height - safe));

    setPanelPosition({ left, top });
  }, [isOpen, anchorRect, results.length, query, searchType]);

  if (!isOpen) return null;

  const placementClass = (() => {
    if (isMobile) {
      if (placement === "top") {
        return "left-0 right-auto bottom-full mb-2";
      }
      return "left-0 right-auto top-full mt-2";
    }

    switch (placement) {
      case "left":
        return "right-full top-0 mr-2";
      case "bottom":
        return "left-0 top-full mt-2";
      case "top":
        return "left-0 bottom-full mb-2";
      case "right":
      default:
        return "left-full top-0 ml-2";
    }
  })();

  return (
    <div
      ref={panelRef}
      className="fixed z-[10020] overflow-hidden rounded-2xl border-2 shadow-2xl"
      style={{
        left: panelPosition.left,
        top: panelPosition.top,
        width: panelWidth,
        maxWidth: "calc(100vw - 16px)",
        maxHeight: "min(55vh, 420px)",
        backgroundColor: "var(--color-bg-primary)",
        borderColor: "var(--color-customBorder)",
        color: "var(--color-primary)",
      }}
    >
      <div
        className="flex items-center gap-2 border-b-2 p-2 md:p-3"
        style={{ borderColor: "var(--color-customBorder)" }}
      >
        <div
          className="flex flex-1 items-center rounded-xl border-2 px-3 py-2"
          style={{ borderColor: "var(--color-customBorder)" }}
        >
          <IoSearch className="mr-2 shrink-0 text-base opacity-70 md:text-lg" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="파일 및 폴더 검색"
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: "var(--color-primary)" }}
          />
        </div>

        <button
          onClick={onClose}
          className="rounded-xl border-2 p-2"
          style={{ borderColor: "var(--color-customBorder)" }}
        >
          <IoClose className="text-base md:text-lg" />
        </button>
      </div>

      <div
        className="flex gap-2 border-b-2 px-2 py-2 md:px-3"
        style={{ borderColor: "var(--color-customBorder)" }}
      >
        {(["all", "file", "folder"] as const).map((type) => {
          const active = searchType === type;
          const label =
            type === "all" ? "전체" : type === "file" ? "파일" : "폴더";

          return (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className="rounded-full border-2 px-3 py-1 text-[11px] font-bold transition md:text-xs"
              style={{
                borderColor: active
                  ? "var(--color-primary)"
                  : "var(--color-customBorder)",
                backgroundColor: active
                  ? "rgba(255,255,255,0.06)"
                  : "transparent",
                color: "var(--color-primary)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="max-h-[min(55vh,420px)] overflow-y-auto p-2 [-ms-overflow-style:none] [scrollbar-width:none] md:max-h-[420px] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          <div className="p-4 text-sm opacity-70">불러오는 중...</div>
        ) : !query.trim() ? (
          <div className="p-4 text-sm opacity-70">
            제목으로 검색하거라. 같은 이름이 있을 수 있으니 생성시각도 함께
            보여주느니라.
          </div>
        ) : results.length === 0 ? (
          <div className="p-4 text-sm opacity-70">검색 결과가 없느니라.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {results.map((item) => (
              <button
                key={`${item.type}-${item.id}-${item.order}`}
                onClick={() => {
                  if (item.type === "file") {
                    onOpenFile(item.id);
                  } else {
                    onOpenFolder(item.id);
                  }
                  onClose();
                }}
                className="w-full rounded-xl border-2 p-2 text-left transition hover:opacity-90 md:p-3"
                style={{
                  borderColor: "var(--color-customBorder)",
                  backgroundColor: "transparent",
                }}
              >
                <div className="flex items-start justify-between gap-2 md:gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {item.type === "folder" ? (
                      <FaRegFolderOpen className="shrink-0 text-sm opacity-80 md:text-base" />
                    ) : (
                      <FiFileText className="shrink-0 text-sm opacity-80 md:text-base" />
                    )}
                    <span className="truncate text-xs font-bold md:text-sm">
                      {item.realTitle}
                    </span>
                  </div>

                  <span className="shrink-0 text-[10px] opacity-70 md:text-xs">
                    {item.createdAtText}
                  </span>
                </div>

                <div className="mt-1 truncate pl-5 text-[10px] opacity-70 md:pl-6 md:text-xs">
                  / {item.pathText || ""}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
