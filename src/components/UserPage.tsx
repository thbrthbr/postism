"use client";

import { useEffect, useRef, useState } from "react";
import { storage } from "../firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { usePathname, useRouter } from "next/navigation";
import { IoIosClose } from "react-icons/io";
import { FaArrowLeft, FaRegFolderOpen } from "react-icons/fa";
import Menu from "@/components/menu";
import Spinner from "@/components/spinner";
import SpinnerMini from "./spinner-mini";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import Swal from "sweetalert2";
import Heart from "@/components/Heart";
import { appSwal, icons } from "@/lib/swal";

interface Props {
  id?: string;
}

export default function UserPage({ id }: Props) {
  const { toast } = useToast();
  const pathName = usePathname().split("/")[1];
  const { data: session } = useSession();
  const isMounted = useRef(false);

  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState({
    x: -1,
    y: -1,
  });

  const [location2, setLocation2] = useState({
    x: -1,
    y: -1,
    id: "",
    fileType: "",
    parentId: "",
  });

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
  const [touchGhost, setTouchGhost] = useState<{
    title: string;
    x: number;
    y: number;
  } | null>(null);

  const [isPreviewZoneActive, setIsPreviewZoneActive] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDesktopFileDragging, setIsDesktopFileDragging] = useState(false);

  const router = useRouter();

  const touchDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    dragging: boolean;
    itemType: "file" | "folder";
    itemId: string;
    title: string;
    parentId: string;
  } | null>(null);

  const contentAreaRef = useRef<HTMLDivElement | null>(null);

  const isAnyDragging = Boolean(
    draggingFileId || draggingFolderId || touchGhost || isDesktopFileDragging,
  );
  const isFileDragging = Boolean(draggingFileId || isDesktopFileDragging);

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

  const resetDragVisualState = () => {
    setDraggingFileId(null);
    setDraggingFolderId(null);
    setTouchGhost(null);
    setDragOverFolderId(null);
    setIsPreviewZoneActive(false);
  };

  const openPreviewFile = (fileId: string, title: string) => {
    setPreviewTarget({ id: fileId, title });
    setIsPreviewMode(true);
    resetDragVisualState();
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
            const brought = await fetch(
              `${process.env.NEXT_PUBLIC_SITE}/api/text`,
              {
                method: "POST",
                body: JSON.stringify({
                  title: `${fileName}:${key}`,
                  path: downUrl,
                  order: key,
                  realTitle: fileName,
                  user: session?.user?.email,
                  liked: false,
                  parentId: id || "0",
                }),
                cache: "no-store",
              },
            );
            const final = await brought.json();
            if (final.message === "무라사키") {
              const semi = datas.slice(0);
              semi.unshift(final.data);
              setDatas(semi);
            } else {
              toast({
                title: "알림",
                description: "업로드에 실패하셨습니다",
              });
              await fetch(`${process.env.NEXT_PUBLIC_SITE}/api/text/delete`, {
                method: "DELETE",
                body: JSON.stringify({
                  id: "nope",
                  title: `${fileName}:${key}`,
                  email: session?.user?.email,
                }),
                cache: "no-store",
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
              const brought = await fetch(
                `${process.env.NEXT_PUBLIC_SITE}/api/text`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    title: `${fileName}:${key}`,
                    path: downUrl,
                    order: key,
                    realTitle: fileName,
                    user: session?.user?.email,
                    liked: false,
                    parentId: id || "0",
                  }),
                  cache: "no-store",
                },
              );
              const final = await brought.json();
              if (final.message === "무라사키") {
                const semi = datas.slice(0);
                semi.unshift(final.data);
                setDatas(semi);
              } else {
                toast({
                  title: "알림",
                  description: "업로드에 실패하셨습니다",
                });
                await fetch(`${process.env.NEXT_PUBLIC_SITE}/api/text/delete`, {
                  method: "DELETE",
                  body: JSON.stringify({
                    id: "nope",
                    title: `${fileName}:${key}`,
                    email: session?.user?.email,
                  }),
                  cache: "no-store",
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE}/api/text`, {
        method: "POST",
        body: JSON.stringify({
          title: `${fileName}:${key}`,
          path: downUrl,
          order: key,
          realTitle: fileName,
          user: session?.user?.email,
          liked: false,
          parentId: id || "0",
        }),
        cache: "no-store",
      });

      const final = await response.json();
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
        await fetch(`${process.env.NEXT_PUBLIC_SITE}/api/text/delete`, {
          method: "DELETE",
          body: JSON.stringify({
            id: "nope",
            title: `${fileName}:${key}`,
            email: session?.user?.email,
          }),
          cache: "no-store",
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
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_SITE}/api/folder?id=${session?.user?.email}:${id || "0"}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );
    const tempfolders = await result.json();
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
  };

  const getWritten = async () => {
    await getFolders();
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_SITE}/api/text?id=${session?.user?.email}:${id || "0"}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );
    const texts = await result.json();
    const sorted = texts.data
      .sort((x: any, y: any) => x.order - y.order)
      .reverse();

    const likedItems = sorted
      .filter((item: any) => item.liked === true)
      .sort((x: any, y: any) => x.order - y.order);
    const unlikedItems = sorted.filter((item: any) => item.liked !== true);
    const finalSorted = [...likedItems.reverse(), ...unlikedItems];
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE}/api/folder`,
        {
          method: "POST",
          body: JSON.stringify({
            title: `${fileName}:${key}`,
            order: key,
            realTitle: fileName,
            user: session?.user?.email,
            liked: false,
            parentId: id || "0",
          }),
          cache: "no-store",
        },
      );

      const final = await response.json();
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
        const newDatas = datas.filter((item: any) => item.id !== id);
        setDatas(newDatas);

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_SITE}/api/text/delete`,
            {
              method: "DELETE",
              body: JSON.stringify({
                id,
                title,
                email: session?.user?.email,
              }),
              cache: "no-store",
            },
          );
          const final = await res.json();

          if (!(final.message === "결과" && final.data.status === "성공")) {
            setDatas(prevDatas);
            toast({
              title: "알림",
              description: "삭제에 실패했습니다",
            });
          }
        } catch (error) {
          console.error(error);
          setDatas(prevDatas);
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
        const newFolders = folders.filter((item: any) => item.id !== id);
        setFolders(newFolders);

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_SITE}/api/folder/delete`,
            {
              method: "DELETE",
              body: JSON.stringify({
                email: session?.user?.email,
                id,
              }),
              cache: "no-store",
            },
          );
          const final = await res.json();

          if (!(final.message === "결과" && final.data.status === "성공")) {
            setFolders(prevFolders);
            toast({
              title: "알림",
              description: "삭제에 실패했습니다",
            });
          }
        } catch (error) {
          console.error(error);
          setFolders(prevFolders);
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
      await fetch(`${process.env.NEXT_PUBLIC_SITE}/api/text/edit-title`, {
        method: "POST",
        body: JSON.stringify({
          id,
          newTitle,
          email: session?.user?.email,
        }),
        cache: "no-store",
      });
    } else {
      await fetch(`${process.env.NEXT_PUBLIC_SITE}/api/folder/edit-title`, {
        method: "POST",
        body: JSON.stringify({
          id,
          newTitle,
          email: session?.user?.email,
        }),
        cache: "no-store",
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
      return;
    }
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_SITE}/api/children/edit-path`,
      {
        method: "POST",
        body: JSON.stringify({
          id: itemId,
          type,
          newPath,
          email: session?.user?.email,
        }),
        cache: "no-store",
      },
    );
    const final = await result.json();
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
    }
  };

  const moveFileToFolder = async (
    fileId: string,
    title: string,
    parentId: string,
    folderId: string,
    folderTitle?: string,
  ) => {
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

    await editPath(fileId, "file", folderId, parentId);
  };

  const moveFolderToFolder = async (
    folderId: string,
    title: string,
    parentId: string,
    targetFolderId: string,
    targetFolderTitle?: string,
  ) => {
    if (folderId === targetFolderId) {
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

    await editPath(folderId, "folder", targetFolderId, parentId);
  };

  const getParentId = async () => {
    const result = await fetch(`/api/folder/${id}`, {
      method: "GET",
      cache: "no-store",
    });
    const final = await result.json();
    setLoadedParentId(final.data[0].parentId);
    setOwner(final.data[0].user);
  };

  const changePosition = (list: any) => {
    const tempData = list.slice(0);
    tempData.map((data: any) => {
      if (data.id == testSwitch.id) {
        data.liked = testSwitch.changeTo;
      }
    });
    const likedItems = tempData
      .filter((item: any) => item.liked === true)
      .sort((x: any, y: any) => x.order - y.order);
    const unlikedItems = tempData.filter((item: any) => item.liked !== true);
    return [...likedItems.reverse(), ...unlikedItems];
  };

  useEffect(() => {
    if (pathName === "folder") getParentId();
  }, []);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
    }
    if (id === undefined) {
      if (session && session?.user?.email !== previousEmail) {
        getWritten();
        setPreviousEmail(session?.user?.email);
      }
    } else {
      getWritten();
      setPreviousEmail(session?.user?.email);
    }
  }, [session]);

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
    const fetchPreviewContent = async () => {
      if (!previewTarget?.id) return;

      setIsPreviewLoading(true);
      setPreviewContent("");

      try {
        const result = await fetch(`/api/text/${previewTarget.id}`, {
          cache: "no-store",
        });
        const final = await result.json();

        if (final.data && final.data.length > 0) {
          const file = final.data[0];
          const res = await fetch(file.path);
          const text = await res.text();
          setPreviewContent(text);
        } else {
          setPreviewContent("해당 문서를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error(error);
        setPreviewContent("시스템 오류가 발생하여 내용을 불러올 수 없습니다.");
      } finally {
        setIsPreviewLoading(false);
      }
    };

    fetchPreviewContent();
  }, [previewTarget?.id]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden md:flex-row">
      {isPreviewMode && (
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
              setIsDesktopFileDragging(false);
              openPreviewFile(itemId, title);
            } else {
              resetDragVisualState();
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
              {datas.find((item: any) => item.id === previewTarget?.id)
                ?.user === session?.user?.email && (
                <button
                  onClick={() => {
                    if (previewTarget?.id) {
                      router.push(`/text/${previewTarget.id}`);
                    }
                  }}
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
                onClick={() => {
                  setIsPreviewMode(false);
                  setPreviewTarget(null);
                  setPreviewContent("");
                }}
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

          setLocation2({
            x: -1,
            y: -1,
            id: "",
            fileType: "",
            parentId: "",
          });
          setLocation({
            x: pos.x,
            y: pos.y,
          });
        }}
        onClick={(e) => {
          e.preventDefault();
          setLocation({
            x: -1,
            y: -1,
          });
          setLocation2({
            x: -1,
            y: -1,
            id: "",
            fileType: "",
            parentId: "",
          });
          if (modSwitch !== -1)
            if (modSwitch >= 0)
              editTitle(currentDataId, datas[modSwitch].realTitle);
            else {
              editTitle(
                currentDataId,
                folders[modSwitch / 1000 / -1 - 1].realTitle,
              );
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
              }}
            />
          ) : (
            <Menu
              location={location}
              logined={false}
              customFunctions={{
                addText: uploadWritten,
                addFolder: addFolders,
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
                  {folders.map((folder: any, idx: number) => {
                    const folderInputId = folder.title.replace(":", "-");
                    return (
                      <motion.div
                        data-folder-id={folder.id}
                        className={`actioned z-40 flex w-[112px] select-none sm:w-[140px] ${folder.id !== "temp" && "cursor-pointer"} flex-col items-center`}
                        key={folder.title}
                        onClick={() => {
                          if (folder.id !== "temp")
                            router.push(`/folder/${folder.id}`);
                        }}
                        layout
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.8 }}
                        onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                          e.preventDefault();
                          if (folder.id === "temp") return;
                          setDragOverFolderId(folder.id);
                        }}
                        onDragLeave={() => {
                          setDragOverFolderId(null);
                        }}
                        onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                          e.preventDefault();
                          e.stopPropagation();

                          if (folder.id === "temp") {
                            setDragOverFolderId(null);
                            return;
                          }

                          const dragType = e.dataTransfer.getData("drag-type");
                          const itemId = e.dataTransfer.getData("item-id");
                          const title = e.dataTransfer.getData("item-title");
                          const parentId =
                            e.dataTransfer.getData("item-parent");

                          if (!itemId) {
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

                          setIsDesktopFileDragging(false);
                          setDragOverFolderId(null);
                        }}
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
                            id: folder.id,
                            fileType: "folder",
                            parentId: folder.parentId,
                          });
                        }}
                        onPointerDown={(e) => {
                          if (e.pointerType === "mouse") return;
                          if (folder.id === "temp") return;

                          (
                            e.currentTarget as HTMLDivElement
                          ).setPointerCapture?.(e.pointerId);

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

                          const dist = Math.hypot(
                            e.clientX - t.startX,
                            e.clientY - t.startY,
                          );

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
                          const folderEl = el?.closest(
                            "[data-folder-id]",
                          ) as HTMLElement | null;

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

                          (
                            e.currentTarget as HTMLDivElement
                          ).releasePointerCapture?.(e.pointerId);
                          touchDragRef.current = null;
                          resetDragVisualState();
                        }}
                        onPointerCancel={(e) => {
                          (
                            e.currentTarget as HTMLDivElement
                          ).releasePointerCapture?.(e.pointerId);
                          touchDragRef.current = null;
                          resetDragVisualState();
                        }}
                      >
                        <div
                          draggable={folder.id !== "temp"}
                          onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                            if (folder.id === "temp") return;

                            e.dataTransfer.setData("drag-type", "folder");
                            e.dataTransfer.setData("item-id", folder.id);
                            e.dataTransfer.setData(
                              "item-title",
                              folder.realTitle,
                            );
                            e.dataTransfer.setData(
                              "item-parent",
                              folder.parentId,
                            );

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
                                  : "none",
                            opacity: draggingFolderId === folder.id ? 0.35 : 1,
                            touchAction: "none",
                          }}
                          className="relative h-[160px] w-[112px] rounded-md border-2 border-customBorder sm:h-[200px] sm:w-[140px]"
                        >
                          {folder.user === session?.user?.email && (
                            <>
                              <div className="absolute left-1 top-1">
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
                            if (
                              owner == session?.user?.email ||
                              id == undefined
                            ) {
                              if (folder.id !== "temp") {
                                handleEditTitle(
                                  e,
                                  (idx + 1) * -1 * 1000,
                                  folderInputId,
                                );
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
                                  let temp = folders.slice(0);
                                  temp[idx].realTitle = e.target.value;
                                  setFolders(temp);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key == "Enter") {
                                    editTitle(
                                      folder.id,
                                      folders[idx].realTitle,
                                    );
                                  }
                                }}
                              ></input>
                            </div>
                          ) : (
                            <div className="text-overflow-2 w-full text-center">
                              {folder.realTitle}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="m-8 flex select-none flex-wrap justify-center gap-8 sm:justify-start">
                <AnimatePresence>
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

                  {datas.map((data: any, idx: number) => {
                    const inputId = data?.title.replace(":", "-");
                    return (
                      <motion.div
                        className={`actioned z-40 flex w-[112px] select-none sm:w-[140px] ${data.id !== "temp" && "cursor-pointer"} flex-col items-center`}
                        key={data.title}
                        onPointerDown={(e) => {
                          if (e.pointerType === "mouse") return;
                          if (data.id === "temp") return;

                          (
                            e.currentTarget as HTMLDivElement
                          ).setPointerCapture?.(e.pointerId);
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

                          const dist = Math.hypot(
                            e.clientX - t.startX,
                            e.clientY - t.startY,
                          );

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
                          const folderEl = el?.closest(
                            "[data-folder-id]",
                          ) as HTMLElement | null;

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
                                const targetFolder = folders.find(
                                  (f: any) => f.id === folderId,
                                );
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

                          (
                            e.currentTarget as HTMLDivElement
                          ).releasePointerCapture?.(e.pointerId);
                          touchDragRef.current = null;
                          resetDragVisualState();
                        }}
                        onPointerCancel={(e) => {
                          (
                            e.currentTarget as HTMLDivElement
                          ).releasePointerCapture?.(e.pointerId);
                          touchDragRef.current = null;
                          resetDragVisualState();
                        }}
                        onClick={() => {
                          if (data.id === "temp") return;
                          if (isPreviewMode) {
                            openPreviewFile(data.id, data.realTitle);
                            return;
                          }
                          router.push(`/text/${data.id}`);
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
                          draggable={data.id !== "temp"}
                          onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                            if (data.id === "temp") return;

                            e.dataTransfer.setData("drag-type", "file");
                            e.dataTransfer.setData("item-id", data.id);
                            e.dataTransfer.setData(
                              "item-title",
                              data.realTitle,
                            );
                            e.dataTransfer.setData(
                              "item-parent",
                              data.parentId,
                            );
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
                            transform:
                              draggingFileId === data.id
                                ? "scale(0.96)"
                                : "scale(1)",
                            boxShadow:
                              draggingFileId === data.id
                                ? "0 10px 24px rgba(0,0,0,0.18)"
                                : "none",
                          }}
                          className="relative h-[160px] w-[112px] rounded-md border-2 border-customBorder sm:h-[200px] sm:w-[140px]"
                        >
                          {data.user === session?.user?.email && (
                            <>
                              <div className="absolute left-1 top-1">
                                <Heart
                                  data={data}
                                  liked={data.liked}
                                  setData={setTestSwitch}
                                />
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
                            if (
                              owner == session?.user?.email ||
                              id == undefined
                            ) {
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
                                  let temp = datas.slice(0);
                                  temp[idx].realTitle = e.target.value;
                                  setDatas(temp);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key == "Enter") {
                                    editTitle(data.id, datas[idx].realTitle);
                                  }
                                }}
                              ></input>
                            </div>
                          ) : (
                            <div className="text-overflow-2 w-full text-center">
                              {data.realTitle}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        <div
          data-preview-zone="true"
          onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
            if (!isFileDragging) return;
            e.preventDefault();
            e.stopPropagation();
            setIsPreviewZoneActive(true);
            setDragOverFolderId(null);
          }}
          onDragLeave={() => {
            setIsPreviewZoneActive(false);
          }}
          onDrop={(e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();

            const dragType = e.dataTransfer.getData("drag-type");
            const itemId = e.dataTransfer.getData("item-id");
            const title = e.dataTransfer.getData("item-title");

            if (dragType === "file" && itemId) {
              openPreviewFile(itemId, title);
            } else {
              resetDragVisualState();
            }
          }}
          className="fixed bottom-0 left-0 right-0 z-[9998] px-3 pb-3 md:px-4 md:pb-4"
          style={{
            opacity: isFileDragging ? 1 : 0,
            transform: isFileDragging
              ? isPreviewZoneActive
                ? "translateY(0)"
                : "translateY(0)"
              : "translateY(20px)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
            pointerEvents: isFileDragging ? "auto" : "none",
          }}
        >
          <div
            className="flex h-[72px] w-full items-center justify-center rounded-2xl border-2 text-base font-bold shadow-2xl md:h-[84px] md:text-lg"
            style={{
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-primary)",
              borderColor: isPreviewZoneActive
                ? "rgba(59,130,246,0.8)"
                : "var(--color-customBorder)",
              boxShadow: isPreviewZoneActive
                ? "0 0 0 2px rgba(59,130,246,0.45), 0 12px 28px rgba(0,0,0,0.18)"
                : "0 8px 20px rgba(0,0,0,0.12)",
            }}
          >
            여기에 놓아 미리보기
          </div>
        </div>

        {touchGhost && (
          <div
            className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-1/2"
            style={{
              left: touchGhost.x,
              top: touchGhost.y - 18,
            }}
          >
            <div
              className="max-w-[160px] rounded-md border-2 px-3 py-2 text-sm shadow-2xl"
              style={{
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-primary)",
                borderColor: "var(--color-customBorder)",
                opacity: 0.95,
              }}
            >
              <div className="truncate">{touchGhost.title}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
