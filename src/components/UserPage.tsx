"use client";

import React, { useEffect, useRef, useState } from "react";
import { storage } from "../firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { usePathname, useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import Menu from "@/components/menu";
import Spinner from "@/components/spinner";
import SpinnerMini from "./spinner-mini";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { appSwal, icons } from "@/lib/swal";
import { isDescendantFolder } from "@/lib/explorer-utils";
import SelectionActionBar from "@/components/SelectionActionBar";
import PreviewPanel from "@/components/PreviewPanel";
import PreviewDropZone from "@/components/PreviewDropZone";
import FolderCard from "@/components/FolderCard";
import FileCard from "@/components/FileCard";
import useSelection from "@/hooks/useSelection";
import {
  fetchFoldersByParentId,
  fetchTextsByParentId,
  fetchAllFoldersFlat,
  fetchFolderParentInfo,
  createTextItem,
  createFolderItem,
  deleteTextItem,
  deleteFolderItem,
  editTextTitleItem,
  editFolderTitleItem,
  editChildrenPath,
  editItemOrder,
  fetchPreviewTextById,
} from "@/lib/explorer-api";
import usePreview from "@/hooks/usePreviews";
import useDownload from "@/hooks/useDownload";
import useMenuState from "@/hooks/useMenuState";
import type {
  SelectedItem,
  MenuPosition,
  FileMenuPosition,
  TouchGhost,
  TouchDragState,
} from "@/types/explorer";
import HelpModal from "@/components/HelpModal";
import Heart from "./Heart";
import CustomCheckbox from "./CustomCheckbox";
import FileListItem from "@/components/FileListItem";
import FolderListItem from "@/components/FolderListItem";

interface Props {
  id?: string;
}

function DroppableFolderCard({
  folderId,
  children,
}: {
  folderId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `folder:${folderId}` });

  return (
    <div
      ref={setNodeRef}
      style={{
        borderRadius: "0.375rem",
        outline: isOver ? "2px solid rgba(59,130,246,0.55)" : "none",
      }}
    >
      {children}
    </div>
  );
}

export default function UserPage({ id }: Props) {
  const { toast } = useToast();
  const pathName = usePathname().split("/")[1];
  const { data: session } = useSession();
  const isMounted = useRef(false);

  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const bulkMoveButtonRef = useRef<HTMLButtonElement | null>(null);

  const [modSwitch, setModSwitch] = useState(-1);
  const [previousEmail, setPreviousEmail] = useState<string | null | undefined>(
    null,
  );
  const [owner, setOwner] = useState<string>("");
  const [datas, setDatas] = useState<any>([]);
  const [folders, setFolders] = useState<any>([]);
  const [foldersCount, setFoldersCount] = useState<number[]>([]);
  const [dataCount, setDataCount] = useState<number[]>([]);
  const [currentDataId, setCurrentDataId] = useState("");
  const [testSwitch, setTestSwitch] = useState<any>({
    id: "",
    toggle: false,
    changeTo: null,
    type: "",
  });
  const [loadedParentId, setLoadedParentId] = useState("");

  const [draggingFileId, setDraggingFileId] = useState<string | null>(null);
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [touchGhost, setTouchGhost] = useState<TouchGhost>(null);

  const [desktopDragTitle, setDesktopDragTitle] = useState("");
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeFileTitle, setActiveFileTitle] = useState("");

  const [fileReorderTarget, setFileReorderTarget] = useState<{
    draggingId: string;
    targetId: string;
    position: "before" | "after";
  } | null>(null);

  const [isPreviewZoneActive, setIsPreviewZoneActive] = useState(false);
  const [isDesktopFileDragging, setIsDesktopFileDragging] = useState(false);
  const [isBulkMoveMode, setIsBulkMoveMode] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [folderReorderTarget, setFolderReorderTarget] = useState<{
    draggingId: string;
    targetId: string;
    position: "before" | "after";
  } | null>(null);

  const [viewMode, setViewMode] = useState<"card" | "list">(() => {
    if (typeof window === "undefined") return "card";
    const saved = window.localStorage.getItem("explorer-view-mode");
    return saved === "list" ? "list" : "card";
  });

  const router = useRouter();

  const canManage = id
    ? session?.user?.email === owner
    : !!session?.user?.email;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const touchDragRef = useRef<TouchDragState>(null);

  const contentAreaRef = useRef<HTMLDivElement | null>(null);

  const isAnyDragging = Boolean(
    draggingFileId || draggingFolderId || touchGhost || isDesktopFileDragging,
  );
  const isFileDragging = Boolean(draggingFileId || isDesktopFileDragging);

  const resetDragVisualState = () => {
    setDraggingFileId(null);
    setDraggingFolderId(null);
    setTouchGhost(null);
    setDragOverFolderId(null);
    setIsPreviewZoneActive(false);
    setFileReorderTarget(null);
    setIsDesktopFileDragging(false);
    setDesktopDragTitle("");
    setActiveFileId(null);
    setActiveFileTitle("");
    setFolderReorderTarget(null);
  };

  const sortFolders = (list: any[]) => {
    const likedItems = [...list]
      .filter((item) => item.liked === true)
      .sort((a, b) => b.order - a.order);

    const unlikedItems = [...list]
      .filter((item) => item.liked !== true)
      .sort((a, b) => b.order - a.order);

    return [...likedItems, ...unlikedItems];
  };

  const canReorderFolders = (draggingId: string, targetId: string) => {
    if (!draggingId || !targetId || draggingId === targetId) return false;

    const draggingItem = folders.find((item: any) => item.id === draggingId);
    const targetItem = folders.find((item: any) => item.id === targetId);

    if (!draggingItem || !targetItem) return false;
    if (draggingItem.id === "temp" || targetItem.id === "temp") return false;

    return (draggingItem.liked === true) === (targetItem.liked === true);
  };

  const getNewFolderOrderForDrop = ({
    group,
    draggingId,
    targetId,
    position,
  }: {
    group: any[];
    draggingId: string;
    targetId: string;
    position: "before" | "after";
  }) => {
    const filtered = group.filter((item) => item.id !== draggingId);
    const targetIndex = filtered.findIndex((item) => item.id === targetId);

    if (targetIndex === -1) return null;

    const prevItem =
      position === "before" ? filtered[targetIndex - 1] : filtered[targetIndex];
    const nextItem =
      position === "before" ? filtered[targetIndex] : filtered[targetIndex + 1];

    if (prevItem && nextItem) {
      const middle = Math.floor((prevItem.order + nextItem.order) / 2);

      if (middle === prevItem.order || middle === nextItem.order) {
        return position === "before" ? nextItem.order + 1 : prevItem.order - 1;
      }

      return middle;
    }

    if (!prevItem && nextItem) return nextItem.order + 1;
    if (prevItem && !nextItem) return prevItem.order - 1;

    return Date.now();
  };

  const reorderFolderItems = async (
    draggingId: string,
    targetId: string,
    position: "before" | "after",
  ) => {
    if (!canManage) return;
    if (!canReorderFolders(draggingId, targetId)) return;

    const draggingItem = folders.find((item: any) => item.id === draggingId);
    const targetItem = folders.find((item: any) => item.id === targetId);

    if (!draggingItem || !targetItem) return;

    const sameGroup = sortFolders(
      folders.filter(
        (item: any) => (item.liked === true) === (draggingItem.liked === true),
      ),
    );

    const newOrder = getNewFolderOrderForDrop({
      group: sameGroup,
      draggingId,
      targetId,
      position,
    });

    if (newOrder == null || newOrder === draggingItem.order) {
      setFolderReorderTarget(null);
      return;
    }

    const prevFolders = [...folders];

    const nextFolders = sortFolders(
      folders.map((item: any) =>
        item.id === draggingId ? { ...item, order: newOrder } : item,
      ),
    );

    setFolders(nextFolders);

    try {
      const final = await editItemOrder({
        id: draggingId,
        order: newOrder,
        type: "folder",
        email: session?.user?.email,
      });

      if (!(final?.message === "결과" && final?.data?.status === "성공")) {
        setFolders(prevFolders);
        toast({
          title: "알림",
          description: "폴더 순서 변경에 실패했습니다",
        });
      }
    } catch (error) {
      console.error(error);
      setFolders(prevFolders);
      toast({
        title: "알림",
        description: "폴더 순서 변경 중 오류가 발생했습니다",
      });
    } finally {
      resetDragVisualState();
    }
  };

  const displayFolders = React.useMemo(() => {
    const base = folders.map((item: any) => ({
      type: "folder" as const,
      item,
    }));

    if (!draggingFolderId || !folderReorderTarget) {
      return base;
    }

    const draggingItem = folders.find(
      (item: any) => item.id === draggingFolderId,
    );
    const targetItem = folders.find(
      (item: any) => item.id === folderReorderTarget.targetId,
    );

    if (!draggingItem || !targetItem) return base;

    if ((draggingItem.liked === true) !== (targetItem.liked === true)) {
      return base;
    }

    const withoutDragging = base.filter(
      (entry: any) => entry.item.id !== draggingFolderId,
    );

    const targetIndex = withoutDragging.findIndex(
      (entry: any) => entry.item.id === folderReorderTarget.targetId,
    );

    if (targetIndex === -1) return base;

    const insertIndex =
      folderReorderTarget.position === "before" ? targetIndex : targetIndex + 1;

    const next = [...withoutDragging];
    next.splice(insertIndex, 0, {
      type: "placeholder" as const,
      id: `folder-placeholder-${draggingFolderId}`,
    });

    return next;
  }, [folders, draggingFolderId, folderReorderTarget]);

  const {
    selectedItems,
    setSelectedItems,
    isSelected,
    toggleSelectedItem,
    clearSelectedItems: baseClearSelectedItems,
    selectAllItemsInCurrentPage,
  } = useSelection();

  const clearSelectedItems = () => {
    baseClearSelectedItems();
    closeBulkMoveMenu();
    setIsBulkMoveMode(false);
  };

  const {
    isPreviewMode,
    setIsPreviewMode,
    previewTarget,
    setPreviewTarget,
    previewContent,
    isPreviewLoading,
    openPreviewFile,
    closePreview,
  } = usePreview({
    onAfterOpen: resetDragVisualState,
  });

  const {
    location,
    location2,
    bulkMoveMenuLocation,
    setLocation,
    setLocation2,
    setBulkMoveMenuLocation,
    closeBaseMenu,
    closeItemMenu,
    closeBulkMoveMenu,
    closeAllMenus,
    openBaseMenu,
    openItemMenu,
    toggleBulkMoveMenu,
  } = useMenuState();

  const { isDownloading, downloadMessage, downloadSelectedItems } = useDownload(
    {
      sessionEmail: session?.user?.email,
      selectedItems,
      datas,
      folders,
      toast,
      onSuccess: clearSelectedItems,
    },
  );

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "card" ? "list" : "card"));
    closeAllMenus();
  };

  const getQueryEmail = () => {
    if (session?.user?.email) return session.user.email;
    if (id && owner) return owner;
    return "";
  };

  const getMenuPositionInContent = (e: React.MouseEvent | MouseEvent) => {
    const container = contentAreaRef.current;

    if (!container) {
      return {
        x: e.pageX,
        y: e.pageY,
      };
    }

    const rect = container.getBoundingClientRect();

    return {
      x: e.clientX - rect.left + container.scrollLeft,
      y: e.clientY - rect.top + container.scrollTop,
    };
  };

  const getElementPositionInContent = (element: HTMLElement) => {
    const container = contentAreaRef.current;

    if (!container) {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.bottom,
      };
    }

    const containerRect = container.getBoundingClientRect();
    const rect = element.getBoundingClientRect();

    return {
      x: rect.left - containerRect.left + container.scrollLeft,
      y: rect.bottom - containerRect.top + container.scrollTop + 8,
    };
  };

  const sortFiles = (list: any[]) => {
    const likedItems = [...list]
      .filter((item) => item.liked === true)
      .sort((a, b) => b.order - a.order);

    const unlikedItems = [...list]
      .filter((item) => item.liked !== true)
      .sort((a, b) => b.order - a.order);

    return [...likedItems, ...unlikedItems];
  };

  const getDropPositionByIndex = (
    draggingId: string,
    targetId: string,
    allItems: any[],
  ): "before" | "after" => {
    const visible = sortFiles(allItems);
    const draggingIndex = visible.findIndex((item) => item.id === draggingId);
    const targetIndex = visible.findIndex((item) => item.id === targetId);

    if (draggingIndex === -1 || targetIndex === -1) return "before";

    return draggingIndex < targetIndex ? "after" : "before";
  };

  const getNewOrderForDrop = ({
    group,
    draggingId,
    targetId,
    position,
  }: {
    group: any[];
    draggingId: string;
    targetId: string;
    position: "before" | "after";
  }) => {
    const filtered = group.filter((item) => item.id !== draggingId);
    const targetIndex = filtered.findIndex((item) => item.id === targetId);

    if (targetIndex === -1) return null;

    const prevItem =
      position === "before" ? filtered[targetIndex - 1] : filtered[targetIndex];
    const nextItem =
      position === "before" ? filtered[targetIndex] : filtered[targetIndex + 1];

    if (prevItem && nextItem) {
      const middle = Math.floor((prevItem.order + nextItem.order) / 2);

      if (middle === prevItem.order || middle === nextItem.order) {
        return position === "before" ? nextItem.order + 1 : prevItem.order - 1;
      }

      return middle;
    }

    if (!prevItem && nextItem) {
      return nextItem.order + 1;
    }

    if (prevItem && !nextItem) {
      return prevItem.order - 1;
    }

    return Date.now();
  };

  const canReorderFiles = (draggingId: string, targetId: string) => {
    if (!draggingId || !targetId || draggingId === targetId) return false;

    const draggingItem = datas.find((item: any) => item.id === draggingId);
    const targetItem = datas.find((item: any) => item.id === targetId);

    if (!draggingItem || !targetItem) return false;
    if (draggingItem.id === "temp" || targetItem.id === "temp") return false;

    return (draggingItem.liked === true) === (targetItem.liked === true);
  };

  const reorderFileItems = async (
    draggingId: string,
    targetId: string,
    position: "before" | "after",
  ) => {
    if (!canManage) return;
    if (!canReorderFiles(draggingId, targetId)) return;

    const draggingItem = datas.find((item: any) => item.id === draggingId);
    const targetItem = datas.find((item: any) => item.id === targetId);

    if (!draggingItem || !targetItem) return;

    const sameGroup = sortFiles(
      datas.filter(
        (item: any) => (item.liked === true) === (draggingItem.liked === true),
      ),
    );

    const newOrder = getNewOrderForDrop({
      group: sameGroup,
      draggingId,
      targetId,
      position,
    });

    if (newOrder == null || newOrder === draggingItem.order) {
      setFileReorderTarget(null);
      return;
    }

    const prevDatas = [...datas];
    const nextDatas = sortFiles(
      datas.map((item: any) =>
        item.id === draggingId ? { ...item, order: newOrder } : item,
      ),
    );

    setDatas(nextDatas);

    try {
      const final = await editItemOrder({
        id: draggingId,
        order: newOrder,
        type: "text",
        email: session?.user?.email,
      });

      if (!(final?.message === "결과" && final?.data?.status === "성공")) {
        setDatas(prevDatas);
        toast({
          title: "알림",
          description: "순서 변경에 실패했습니다",
        });
      }
    } catch (error) {
      console.error(error);
      setDatas(prevDatas);
      toast({
        title: "알림",
        description: "순서 변경 중 오류가 발생했습니다",
      });
    } finally {
      resetDragVisualState();
    }
  };

  const handleFileDragStart = (event: any) => {
    const id = String(event.active.id);
    const item = datas.find((x: any) => x.id === id);
    if (!item) return;

    setActiveFileId(id);
    setActiveFileTitle(item.realTitle);
    setDraggingFileId(id);
    setIsDesktopFileDragging(true);
    setDesktopDragTitle(item.realTitle);
    setTouchGhost(null);
  };

  const handleFileDragOver = (event: any) => {
    const overId = event.over?.id ? String(event.over.id) : null;

    if (!overId) {
      setDragOverFolderId(null);
      setIsPreviewZoneActive(false);
      return;
    }

    if (
      overId === "preview-drop-zone" ||
      overId === "preview-panel-drop-zone"
    ) {
      setIsPreviewZoneActive(true);
      setDragOverFolderId(null);
      return;
    }

    if (overId.startsWith("folder:")) {
      setIsPreviewZoneActive(false);
      setDragOverFolderId(overId.replace("folder:", ""));
      return;
    }

    setIsPreviewZoneActive(false);
    setDragOverFolderId(null);
  };

  const handleFileDragEnd = async (event: any) => {
    const activeId = event.active?.id ? String(event.active.id) : null;
    const overId = event.over?.id ? String(event.over.id) : null;

    if (!activeId) {
      resetDragVisualState();
      return;
    }

    const activeItem = datas.find((x: any) => x.id === activeId);
    if (!activeItem) {
      resetDragVisualState();
      return;
    }

    if (!overId || overId === activeId) {
      resetDragVisualState();
      return;
    }

    if (
      overId === "preview-drop-zone" ||
      overId === "preview-panel-drop-zone"
    ) {
      openPreviewFile(activeItem.id, activeItem.realTitle);
      resetDragVisualState();
      return;
    }

    if (overId.startsWith("folder:")) {
      const folderId = overId.replace("folder:", "");
      const targetFolder = folders.find((f: any) => f.id === folderId);
      await moveFileToFolder(
        activeItem.id,
        activeItem.realTitle,
        activeItem.parentId,
        folderId,
        targetFolder?.realTitle,
      );
      resetDragVisualState();
      return;
    }

    const overItem = datas.find((x: any) => x.id === overId);
    if (!overItem) {
      resetDragVisualState();
      return;
    }

    if ((activeItem.liked === true) !== (overItem.liked === true)) {
      resetDragVisualState();
      return;
    }

    const group = sortFiles(
      datas.filter(
        (item: any) => (item.liked === true) === (activeItem.liked === true),
      ),
    );
    const oldIndex = group.findIndex((item: any) => item.id === activeId);
    const newIndex = group.findIndex((item: any) => item.id === overId);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      resetDragVisualState();
      return;
    }

    const position: "before" | "after" =
      oldIndex < newIndex ? "after" : "before";
    await reorderFileItems(activeId, overId, position);
  };

  const getAllFoldersFlat = async () => {
    const email = getQueryEmail();
    if (!email) return [];
    const final = await fetchAllFoldersFlat(email);
    return final.data || [];
  };

  const uploadWritten = async () => {
    try {
      const key = Date.now();
      let file: any = document.createElement("input");
      file.type = "file";
      file.addEventListener("change", async () => {
        if (file.files[0].type !== "text/plain") {
          toast({
            title: "알림",
            description: "txt 파일만 올릴 수 있습니다",
          });
          return;
        }
        const fileName = file.files[0].name.split(".txt")[0];
        const fileRef = ref(storage, `texts/${fileName}:${key}.txt`);
        await uploadBytes(fileRef, file.files[0]).then(async (snapshot) => {
          getDownloadURL(snapshot.ref).then(async (downUrl) => {
            const final = await createTextItem({
              title: `${fileName}:${key}`,
              path: downUrl,
              order: key,
              realTitle: fileName,
              user: session?.user?.email,
              liked: false,
              parentId: id || "0",
            });
            if (final.message === "무라사키") {
              const semi = datas.slice(0);
              semi.unshift(final.data);
              setDatas(semi);
            } else {
              toast({
                title: "알림",
                description: "업로드에 실패하셨습니다",
              });
              await deleteTextItem({
                id: "nope",
                title: `${fileName}:${key}`,
                email: session?.user?.email,
              });
            }
            setLocation({
              x: -1,
              y: -1,
            });
          });
        });
      });
      file.click();
    } catch (e) {}
  };

  const dropUploadWritten = (file: any) => {
    if (file.type !== "text/plain") {
      toast({
        title: "알림",
        description: "txt 파일만 올릴 수 있습니다",
      });
      return;
    }
    appSwal
      .fire({
        title: "파일 업로드",
        text: "파일을 업로드 하시겠습니까?",
        showCancelButton: true,
        confirmButtonText: "확인",
        cancelButtonText: "취소",
        icon: icons.question.icon,
        iconColor: icons.question.color,
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          const key = Date.now();
          const fileName = file.name.split(".txt")[0];
          const fileRef = ref(storage, `texts/${fileName}:${key}.txt`);
          await uploadBytes(fileRef, file).then(async (snapshot) => {
            getDownloadURL(snapshot.ref).then(async (downUrl) => {
              const final = await createTextItem({
                title: `${fileName}:${key}`,
                path: downUrl,
                order: key,
                realTitle: fileName,
                user: session?.user?.email,
                liked: false,
                parentId: id || "0",
              });
              if (final.message === "무라사키") {
                const semi = datas.slice(0);
                semi.unshift(final.data);
                setDatas(semi);
              } else {
                toast({
                  title: "알림",
                  description: "업로드에 실패하셨습니다",
                });
                await deleteTextItem({
                  id: "nope",
                  title: `${fileName}:${key}`,
                  email: session?.user?.email,
                });
              }
              setLocation({
                x: -1,
                y: -1,
              });
            });
          });
        }
      });
  };

  const addWritten = async () => {
    if (isAdding) return;

    setIsAdding(true);
    const key = Date.now();
    const file = new Blob([""], { type: "text/plain;charset=utf-8" });
    const fileName = `untitled-${dataCount[dataCount.length - 1]}`;

    const optimisticData = {
      id: "temp",
      title: `${fileName}:${key}`,
      path: "",
      order: key,
      realTitle: fileName,
      user: session?.user?.email,
      liked: false,
      parentId: id || "0",
    };
    const temp = [optimisticData, ...datas];
    setDatas((prevDatas: any) => [optimisticData, ...prevDatas]);
    setDataCount([...dataCount, dataCount[dataCount.length - 1] + 1]);
    const fileRef = ref(storage, `texts/${fileName}:${key}.txt`);
    try {
      const snapshot = await uploadBytes(fileRef, file);
      const downUrl = await getDownloadURL(snapshot.ref);
      const final = await createTextItem({
        title: `${fileName}:${key}`,
        path: downUrl,
        order: key,
        realTitle: fileName,
        user: session?.user?.email,
        liked: false,
        parentId: id || "0",
      });
      if (final.message === "무라사키") {
        let tempCopy = temp.slice(0);
        tempCopy = tempCopy.map((item: any) => {
          return item.title === optimisticData.title
            ? { ...item, path: downUrl, id: final.data.id }
            : item;
        });
        setDatas(tempCopy);
      } else {
        toast({
          title: "알림",
          description: "업로드에 실패하셨습니다",
        });
        setDatas((prevDatas: any) =>
          prevDatas.filter((item: any) => item.id !== optimisticData.id),
        );
        await deleteTextItem({
          id: "nope",
          title: `${fileName}:${key}`,
          email: session?.user?.email,
        });
      }
    } catch (error) {
      console.error("Error adding text:", error);
      toast({
        title: "알림",
        description: "업로드에 실패하셨습니다",
      });
      setDatas((prevDatas: any) =>
        prevDatas.filter((item: any) => item.id !== optimisticData.id),
      );
    } finally {
      setIsAdding(false);
    }
  };

  const getFolders = async () => {
    const email = getQueryEmail();
    if (!email) return [];

    const tempfolders = await fetchFoldersByParentId(email, id || "0");

    const sorted = tempfolders.data
      .sort((x: any, y: any) => x.order - y.order)
      .reverse();

    const likedItems = sorted
      .filter((item: any) => item.liked === true)
      .sort((x: any, y: any) => x.order - y.order);
    const unlikedItems = sorted.filter((item: any) => item.liked !== true);
    const finalSorted = [...likedItems.reverse(), ...unlikedItems];

    setFolders(finalSorted);
    setFoldersCount([finalSorted.length - 1]);

    return finalSorted;
  };

  const getWritten = async () => {
    const email = getQueryEmail();

    if (!email) {
      return;
    }

    await getFolders();

    const texts = await fetchTextsByParentId(email, id || "0");

    const finalSorted = sortFiles(texts.data || []);
    setDatas(finalSorted);

    setDatas(finalSorted);
    setDataCount([finalSorted.length]);
    setLoading(false);
  };

  const addFolders = async () => {
    if (isAdding) return;

    setIsAdding(true);
    const key = Date.now();
    const fileName = `untitled-${foldersCount[foldersCount.length - 1] + 1}`;

    const optimisticData = {
      id: "temp",
      title: `${fileName}:${key}`,
      path: "",
      order: key,
      realTitle: fileName,
      user: session?.user?.email,
      liked: false,
      parentId: id || "0",
    };
    const temp = [optimisticData, ...folders];
    setFolders((prevDatas: any) => [optimisticData, ...prevDatas]);
    setFoldersCount([
      ...foldersCount,
      foldersCount[foldersCount.length - 1] + 1,
    ]);
    try {
      const final = await createFolderItem({
        title: `${fileName}:${key}`,
        order: key,
        realTitle: fileName,
        user: session?.user?.email,
        liked: false,
        parentId: id || "0",
      });
      if (final.message == "무라사키") {
        let tempCopy = temp.slice(0);
        tempCopy = tempCopy.map((item: any) => {
          return item.title === optimisticData.title
            ? { ...item, id: final.data.id }
            : item;
        });
        setFolders(tempCopy);
      } else {
        toast({
          title: "알림",
          description: "업로드에 실패하셨습니다",
        });
        setFolders((prevDatas: any) =>
          prevDatas.filter((item: any) => item.id !== optimisticData.id),
        );
      }
    } catch (error) {
      console.error("Error adding folder:", error);
      toast({
        title: "알림",
        description: "업로드에 실패하셨습니다",
      });
      setFolders((prevDatas: any) =>
        prevDatas.filter((item: any) => item.id !== optimisticData.id),
      );
    } finally {
      setLocation({
        x: -1,
        y: -1,
      });
      setIsAdding(false);
    }
  };

  const deleteWritten = async (id: string, title: string) => {
    appSwal
      .fire({
        title: "삭제 확인 알림",
        text: "해당 텍스트를 삭제하시겠습니까",
        icon: icons.warning.icon,
        iconColor: icons.warning.color,
        showCancelButton: true,
        confirmButtonText: "확인",
        cancelButtonText: "취소",
      })
      .then(async (result) => {
        if (!result.isConfirmed) return;

        const prevDatas = [...datas];
        const prevSelectedItems = [...selectedItems];

        const newDatas = datas.filter((item: any) => item.id !== id);
        setDatas(newDatas);

        setSelectedItems((prev) =>
          prev.filter((item) => !(item.type === "file" && item.id === id)),
        );

        try {
          const final = await deleteTextItem({
            id,
            title,
            email: session?.user?.email,
          });

          if (!(final.message === "결과" && final.data.status === "성공")) {
            setDatas(prevDatas);
            setSelectedItems(prevSelectedItems);
            toast({
              title: "알림",
              description: "삭제에 실패했습니다",
            });
          }
        } catch (error) {
          console.error(error);
          setDatas(prevDatas);
          setSelectedItems(prevSelectedItems);
          toast({
            title: "알림",
            description: "삭제 요청 중 오류가 발생했습니다",
          });
        }
      });
  };

  const deleteFolder = async (id: string) => {
    appSwal
      .fire({
        title: "삭제 확인 알림",
        text: "해당 폴더를 삭제하시겠습니까",
        icon: icons.warning.icon,
        iconColor: icons.warning.color,
        showCancelButton: true,
        confirmButtonText: "확인",
        cancelButtonText: "취소",
      })
      .then(async (result) => {
        if (!result.isConfirmed) return;

        const prevFolders = [...folders];
        const prevSelectedItems = [...selectedItems];

        const newFolders = folders.filter((item: any) => item.id !== id);
        setFolders(newFolders);

        setSelectedItems((prev) =>
          prev.filter((item) => !(item.type === "folder" && item.id === id)),
        );

        try {
          const final = await deleteFolderItem({
            id,
            email: session?.user?.email,
          });

          if (!(final.message === "결과" && final.data.status === "성공")) {
            setFolders(prevFolders);
            setSelectedItems(prevSelectedItems);
            toast({
              title: "알림",
              description: "삭제에 실패했습니다",
            });
          }
        } catch (error) {
          console.error(error);
          setFolders(prevFolders);
          setSelectedItems(prevSelectedItems);
          toast({
            title: "알림",
            description: "삭제 요청 중 오류가 발생했습니다",
          });
        }
      });
  };

  const editTitle = async (id: string, newTitle: string) => {
    if (newTitle.length <= 0) {
      toast({
        title: "알림",
        description: "한 글자 이상이어야 합니다",
      });
      return;
    }

    const key = modSwitch;
    setModSwitch(-1);

    if (key >= 0) {
      await editTextTitleItem({
        id,
        newTitle,
        email: session?.user?.email,
      });
    } else {
      await editFolderTitleItem({
        id,
        newTitle,
        email: session?.user?.email,
      });
    }
  };

  const handleEditTitle = (
    e: React.MouseEvent,
    idx: number,
    inputId: string,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setModSwitch(idx);

    setTimeout(() => {
      const inputElement = document.querySelector(
        `#${inputId}`,
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 0);
  };

  const updateFileTitleDraft = (idx: number, value: string) => {
    setDatas((prev: any[]) => {
      const temp = [...prev];
      temp[idx] = {
        ...temp[idx],
        realTitle: value,
      };
      return temp;
    });
  };

  const editPath = async (
    itemId: string,
    type: string,
    newPath: string,
    parentId: string,
  ) => {
    if (parentId === newPath) {
      toast({
        title: "알림",
        description: "같은 경로로는 이동할 수 없습니다",
      });
      return false;
    }

    if (type === "folder") {
      if (itemId === newPath) {
        toast({
          title: "알림",
          description: "현재 폴더와 동일한 위치입니다",
        });
        return false;
      }

      const allFolders = await getAllFoldersFlat();

      if (isDescendantFolder(itemId, newPath, allFolders)) {
        toast({
          title: "알림",
          description: "이동하려는 위치가 현재 폴더 내부에 포함되어 있습니다",
        });
        return false;
      }
    }
    const final = await editChildrenPath({
      id: itemId,
      type,
      newPath,
      email: session?.user?.email,
    });
    if (final.message == "경로 수정 성공") {
      if (type === "folder") {
        const temp = [];
        for (let i = 0; i < folders.length; i++) {
          if (folders[i].id !== itemId) {
            temp.push(folders[i]);
          }
        }
        setFolders(temp);
      } else {
        const tempArr = [];
        for (let i = 0; i < datas.length; i++) {
          if (datas[i].id !== itemId) {
            tempArr.push(datas[i]);
          }
        }
        setDatas(tempArr);
      }
      toast({
        title: "알림",
        description: `${type === "folder" ? "폴더가" : "파일이"} 이동되었습니다`,
      });
      setLocation2({
        x: -1,
        y: -1,
        id: "",
        fileType: "",
        parentId: "",
      });
      return true;
    }
    return false;
  };

  const moveFileToFolder = async (
    fileId: string,
    title: string,
    parentId: string,
    folderId: string,
    folderTitle?: string,
  ) => {
    if (!canManage) {
      toast({
        title: "알림",
        description: "이동 권한이 없습니다",
      });
      return;
    }
    const result = await appSwal.fire({
      title: "파일 이동",
      text: folderTitle
        ? `${title} 파일을 ${folderTitle} 폴더로 이동하시겠습니까?`
        : `${title} 파일을 이 폴더로 이동하시겠습니까?`,
      icon: icons.question.icon,
      iconColor: icons.question.color,
      showCancelButton: true,
      confirmButtonText: "이동",
      cancelButtonText: "취소",
    });

    if (!result.isConfirmed) return;

    const moved = await editPath(fileId, "file", folderId, parentId);

    if (moved) {
      setSelectedItems((prev) =>
        prev.filter((item) => !(item.type === "file" && item.id === fileId)),
      );
    }
  };

  const moveFolderToFolder = async (
    folderId: string,
    title: string,
    parentId: string,
    targetFolderId: string,
    targetFolderTitle?: string,
  ) => {
    if (!canManage) {
      toast({
        title: "알림",
        description: "이동 권한이 없습니다",
      });
      return;
    }
    if (folderId === targetFolderId) {
      // toast({
      //   title: "알림",
      //   description: "현재 폴더와 동일한 위치입니다",
      // });
      return;
    }

    const allFolders = await getAllFoldersFlat();

    if (isDescendantFolder(folderId, targetFolderId, allFolders)) {
      toast({
        title: "알림",
        description: "이동하려는 위치가 현재 폴더 내부에 포함되어 있습니다",
      });
      return;
    }

    const result = await appSwal.fire({
      title: "폴더 이동",
      text: targetFolderTitle
        ? `${title} 폴더를 ${targetFolderTitle} 폴더로 이동하시겠습니까?`
        : `${title} 폴더를 이 폴더로 이동하시겠습니까?`,
      icon: icons.question.icon,
      iconColor: icons.question.color,
      showCancelButton: true,
      confirmButtonText: "이동",
      cancelButtonText: "취소",
    });

    if (!result.isConfirmed) return;

    const moved = await editPath(folderId, "folder", targetFolderId, parentId);

    if (moved) {
      setSelectedItems((prev) =>
        prev.filter(
          (item) => !(item.type === "folder" && item.id === folderId),
        ),
      );
    }
  };

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "알림",
        description: "선택된 항목이 없습니다",
      });
      return;
    }

    const result = await appSwal.fire({
      title: "선택 항목 삭제",
      text: `${selectedItems.length}개 항목을 삭제하시겠습니까?`,
      icon: icons.warning.icon,
      iconColor: icons.warning.color,
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
    });

    if (!result.isConfirmed) return;

    const prevDatas = [...datas];
    const prevFolders = [...folders];

    const selectedFileIds = selectedItems
      .filter((item) => item.type === "file")
      .map((item) => item.id);

    const selectedFolderIds = selectedItems
      .filter((item) => item.type === "folder")
      .map((item) => item.id);

    setDatas((prev: any[]) =>
      prev.filter((item) => !selectedFileIds.includes(item.id)),
    );
    setFolders((prev: any[]) =>
      prev.filter((item) => !selectedFolderIds.includes(item.id)),
    );

    try {
      const requests = [
        ...selectedItems
          .filter((item) => item.type === "file")
          .map((item) =>
            deleteTextItem({
              id: item.id,
              title: datas.find((d: any) => d.id === item.id)?.title,
              email: session?.user?.email,
            }),
          ),
        ...selectedItems
          .filter((item) => item.type === "folder")
          .map((item) =>
            deleteFolderItem({
              id: item.id,
              email: session?.user?.email,
            }),
          ),
      ];

      const results = await Promise.all(requests);
      const failed = results.some(
        (final: any) =>
          !(final?.message === "결과" && final?.data?.status === "성공"),
      );

      if (failed) {
        setDatas(prevDatas);
        setFolders(prevFolders);
        toast({
          title: "알림",
          description: "일부 항목 삭제에 실패했습니다",
        });
        return;
      }

      clearSelectedItems();

      toast({
        title: "알림",
        description: "선택 항목이 삭제되었습니다",
      });
    } catch (error) {
      console.error(error);
      setDatas(prevDatas);
      setFolders(prevFolders);
      toast({
        title: "알림",
        description: "일괄 삭제 중 오류가 발생했습니다",
      });
    }
  };

  const moveSelectedItemsToFolder = async (
    targetFolderId: string,
    targetFolderTitle?: string,
  ) => {
    if (!canManage) {
      toast({
        title: "알림",
        description: "이동 권한이 없습니다",
      });
      return;
    }
    if (selectedItems.length === 0) {
      toast({
        title: "알림",
        description: "선택된 항목이 없습니다",
      });
      return;
    }

    const selectedFolders = selectedItems.filter(
      (item) => item.type === "folder",
    );

    if (selectedFolders.some((item) => item.id === targetFolderId)) {
      toast({
        title: "알림",
        description: "현재 폴더와 동일한 위치입니다",
      });
      return;
    }

    const allFolders = await getAllFoldersFlat();

    const hasInvalidFolderMove = selectedFolders.some((item) =>
      isDescendantFolder(item.id, targetFolderId, allFolders),
    );

    if (hasInvalidFolderMove) {
      toast({
        title: "알림",
        description: "이동하려는 위치가 현재 폴더 내부에 포함되어 있습니다",
      });
      return;
    }

    const result = await appSwal.fire({
      title: "선택 항목 이동",
      text: targetFolderTitle
        ? `${selectedItems.length}개 항목을 ${targetFolderTitle} 폴더로 이동하시겠습니까?`
        : `${selectedItems.length}개 항목을 이 폴더로 이동하시겠습니까?`,
      icon: icons.question.icon,
      iconColor: icons.question.color,
      showCancelButton: true,
      confirmButtonText: "이동",
      cancelButtonText: "취소",
    });

    if (!result.isConfirmed) return;

    const prevDatas = [...datas];
    const prevFolders = [...folders];

    try {
      const responses = await Promise.all(
        selectedItems.map((item) =>
          editChildrenPath({
            id: item.id,
            type: item.type,
            newPath: targetFolderId,
            email: session?.user?.email,
          }),
        ),
      );
      const failed = responses.some(
        (final: any) => final?.message !== "경로 수정 성공",
      );

      if (failed) {
        setDatas(prevDatas);
        setFolders(prevFolders);
        toast({
          title: "알림",
          description: "일부 항목 이동에 실패했습니다",
        });
        return;
      }

      const selectedFileIds = selectedItems
        .filter((item) => item.type === "file")
        .map((item) => item.id);

      const selectedFolderIds = selectedItems
        .filter((item) => item.type === "folder")
        .map((item) => item.id);

      setDatas((prev: any[]) =>
        prev.filter((item) => !selectedFileIds.includes(item.id)),
      );
      setFolders((prev: any[]) =>
        prev.filter((item) => !selectedFolderIds.includes(item.id)),
      );

      clearSelectedItems();
      setLocation2({
        x: -1,
        y: -1,
        id: "",
        fileType: "",
        parentId: "",
      });

      setBulkMoveMenuLocation({
        x: -1,
        y: -1,
        id: "",
        fileType: "",
        parentId: "",
      });

      toast({
        title: "알림",
        description: "선택 항목이 이동되었습니다",
      });
    } catch (error) {
      console.error(error);
      setDatas(prevDatas);
      setFolders(prevFolders);
      toast({
        title: "알림",
        description: "일괄 이동 중 오류가 발생했습니다",
      });
    }
  };

  const getParentId = async () => {
    if (!id) return;
    const final = await fetchFolderParentInfo(id);
    setLoadedParentId(final.data[0].parentId);
    setOwner(final.data[0].user);
  };

  const changePosition = (list: any[]) => {
    const tempData = list.map((data: any) =>
      data.id === testSwitch.id
        ? { ...data, liked: testSwitch.changeTo }
        : data,
    );

    return sortFiles(tempData);
  };

  useEffect(() => {
    if (pathName === "folder") getParentId();
  }, []);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
    }

    if (id === undefined) {
      if (session?.user?.email && session.user.email !== previousEmail) {
        getWritten();
        setPreviousEmail(session.user.email);
      }
      return;
    }

    if (session?.user?.email || owner) {
      getWritten();
      setPreviousEmail(session?.user?.email);
    }
  }, [session?.user?.email, owner, id]);

  useEffect(() => {
    if (testSwitch.changeTo !== null) {
      if (testSwitch.type === "text") {
        setDatas(changePosition(datas.slice(0)));
      } else {
        setFolders(changePosition(folders.slice(0)));
      }
    }
  }, [testSwitch]);

  useEffect(() => {
    window.localStorage.setItem("explorer-view-mode", viewMode);
  }, [viewMode]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleFileDragStart}
      onDragOver={handleFileDragOver}
      onDragEnd={handleFileDragEnd}
      onDragCancel={resetDragVisualState}
    >
      <div className="flex h-screen w-full flex-col overflow-hidden md:flex-row">
        <HelpModal open={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        {isDownloading && (
          <div
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-4"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              className="flex min-w-[220px] flex-col items-center justify-center gap-4 rounded-2xl border-2 px-8 py-7 shadow-2xl"
              style={{
                backgroundColor: "var(--color-bg-primary)",
                borderColor: "var(--color-customBorder)",
                color: "var(--color-primary)",
              }}
            >
              <SpinnerMini />
              <div className="text-center text-sm sm:text-base">
                {downloadMessage || "처리 중..."}
              </div>
            </div>
          </div>
        )}
        {isPreviewMode && (
          <PreviewPanel
            previewTarget={previewTarget}
            previewContent={previewContent}
            isPreviewLoading={isPreviewLoading}
            isPreviewZoneActive={isPreviewZoneActive}
            isFileDragging={isFileDragging}
            canEdit={
              datas.find((item: any) => item.id === previewTarget?.id)?.user ===
              session?.user?.email
            }
            onEdit={() => {
              if (previewTarget?.id) {
                router.push(`/text/${previewTarget.id}`);
              }
            }}
            onClose={closePreview}
            onDropFile={(itemId, title) => {
              setIsDesktopFileDragging(false);
              openPreviewFile(itemId, title);
            }}
            onResetDragVisualState={resetDragVisualState}
          />
        )}

        <div
          ref={contentAreaRef}
          className={`relative flex flex-col items-center justify-start overflow-y-auto transition-all duration-300 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            isPreviewMode
              ? "order-2 h-1/2 w-full border-t-2 md:order-1 md:h-screen md:w-1/2 md:border-r-2 md:border-t-0"
              : "h-screen w-full"
          }`}
          style={{ borderColor: "var(--color-customBorder)" }}
          onDragOver={(e) => {
            e.preventDefault();

            if (isDesktopFileDragging && desktopDragTitle) {
              setTouchGhost({
                title: desktopDragTitle,
                x: e.clientX,
                y: e.clientY,
              });
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              dropUploadWritten(e.dataTransfer.files[0]);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            const pos = getMenuPositionInContent(e);
            openBaseMenu(pos.x, pos.y);
          }}
          onClick={(e) => {
            e.preventDefault();
            closeAllMenus();
            if (modSwitch !== -1) {
              if (modSwitch >= 0) {
                editTitle(currentDataId, datas[modSwitch].realTitle);
              } else {
                editTitle(
                  currentDataId,
                  folders[modSwitch / 1000 / -1 - 1].realTitle,
                );
              }
            }
          }}
        >
          {location.x !== -1 &&
            (owner == session?.user?.email || id == undefined ? (
              <Menu
                location={location}
                logined={true}
                customFunctions={{
                  addText: uploadWritten,
                  addFolder: addFolders,
                  openHelp: () => setIsHelpOpen(true),
                  toggleViewMode,
                  viewMode,
                }}
              />
            ) : (
              <Menu
                location={location}
                logined={false}
                customFunctions={{
                  addText: uploadWritten,
                  addFolder: addFolders,
                  openHelp: () => setIsHelpOpen(true),
                  toggleViewMode,
                  viewMode,
                }}
              />
            ))}

          {location2.x !== -1 &&
            (owner == session?.user?.email || id == undefined) && (
              <Menu
                type="onFile"
                location={location2}
                customFunctions={{
                  addText: uploadWritten,
                  addFolder: addFolders,
                  editPath: editPath,
                  moveSelectedItemsToFolder: moveSelectedItemsToFolder,
                  selectedItems,
                  clearSelectedItems,
                }}
              />
            )}

          {bulkMoveMenuLocation.x !== -1 && selectedItems.length > 0 && (
            <Menu
              type="onFile"
              location={bulkMoveMenuLocation}
              customFunctions={{
                addText: uploadWritten,
                addFolder: addFolders,
                editPath: editPath,
                moveSelectedItemsToFolder,
                selectedItems,
                clearSelectedItems,
              }}
            />
          )}

          {selectedItems.length > 0 && (
            <SelectionActionBar
              selectedCount={selectedItems.length}
              isDownloading={isDownloading}
              bulkMoveMenuOpen={bulkMoveMenuLocation.x !== -1}
              bulkMoveButtonRef={bulkMoveButtonRef}
              canManage={canManage}
              onDownload={downloadSelectedItems}
              onDelete={deleteSelectedItems}
              onSelectAll={() => selectAllItemsInCurrentPage(folders, datas)}
              onClear={clearSelectedItems}
              onMoveMenuToggle={() => {
                if (!canManage) return;
                if (!bulkMoveButtonRef.current) return;

                const pos = getElementPositionInContent(
                  bulkMoveButtonRef.current,
                );
                toggleBulkMoveMenu(pos.x, pos.y);
              }}
            />
          )}

          <div className="w-full">
            {loading ? (
              <div
                onContextMenu={(e) => {
                  e.stopPropagation();
                }}
                className="flex h-screen w-full items-center justify-center"
              >
                <Spinner />
              </div>
            ) : (
              <>
                <div className="w-full">
                  {owner == session?.user?.email ? (
                    <button
                      className="m-8 cursor-default"
                      onClick={() => {
                        if (owner !== session?.user?.email) return;
                        if (loadedParentId) {
                          if (loadedParentId !== "0") {
                            router.push(`/folder/${loadedParentId}`);
                          } else {
                            router.push("/");
                          }
                        }
                      }}
                    >
                      {pathName === "folder" ? (
                        <FaArrowLeft className="cursor-pointer" />
                      ) : (
                        ""
                      )}
                    </button>
                  ) : (
                    <button className="m-8 cursor-default"></button>
                  )}
                </div>

                <div className="m-8 flex select-none flex-wrap justify-center gap-8 sm:justify-start">
                  <AnimatePresence>
                    {viewMode === "card" ? (
                      folders.map((folder: any, idx: number) => {
                        const folderChecked = isSelected(folder.id, "folder");

                        return (
                          <DroppableFolderCard
                            key={folder.id}
                            folderId={folder.id}
                          >
                            <FolderCard
                              folder={folder}
                              idx={idx}
                              folderChecked={folderChecked}
                              modSwitch={modSwitch}
                              currentDataId={currentDataId}
                              sessionEmail={session?.user?.email}
                              owner={owner}
                              pageId={id}
                              draggingFolderId={draggingFolderId}
                              dragOverFolderId={dragOverFolderId}
                              folders={folders}
                              setFolders={setFolders}
                              setDraggingFolderId={setDraggingFolderId}
                              setTouchGhost={setTouchGhost}
                              setDragOverFolderId={setDragOverFolderId}
                              setIsPreviewZoneActive={setIsPreviewZoneActive}
                              setLocation={setLocation}
                              setLocation2={setLocation2}
                              setCurrentDataId={setCurrentDataId}
                              setModSwitch={setModSwitch}
                              setTestSwitch={setTestSwitch}
                              touchDragRef={touchDragRef}
                              isSelected={isSelected}
                              toggleSelectedItem={toggleSelectedItem}
                              deleteFolder={deleteFolder}
                              moveFolderToFolder={moveFolderToFolder}
                              moveSelectedItemsToFolder={
                                moveSelectedItemsToFolder
                              }
                              handleEditTitle={handleEditTitle}
                              editTitle={editTitle}
                              getMenuPositionInContent={
                                getMenuPositionInContent
                              }
                              resetDragVisualState={resetDragVisualState}
                              moveFileToFolder={moveFileToFolder}
                              routerPushFolder={(folderId) =>
                                router.push(`/folder/${folderId}`)
                              }
                              selectedItems={selectedItems}
                              clearSelectedItems={clearSelectedItems}
                              canManage={
                                id
                                  ? session?.user?.email === owner
                                  : !!session?.user?.email
                              }
                              draggingFileId={draggingFileId}
                              folderReorderTarget={folderReorderTarget}
                              setFolderReorderTarget={setFolderReorderTarget}
                              reorderFolderItems={reorderFolderItems}
                              canReorderFolders={canReorderFolders}
                            />
                          </DroppableFolderCard>
                        );
                      })
                    ) : (
                      <motion.div layout className="flex w-full flex-col gap-2">
                        {displayFolders.map((entry: any, idx: number) => {
                          if (entry.type === "placeholder") {
                            return (
                              <motion.div
                                key={entry.id}
                                layout
                                initial={{ width: 0, opacity: 0, scale: 0.96 }}
                                animate={{ width: 112, opacity: 1, scale: 1 }}
                                exit={{ width: 0, opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.18 }}
                                className="h-[160px] sm:h-[200px] sm:w-[140px]"
                                style={{
                                  border:
                                    "2px dashed var(--color-customBorder)",
                                  borderRadius: "0.375rem",
                                  backgroundColor: "rgba(59,130,246,0.06)",
                                  pointerEvents: "none",
                                }}
                              />
                            );
                          }

                          const folder = entry.item;
                          const realIdx = folders.findIndex(
                            (x: any) => x.id === folder.id,
                          );
                          const folderChecked = isSelected(folder.id, "folder");

                          return (
                            <FolderCard
                              key={folder.id}
                              folder={folder}
                              idx={realIdx}
                              folderChecked={folderChecked}
                              modSwitch={modSwitch}
                              currentDataId={currentDataId}
                              sessionEmail={session?.user?.email}
                              owner={owner}
                              pageId={id}
                              draggingFolderId={draggingFolderId}
                              draggingFileId={draggingFileId}
                              dragOverFolderId={dragOverFolderId}
                              folders={folders}
                              setFolders={setFolders}
                              setDraggingFolderId={setDraggingFolderId}
                              setTouchGhost={setTouchGhost}
                              setDragOverFolderId={setDragOverFolderId}
                              setIsPreviewZoneActive={setIsPreviewZoneActive}
                              setLocation={setLocation}
                              setLocation2={setLocation2}
                              setCurrentDataId={setCurrentDataId}
                              setModSwitch={setModSwitch}
                              setTestSwitch={setTestSwitch}
                              touchDragRef={touchDragRef}
                              isSelected={isSelected}
                              toggleSelectedItem={toggleSelectedItem}
                              deleteFolder={deleteFolder}
                              moveFolderToFolder={moveFolderToFolder}
                              moveSelectedItemsToFolder={
                                moveSelectedItemsToFolder
                              }
                              handleEditTitle={handleEditTitle}
                              editTitle={editTitle}
                              getMenuPositionInContent={
                                getMenuPositionInContent
                              }
                              resetDragVisualState={resetDragVisualState}
                              moveFileToFolder={moveFileToFolder}
                              routerPushFolder={(folderId) =>
                                router.push(`/folder/${folderId}`)
                              }
                              selectedItems={selectedItems}
                              clearSelectedItems={clearSelectedItems}
                              canManage={canManage}
                              folderReorderTarget={folderReorderTarget}
                              setFolderReorderTarget={setFolderReorderTarget}
                              reorderFolderItems={reorderFolderItems}
                              canReorderFolders={canReorderFolders}
                            />
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="m-8 flex select-none flex-wrap justify-center gap-8 sm:justify-start">
                  <AnimatePresence mode="popLayout">
                    {viewMode === "card" ? (
                      <motion.div
                        layout
                        className="flex flex-wrap justify-center gap-8 sm:justify-start"
                      >
                        {(owner == session?.user?.email || id == undefined) && (
                          <motion.div
                            className="flex h-auto max-h-[160px] w-[112px] flex-col items-center sm:max-h-[200px] sm:w-[140px]"
                            key={0}
                            layout
                            layoutId="addButton"
                            onClick={addWritten}
                            onContextMenu={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <div className="h-[160px] w-[112px] rounded-md border-2 border-dashed border-customBorder sm:h-[200px] sm:w-[140px]">
                              <div className="ml-4 mr-4 flex h-full cursor-pointer items-center justify-center text-center text-4xl">
                                +
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <SortableContext
                          items={datas
                            .filter((item: any) => item.liked === true)
                            .map((item: any) => item.id)}
                          strategy={rectSortingStrategy}
                        >
                          {datas
                            .filter((item: any) => item.liked === true)
                            .map((data: any) => {
                              const realIdx = datas.findIndex(
                                (x: any) => x.id === data.id,
                              );
                              const dataChecked = isSelected(data.id, "file");

                              return (
                                <FileCard
                                  key={data.id}
                                  data={data}
                                  idx={realIdx}
                                  dataChecked={dataChecked}
                                  modSwitch={modSwitch}
                                  sessionEmail={session?.user?.email}
                                  owner={owner}
                                  pageId={id}
                                  isPreviewMode={isPreviewMode}
                                  draggingFileId={draggingFileId}
                                  folders={folders}
                                  setDraggingFileId={setDraggingFileId}
                                  setTouchGhost={setTouchGhost}
                                  setDragOverFolderId={setDragOverFolderId}
                                  setIsPreviewZoneActive={
                                    setIsPreviewZoneActive
                                  }
                                  setLocation={setLocation}
                                  setLocation2={setLocation2}
                                  setCurrentDataId={setCurrentDataId}
                                  setIsDesktopFileDragging={
                                    setIsDesktopFileDragging
                                  }
                                  setTestSwitch={setTestSwitch}
                                  touchDragRef={touchDragRef}
                                  toggleSelectedItem={toggleSelectedItem}
                                  deleteWritten={deleteWritten}
                                  moveFileToFolder={moveFileToFolder}
                                  handleEditTitle={handleEditTitle}
                                  editTitle={editTitle}
                                  updateFileTitleDraft={updateFileTitleDraft}
                                  getMenuPositionInContent={
                                    getMenuPositionInContent
                                  }
                                  resetDragVisualState={resetDragVisualState}
                                  openPreviewFile={openPreviewFile}
                                  routerPushText={(textId) =>
                                    router.push(`/text/${textId}`)
                                  }
                                  canManage={canManage}
                                />
                              );
                            })}
                        </SortableContext>

                        <SortableContext
                          items={datas
                            .filter((item: any) => item.liked !== true)
                            .map((item: any) => item.id)}
                          strategy={rectSortingStrategy}
                        >
                          {datas
                            .filter((item: any) => item.liked !== true)
                            .map((data: any) => {
                              const realIdx = datas.findIndex(
                                (x: any) => x.id === data.id,
                              );
                              const dataChecked = isSelected(data.id, "file");

                              return (
                                <FileCard
                                  key={data.id}
                                  data={data}
                                  idx={realIdx}
                                  dataChecked={dataChecked}
                                  modSwitch={modSwitch}
                                  sessionEmail={session?.user?.email}
                                  owner={owner}
                                  pageId={id}
                                  isPreviewMode={isPreviewMode}
                                  draggingFileId={draggingFileId}
                                  folders={folders}
                                  setDraggingFileId={setDraggingFileId}
                                  setTouchGhost={setTouchGhost}
                                  setDragOverFolderId={setDragOverFolderId}
                                  setIsPreviewZoneActive={
                                    setIsPreviewZoneActive
                                  }
                                  setLocation={setLocation}
                                  setLocation2={setLocation2}
                                  setCurrentDataId={setCurrentDataId}
                                  setIsDesktopFileDragging={
                                    setIsDesktopFileDragging
                                  }
                                  setTestSwitch={setTestSwitch}
                                  touchDragRef={touchDragRef}
                                  toggleSelectedItem={toggleSelectedItem}
                                  deleteWritten={deleteWritten}
                                  moveFileToFolder={moveFileToFolder}
                                  handleEditTitle={handleEditTitle}
                                  editTitle={editTitle}
                                  updateFileTitleDraft={updateFileTitleDraft}
                                  getMenuPositionInContent={
                                    getMenuPositionInContent
                                  }
                                  resetDragVisualState={resetDragVisualState}
                                  openPreviewFile={openPreviewFile}
                                  routerPushText={(textId) =>
                                    router.push(`/text/${textId}`)
                                  }
                                  canManage={canManage}
                                />
                              );
                            })}
                        </SortableContext>
                      </motion.div>
                    ) : (
                      <motion.div layout className="flex w-full flex-col gap-2">
                        {(owner == session?.user?.email || id == undefined) && (
                          <div
                            className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-dashed px-3 py-2"
                            style={{
                              borderColor: "var(--color-customBorder)",
                              backgroundColor: "var(--color-bg-primary)",
                              color: "var(--color-primary)",
                            }}
                            onClick={addWritten}
                            onContextMenu={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="text-lg">+</span>
                              <span className="truncate">새 파일 추가</span>
                            </div>
                          </div>
                        )}

                        {datas.map((data: any, idx: number) => {
                          const dataChecked = isSelected(data.id, "file");

                          return (
                            <FileListItem
                              key={data.title}
                              data={data}
                              dataChecked={dataChecked}
                              canManage={canManage}
                              isPreviewMode={isPreviewMode}
                              toggleSelectedItem={toggleSelectedItem}
                              setTestSwitch={setTestSwitch}
                              getMenuPositionInContent={
                                getMenuPositionInContent
                              }
                              openItemMenu={openItemMenu}
                              openPreviewFile={openPreviewFile}
                              routerPushText={(textId) =>
                                router.push(`/text/${textId}`)
                              }
                              idx={idx}
                              modSwitch={modSwitch}
                              setCurrentDataId={setCurrentDataId}
                              handleEditTitle={handleEditTitle}
                              editTitle={editTitle}
                              updateFileTitleDraft={updateFileTitleDraft}
                            />
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
          <PreviewDropZone
            isFileDragging={isFileDragging}
            isPreviewZoneActive={isPreviewZoneActive}
          />

          {/* {touchGhost && isAnyDragging && (
            <div
              className="pointer-events-none fixed z-[9999] rounded-md border px-3 py-2 text-sm shadow-lg"
              style={{
                left: touchGhost.x + 12,
                top: touchGhost.y + 12,
                borderColor: "var(--color-customBorder)",
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-primary)",
              }}
            >
              {touchGhost.title}
            </div>
          )} */}
          <DragOverlay zIndex={30000}>
            {activeFileId ? (
              <div
                className="flex h-[160px] w-[112px] items-center justify-center rounded-md border-2 border-customBorder px-4 text-center shadow-xl sm:h-[200px] sm:w-[140px]"
                style={{
                  backgroundColor: "var(--color-bg-primary)",
                  color: "var(--color-primary)",
                }}
              >
                {activeFileTitle}
              </div>
            ) : null}
          </DragOverlay>
        </div>
      </div>
    </DndContext>
  );
}
