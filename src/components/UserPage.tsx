"use client";

import { useEffect, useRef, useState } from "react";
import { storage } from "../firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { usePathname, useRouter } from "next/navigation";
import { IoIosClose } from "react-icons/io";
import { FaArrowLeft } from "react-icons/fa";
import Menu from "@/components/menu";
import Spinner from "@/components/spinner";
import SpinnerMini from "./spinner-mini";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import Swal from "sweetalert2";
import { FaRegFolderOpen } from "react-icons/fa";
import Heart from "@/components/Heart";

interface Props {
  id?: string;
  // parentId?: String;
}

export default function UserPage({ id }: Props) {
  const { toast } = useToast();
  const pathName = usePathname().split("/")[1];
  const { data: session, status } = useSession();
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
    title: "",
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
  const router = useRouter();

  // === 화면 분할 및 텍스트 로드 관련 ===
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [selectedFileData, setSelectedFileData] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);
  const [splitContent, setSplitContent] = useState("");
  const [isSplitLoading, setIsSplitLoading] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [touchDragPreview, setTouchDragPreview] = useState<{
    id: string;
    title: string;
    parentId: string;
    x: number;
    y: number;
  } | null>(null);

  const [touchDropTarget, setTouchDropTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const touchDragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    fileId: string;
    title: string;
    parentId: string;
  } | null>(null);

  const suppressClickRef = useRef(false);

  const openSplitView = () => {
    if (location2.fileType !== "file") {
      toast({
        title: "알림",
        description: "텍스트 파일만 분할 화면으로 열 수 있습니다.",
      });
      return;
    }
    setIsSplitMode(true);
    setSelectedFileData({ id: location2.id, title: location2.title });
    setLocation2({
      x: -1,
      y: -1,
      id: "",
      fileType: "",
      parentId: "",
      title: "",
    });
  };
  // ===================================

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
    Swal.fire({
      title: "파일 업로드",
      text: "파일을 업로드 하시겠습니까?",
      showCancelButton: true,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
    }).then(async (result) => {
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
    Swal.fire({
      title: "삭제 확인 알림",
      text: "해당 텍스트를 삭제하시겠습니까",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
    }).then(async (result) => {
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
    Swal.fire({
      title: "삭제 확인 알림",
      text: "해당 폴더를 삭제하시겠습니까",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
    }).then(async (result) => {
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
    id: string,
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
          id,
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
          if (folders[i].id !== id) {
            temp.push(folders[i]);
          }
        }
        setFolders(temp);
      } else {
        const tempArr = [];
        for (let i = 0; i < datas.length; i++) {
          if (datas[i].id !== id) {
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
        title: "",
      });
    }
  };

  const moveFileToFolder = async (
    fileId: string,
    fileTitle: string,
    currentParentId: string,
    targetFolderId: string,
    targetFolderTitle: string,
  ) => {
    if (!fileId || !targetFolderId) return;

    if (currentParentId === targetFolderId) {
      toast({
        title: "알림",
        description: "이미 해당 폴더 안에 있습니다",
      });
      return;
    }

    const prevDatas = [...datas];

    // 낙관적 UI: 현재 화면에서 바로 제거
    setDatas((prev: any) => prev.filter((item: any) => item.id !== fileId));

    try {
      const result = await fetch(
        `${process.env.NEXT_PUBLIC_SITE}/api/children/edit-path`,
        {
          method: "POST",
          body: JSON.stringify({
            id: fileId,
            type: "file",
            newPath: targetFolderId,
            email: session?.user?.email,
          }),
          cache: "no-store",
        },
      );

      const final = await result.json();

      if (final.message === "경로 수정 성공") {
        toast({
          title: "알림",
          description: `${fileTitle} 파일을 ${targetFolderTitle} 폴더로 이동했습니다`,
        });

        if (selectedFileData?.id === fileId) {
          setIsSplitMode(false);
          setSelectedFileData(null);
          setSplitContent("");
        }
      } else {
        setDatas(prevDatas);
        toast({
          title: "알림",
          description: "파일 이동에 실패했습니다",
        });
      }
    } catch (error) {
      console.error(error);
      setDatas(prevDatas);
      toast({
        title: "알림",
        description: "파일 이동 중 오류가 발생했습니다",
      });
    } finally {
      touchDragStartRef.current = null;
      setTouchDragPreview(null);
      setTouchDropTarget(null);
      setDragOverFolderId(null);
      setIsDraggingFile(false);
      setShowDropZone(false);
    }
  };

  const resetTouchDragState = () => {
    touchDragStartRef.current = null;
    setTouchDragPreview(null);
    setTouchDropTarget(null);
    setDragOverFolderId(null);
    setIsDraggingFile(false);
    setShowDropZone(false);
  };

  const updateTouchDropTarget = (clientX: number, clientY: number) => {
    const element = document.elementFromPoint(
      clientX,
      clientY,
    ) as HTMLElement | null;
    const folderElement = element?.closest(
      "[data-folder-drop-id]",
    ) as HTMLElement | null;

    if (!folderElement) {
      setDragOverFolderId(null);
      setTouchDropTarget(null);
      return;
    }

    const folderId = folderElement.dataset.folderDropId ?? "";
    const folderTitle = folderElement.dataset.folderDropTitle ?? "";

    if (!folderId) {
      setDragOverFolderId(null);
      setTouchDropTarget(null);
      return;
    }

    setDragOverFolderId(folderId);
    setTouchDropTarget({
      id: folderId,
      title: folderTitle,
    });
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

  const changePosition = (datas: any) => {
    const tempData = datas.slice(0);
    tempData.map((data: any) => {
      if (data.id == testSwitch.id) {
        data.liked = testSwitch.changeTo;
      }
    });
    const likedItems = tempData
      .filter((item: any) => item.liked === true)
      .sort((x: any, y: any) => x.order - y.order);
    const unlikedItems = tempData.filter((item: any) => item.liked !== true);
    const finalSorted = [...likedItems.reverse(), ...unlikedItems];
    return finalSorted;
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
        const sorted = changePosition(datas.slice(0));
        setDatas(sorted);
      } else {
        const sorted = changePosition(folders.slice(0));
        setFolders(sorted);
      }
    }
  }, [testSwitch]);

  useEffect(() => {
    const fetchSplitContent = async () => {
      if (!selectedFileData?.id) return;

      setIsSplitLoading(true);
      setSplitContent("");

      try {
        const result = await fetch(`/api/text/${selectedFileData.id}`, {
          cache: "no-store",
        });
        const final = await result.json();

        if (final.data && final.data.length > 0) {
          const file = final.data[0];
          const res = await fetch(file.path);
          const text = await res.text();
          setSplitContent(text);
        } else {
          setSplitContent("해당 문서를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error(error);
        setSplitContent("시스템 오류가 발생하여 내용을 불러올 수 없습니다.");
      } finally {
        setIsSplitLoading(false);
      }
    };

    fetchSplitContent();
  }, [selectedFileData?.id]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden md:flex-row">
      {isSplitMode && (
        <div
          className="relative z-10 order-1 flex h-1/2 w-full flex-col overflow-hidden border-b-2 md:order-2 md:h-screen md:w-1/2 md:border-b-0 md:border-l-2"
          style={{
            borderColor: "var(--color-customBorder)",
            backgroundColor: "var(--color-bg-primary)",
            transition: "background-color 0.7s ease",
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData("custom/type");
            if (type === "split-view") {
              setSelectedFileData({
                id: e.dataTransfer.getData("custom/id"),
                title: e.dataTransfer.getData("custom/title"),
              });
            }
            setIsDraggingFile(false);
            setShowDropZone(false);
          }}
        >
          {isDraggingFile && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center border-4 border-dashed backdrop-blur-sm transition-all"
              style={{
                borderColor: "var(--color-primary)",
                backgroundColor: "var(--color-bg-primary)",
                opacity: 0.8,
              }}
            >
              <div
                className="pointer-events-none rounded-full border-2 px-6 py-3 font-bold shadow-xl"
                style={{
                  backgroundColor: "var(--color-bg-primary)",
                  color: "var(--color-primary)",
                  borderColor: "var(--color-customBorder)",
                }}
              >
                이곳에 놓아서 열기
              </div>
            </div>
          )}

          <div
            className="flex items-center justify-between border-b p-4 shadow-sm"
            style={{ borderColor: "var(--color-customBorder)" }}
          >
            <h2
              className="truncate pr-4 text-lg font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              {selectedFileData?.title}
            </h2>
            <div className="flex gap-x-2">
              {datas.find((item: any) => item.id === selectedFileData?.id)
                ?.user === session?.user?.email && (
                <button
                  onClick={() => {
                    if (selectedFileData?.id) {
                      router.push(`/text/${selectedFileData.id}`);
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
                onClick={() => setIsSplitMode(false)}
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
            {isSplitLoading ? (
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
                {splitContent}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className={`relative flex flex-col items-center justify-start overflow-y-auto transition-all duration-300 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isSplitMode
            ? "order-2 h-1/2 w-full border-t-2 md:order-1 md:h-screen md:w-1/2 md:border-r-2 md:border-t-0"
            : "h-screen w-full"
        }`}
        style={{ borderColor: "var(--color-customBorder)" }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            dropUploadWritten(e.dataTransfer.files[0]);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setLocation2({
            x: -1,
            y: -1,
            id: "",
            fileType: "",
            parentId: "",
            title: "",
          });
          setLocation({
            x: e.pageX,
            y: e.pageY,
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
            title: "",
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
                openSplitView: openSplitView,
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
                      <FaArrowLeft className="cursor-pointer text-xl" />
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
                        data-folder-drop-id={
                          folder.id !== "temp" ? folder.id : ""
                        }
                        data-folder-drop-title={folder.realTitle}
                        className={`actioned z-40 flex w-[112px] select-none sm:w-[140px] ${
                          folder.id !== "temp" && "cursor-pointer"
                        } flex-col items-center`}
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
                        onDragOver={(e) => {
                          const dragKind =
                            e.dataTransfer.getData("custom/drag-kind");
                          if (folder.id === "temp") return;
                          if (dragKind !== "move-file-to-folder") return;

                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = "move";

                          if (dragOverFolderId !== folder.id) {
                            setDragOverFolderId(folder.id);
                          }
                        }}
                        onDragLeave={(e) => {
                          e.stopPropagation();

                          const related = e.relatedTarget as Node | null;
                          if (related && e.currentTarget.contains(related))
                            return;

                          if (dragOverFolderId === folder.id) {
                            setDragOverFolderId(null);
                          }
                        }}
                        onDrop={async (e) => {
                          const dragKind =
                            e.dataTransfer.getData("custom/drag-kind");
                          if (folder.id === "temp") return;
                          if (dragKind !== "move-file-to-folder") return;

                          e.preventDefault();
                          e.stopPropagation();

                          const fileId = e.dataTransfer.getData("custom/id");
                          const fileTitle =
                            e.dataTransfer.getData("custom/title");
                          const fileParentId =
                            e.dataTransfer.getData("custom/parentId");

                          await moveFileToFolder(
                            fileId,
                            fileTitle,
                            fileParentId,
                            folder.id,
                            folder.realTitle,
                          );
                        }}
                        onContextMenu={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setLocation({
                            x: -1,
                            y: -1,
                          });
                          setLocation2({
                            x: e.pageX,
                            y: e.pageY,
                            id: folder.id,
                            fileType: "folder",
                            parentId: folder.parentId,
                            title: folder.realTitle,
                          });
                        }}
                      >
                        <div
                          style={{
                            backgroundColor:
                              dragOverFolderId === folder.id
                                ? "var(--color-bg-secondary)"
                                : "var(--color-bg-primary)",
                            transition:
                              "background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
                            transform:
                              dragOverFolderId === folder.id
                                ? "scale(1.03)"
                                : "scale(1)",
                            boxShadow:
                              dragOverFolderId === folder.id
                                ? "0 0 0 2px var(--color-primary)"
                                : "none",
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
                                <IoIosClose className="text-xl" />
                              </div>
                            </>
                          )}
                          <div className="ml-4 mr-4 flex h-full items-center justify-center">
                            {folder.id === "temp" ? (
                              <div className="flex items-center justify-center text-center">
                                <SpinnerMini />
                              </div>
                            ) : (
                              <div className="flex w-full flex-col items-center justify-center text-center">
                                <FaRegFolderOpen className="text-7xl" />
                                {dragOverFolderId === folder.id && (
                                  <div
                                    className="mt-2 text-xs font-bold"
                                    style={{ color: "var(--color-primary)" }}
                                  >
                                    여기에 놓기
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className="mt-2 w-full"
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
                                data-no-touch-drag="true"
                                id={folderInputId}
                                className="w-full border-b-2 border-blue-400 text-center text-black outline-none"
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
                            <div className="text-overflow-2 w-full text-center font-medium">
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
                        draggable={data.id !== "temp"}
                        onDragStart={(e: any) => {
                          e.stopPropagation();
                          if (data.id === "temp") return;

                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("custom/type", "split-view");
                          e.dataTransfer.setData(
                            "custom/drag-kind",
                            "move-file-to-folder",
                          );
                          e.dataTransfer.setData("custom/id", data.id);
                          e.dataTransfer.setData(
                            "custom/title",
                            data.realTitle,
                          );
                          e.dataTransfer.setData(
                            "custom/parentId",
                            data.parentId ?? "0",
                          );

                          setIsDraggingFile(true);

                          requestAnimationFrame(() => {
                            setShowDropZone(true);
                          });
                        }}
                        onDragEnd={(e: any) => {
                          e.stopPropagation();
                          touchDragStartRef.current = null;
                          setTouchDragPreview(null);
                          setTouchDropTarget(null);
                          setIsDraggingFile(false);
                          setShowDropZone(false);
                          setDragOverFolderId(null);
                        }}
                        onClick={() => {
                          if (suppressClickRef.current) {
                            suppressClickRef.current = false;
                            return;
                          }

                          if (data.id !== "temp" && !isSplitMode) {
                            router.push(`/text/${data.id}`);
                          } else if (data.id !== "temp" && isSplitMode) {
                            setSelectedFileData({
                              id: data.id,
                              title: data.realTitle,
                            });
                          }
                        }}
                        onPointerDown={(e) => {
                          if (e.pointerType === "mouse") return;
                          if (data.id === "temp") return;

                          const target = e.target as HTMLElement;
                          if (target.closest("[data-no-touch-drag='true']"))
                            return;

                          touchDragStartRef.current = {
                            pointerId: e.pointerId,
                            startX: e.clientX,
                            startY: e.clientY,
                            fileId: data.id,
                            title: data.realTitle,
                            parentId: data.parentId ?? "0",
                          };

                          suppressClickRef.current = false;
                          (e.currentTarget as HTMLElement).setPointerCapture?.(
                            e.pointerId,
                          );
                        }}
                        onPointerMove={(e) => {
                          if (e.pointerType === "mouse") return;

                          const touchDragStart = touchDragStartRef.current;
                          if (!touchDragStart) return;
                          if (touchDragStart.pointerId !== e.pointerId) return;

                          const distance = Math.hypot(
                            e.clientX - touchDragStart.startX,
                            e.clientY - touchDragStart.startY,
                          );

                          if (!touchDragPreview && distance < 12) return;

                          if (!touchDragPreview) {
                            suppressClickRef.current = true;
                            setIsDraggingFile(true);
                            setShowDropZone(false);
                            setTouchDragPreview({
                              id: touchDragStart.fileId,
                              title: touchDragStart.title,
                              parentId: touchDragStart.parentId,
                              x: e.clientX,
                              y: e.clientY,
                            });
                          } else {
                            setTouchDragPreview((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    x: e.clientX,
                                    y: e.clientY,
                                  }
                                : prev,
                            );
                          }

                          updateTouchDropTarget(e.clientX, e.clientY);
                        }}
                        onPointerUp={async (e) => {
                          if (e.pointerType === "mouse") return;

                          const touchDragStart = touchDragStartRef.current;
                          if (!touchDragStart) return;
                          if (touchDragStart.pointerId !== e.pointerId) return;

                          (
                            e.currentTarget as HTMLElement
                          ).releasePointerCapture?.(e.pointerId);

                          const draggedFile = touchDragPreview;
                          const targetFolder = touchDropTarget;

                          if (draggedFile && targetFolder?.id) {
                            await moveFileToFolder(
                              draggedFile.id,
                              draggedFile.title,
                              draggedFile.parentId,
                              targetFolder.id,
                              targetFolder.title,
                            );
                          } else {
                            resetTouchDragState();
                          }
                        }}
                        onPointerCancel={(e) => {
                          if (e.pointerType === "mouse") return;

                          const touchDragStart = touchDragStartRef.current;
                          if (!touchDragStart) return;
                          if (touchDragStart.pointerId !== e.pointerId) return;

                          (
                            e.currentTarget as HTMLElement
                          ).releasePointerCapture?.(e.pointerId);
                          resetTouchDragState();
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
                          setLocation2({
                            x: e.pageX,
                            y: e.pageY,
                            id: data.id,
                            fileType: "file",
                            parentId: data.parentId,
                            title: data.realTitle,
                          });
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: "var(--color-bg-primary)",
                            transition: "background-color 0.7s ease",
                          }}
                          className="relative h-[160px] w-[112px] rounded-md border-2 border-customBorder sm:h-[200px] sm:w-[140px]"
                        >
                          {data.user === session?.user?.email && (
                            <>
                              <div
                                className="absolute left-1 top-1"
                                data-no-touch-drag="true"
                              >
                                <Heart
                                  data={data}
                                  liked={data.liked}
                                  setData={setTestSwitch}
                                />
                              </div>
                              <div
                                className="absolute end-0 p-1"
                                data-no-touch-drag="true"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteWritten(data.id, data.title);
                                }}
                              >
                                <IoIosClose className="text-xl" />
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
                          className="mt-2 w-full"
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
                                data-no-touch-drag="true"
                                id={inputId}
                                className="w-full border-b-2 border-blue-400 text-center text-black outline-none"
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
      </div>

      {!isSplitMode && showDropZone && (
        <div className="pointer-events-none fixed left-0 top-0 z-[9999] h-full w-full">
          <div
            className="pointer-events-auto absolute left-0 top-0 flex h-1/3 w-full items-center justify-center border-b-4 border-dashed border-blue-500 bg-blue-500/20 backdrop-blur-sm md:left-auto md:right-0 md:top-0 md:h-full md:w-1/3 md:border-b-0 md:border-l-4"
            onDragOver={(e: React.DragEvent) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e: React.DragEvent) => {
              e.preventDefault();
              e.stopPropagation();

              const id = e.dataTransfer.getData("custom/id");
              const title = e.dataTransfer.getData("custom/title");

              if (id) {
                setIsSplitMode(true);
                setSelectedFileData({ id, title });
              }

              setIsDraggingFile(false);
              setShowDropZone(false);
            }}
          >
            <div
              className="pointer-events-none rounded-full border-2 px-6 py-3 font-bold shadow-xl"
              style={{
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-primary)",
                borderColor: "var(--color-customBorder)",
              }}
            >
              이곳에 놓아서 열기
            </div>
          </div>
        </div>
      )}

      {touchDragPreview && (
        <div
          className="pointer-events-none fixed z-[10001] -translate-x-1/2 -translate-y-1/2"
          style={{
            left: touchDragPreview.x,
            top: touchDragPreview.y,
          }}
        >
          <div
            className="rounded-md border-2 px-4 py-2 text-sm font-bold shadow-2xl"
            style={{
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-primary)",
              borderColor: "var(--color-customBorder)",
              opacity: 0.95,
            }}
          >
            {touchDragPreview.title}
          </div>
        </div>
      )}
    </div>
  );
}
