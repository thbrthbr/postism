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
  const { data: session } = useSession();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({
    x: -1,
    y: -1,
  });
  const [modSwitch, setModSwitch] = useState(-1);
  const [previousEmail, setPreviousEmail] = useState<string | null | undefined>(
    null,
  );
  const [datas, setDatas] = useState<any>([]);
  const [folders, setFolders] = useState<any>([]);
  const [foldersCount, setFoldersCount] = useState<number[]>([]);
  const [dataCount, setDataCount] = useState<number[]>([]);
  const [currentDataId, setCurentDataId] = useState("");
  const [testSwitch, setTestSwitch] = useState<any>({
    id: "",
    toggle: false,
    changeTo: null,
    type: "",
  });
  const [loadedParentId, setLoadedParentId] = useState("");
  const router = useRouter();

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
            const semi = datas.slice(0);
            semi.unshift(final.data);
            setDatas(semi);
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
            const semi = datas.slice(0);
            semi.unshift(final.data);
            setDatas(semi);
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
    if (isAdding) return; // isAdding이 true이면 함수 실행을 막음

    setIsAdding(true);
    const key = Date.now();
    const file = new Blob([""], { type: "text/plain;charset=utf-8" });
    const fileName = `untitled-${dataCount[dataCount.length - 1]}`;

    // Optimistic UI - UI에 새 데이터 먼저 추가
    const optimisticData = {
      id: "temp", // 서버에서 id를 받아오는 것으로 변경 가능
      title: `${fileName}:${key}`,
      path: "", // URL을 비워두고 나중에 업데이트
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
      let tempCopy = temp.slice(0);
      tempCopy = tempCopy.map((item: any) => {
        return item.title === optimisticData.title
          ? { ...item, path: downUrl, id: final.data.id }
          : item;
      });
      setDatas(tempCopy);
    } catch (error) {
      console.error("Error adding text:", error);
      // alert("Failed to upload text");
      toast({
        title: "알림",
        description: "업로드에 실패하셨습니다",
      });
      setDatas((prevDatas: any) =>
        prevDatas.filter((item: any) => item.id !== optimisticData.id),
      );
    } finally {
      setIsAdding(false); // 작업 완료 후 로딩 상태 종료
    }
  };

  const getFolders = async () => {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_SITE}/api/folder?id=${session?.user?.email}:${id || ""}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );
    const folders = await result.json();
    const sorted = folders.data
      .sort((x: any, y: any) => x.order - y.order)
      .reverse();

    // 1. `liked`가 true인 것들을 맨 앞에 배치하고, `order`에 따라 정렬
    const likedItems = sorted
      .filter((item: any) => item.liked === true)
      .sort((x: any, y: any) => x.order - y.order);
    // 2. `liked`가 false인 것들은 그대로 두기
    const unlikedItems = sorted.filter((item: any) => item.liked !== true);
    // 3. 두 그룹을 합침
    const finalSorted = [...likedItems.reverse(), ...unlikedItems];
    setFolders(finalSorted);
    setFoldersCount([finalSorted.length]);
  };

  const getWritten = async () => {
    getFolders();
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

    // 1. `liked`가 true인 것들을 맨 앞에 배치하고, `order`에 따라 정렬
    const likedItems = sorted
      .filter((item: any) => item.liked === true)
      .sort((x: any, y: any) => x.order - y.order);
    // 2. `liked`가 false인 것들은 그대로 두기
    const unlikedItems = sorted.filter((item: any) => item.liked !== true);
    // 3. 두 그룹을 합침
    const finalSorted = [...likedItems.reverse(), ...unlikedItems];
    setDatas(finalSorted);
    setDataCount([finalSorted.length]);
    // setDatas(sorted);
    // setDataCount([sorted.length]);
    setLoading(false);
  };

  const addFolders = async () => {
    if (isAdding) return; // isAdding이 true이면 함수 실행을 막음

    setIsAdding(true);
    const key = Date.now();
    const fileName = `untitled-${foldersCount[foldersCount.length - 1]}`;

    // Optimistic UI - UI에 새 데이터 먼저 추가
    const optimisticData = {
      id: "temp", // 서버에서 id를 받아오는 것으로 변경 가능
      title: `${fileName}:${key}`,
      path: "", // URL을 비워두고 나중에 업데이트
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
      let tempCopy = temp.slice(0);
      tempCopy = tempCopy.map((item: any) => {
        return item.title === optimisticData.title
          ? { ...item, id: final.data.id }
          : item;
      });
      setFolders(tempCopy);
    } catch (error) {
      console.error("Error adding folder:", error);
      // alert("Failed to upload text");
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
      setIsAdding(false); // 작업 완료 후 로딩 상태 종료
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
      if (result.isConfirmed) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SITE}/api/text/delete`,
          {
            method: "DELETE",
            body: JSON.stringify({
              id,
              title,
            }),
            cache: "no-store",
          },
        );
        const final = await res.json();
        if (final.message == "삭제 성공") {
          const tempArr = [];
          for (let i = 0; i < datas.length; i++) {
            if (datas[i].id !== "temp") {
              tempArr.push(datas[i]);
            }
          }
          setDatas(tempArr);
        }
      }
    });
  };

  const deleteFolder = async (id: string, title: string) => {
    Swal.fire({
      title: "삭제 확인 알림",
      text: "해당 폴더를 삭제하시겠습니까",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SITE}/api/folder/delete`,
          {
            method: "DELETE",
            body: JSON.stringify({
              id,
            }),
            cache: "no-store",
          },
        );
        const final = await res.json();
        if (final.message == "삭제 성공") {
          const temp = [];
          for (let i = 0; i < folders.length; i++) {
            if (folders[i].id !== id) {
              temp.push(folders[i]);
            }
          }
          setFolders(temp);
        }
      }
    });
  };

  const editTitle = async (id: string, newTitle: string) => {
    if (newTitle.length <= 0) {
      // alert("한 글자 이상이어야 합니다");
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
        }),
        cache: "no-store",
      });
    } else {
      await fetch(`${process.env.NEXT_PUBLIC_SITE}/api/folder/edit-title`, {
        method: "POST",
        body: JSON.stringify({
          id,
          newTitle,
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

  const handleDragEnd = () => {};

  const getParentId = async () => {
    const result = await fetch(`/api/folder/${id}`, {
      method: "GET",
      cache: "no-store",
    });
    const final = await result.json();
    setLoadedParentId(final.data[0].parentId);
  };

  useEffect(() => {
    if (pathName === "folder") getParentId();
  }, []);

  useEffect(() => {
    if (session && session?.user?.email !== previousEmail) {
      // session이 갱신되었을 때만 getWritten을 호출
      getWritten();
      setPreviousEmail(session?.user?.email);
    }
  }, [session]);

  useEffect(() => {
    if (testSwitch.changeTo !== null) {
      if (testSwitch.type === "text") {
        const tempData = datas.slice(0);
        tempData.map((data: any) => {
          if (data.id == testSwitch.id) {
            data.liked = testSwitch.changeTo;
          }
        });
        const likedItems = tempData
          .filter((item: any) => item.liked === true)
          .sort((x: any, y: any) => x.order - y.order);
        const unlikedItems = tempData.filter(
          (item: any) => item.liked !== true,
        );
        const finalSorted = [...likedItems.reverse(), ...unlikedItems];
        setDatas(finalSorted);
      } else {
        const tempData = folders.slice(0);
        tempData.map((data: any) => {
          if (data.id == testSwitch.id) {
            data.liked = testSwitch.changeTo;
          }
        });
        const likedItems = tempData
          .filter((item: any) => item.liked === true)
          .sort((x: any, y: any) => x.order - y.order);
        const unlikedItems = tempData.filter(
          (item: any) => item.liked !== true,
        );
        const finalSorted = [...likedItems.reverse(), ...unlikedItems];
        setFolders(finalSorted);
      }
    }
  }, [testSwitch]);

  return (
    <div
      className="relative flex h-screen w-full flex-col items-center justify-start"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        dropUploadWritten(e.dataTransfer.files[0]);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
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
      {location.x !== -1 && (
        <Menu
          location={location}
          customFunctions={{ addText: uploadWritten }}
          addFolder={addFolders}
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
            {pathName === "folder" && (
              <div className="m-8 w-full">
                <button
                  onClick={() => {
                    if (loadedParentId) {
                      if (loadedParentId !== "0") {
                        router.push(`/folder/${loadedParentId}`);
                      } else {
                        router.push("/");
                      }
                    }
                  }}
                >
                  <FaArrowLeft />
                </button>
              </div>
            )}
            <div className="m-8 flex select-none flex-wrap justify-center gap-8 sm:justify-start">
              <AnimatePresence>
                {folders.map((folder: any, idx: number) => {
                  const folderInputId = folder.title.replace(":", "-");
                  return (
                    <motion.div
                      className={`actioned z-40 flex w-[112px] select-none sm:w-[140px] ${folder.id !== "temp" && "cursor-pointer"} flex-col items-center`}
                      // className={`z-40 flex w-[112px] select-none sm:w-[140px] ${data.id !== "temp" && "cursor-pointer"} flex-col items-center`}
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
                      onContextMenu={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "var(--color-bg-primary)",
                          transition: "background-color 0.7s ease",
                        }}
                        className="relative h-[160px] w-[112px] rounded-md border-2 border-customBorder sm:h-[200px] sm:w-[140px]"
                      >
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
                            deleteFolder(folder.id, folder.title);
                          }}
                        >
                          <IoIosClose />
                        </div>
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
                          if (folder.id !== "temp") {
                            handleEditTitle(
                              e,
                              (idx + 1) * -1 * 1000,
                              folderInputId,
                            );
                            setCurentDataId(folder.id);
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
                                  editTitle(folder.id, folders[idx].realTitle);
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
                  <div className="h-[160px] w-[112px] rounded-md border-2 border-customBorder sm:h-[200px] sm:w-[140px]">
                    <div className="ml-4 mr-4 flex h-full cursor-pointer items-center justify-center text-center text-4xl">
                      +
                    </div>
                  </div>
                </motion.div>
                {datas.map((data: any, idx: number) => {
                  const inputId = data.title.replace(":", "-");
                  return (
                    <motion.div
                      className={`actioned z-40 flex w-[112px] select-none sm:w-[140px] ${data.id !== "temp" && "cursor-pointer"} flex-col items-center`}
                      // className={`z-40 flex w-[112px] select-none sm:w-[140px] ${data.id !== "temp" && "cursor-pointer"} flex-col items-center`}
                      key={data.title}
                      onClick={() => {
                        if (data.id !== "temp") router.push(`/text/${data.id}`);
                      }}
                      layout
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.8 }}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "var(--color-bg-primary)",
                          transition: "background-color 0.7s ease",
                        }}
                        className="relative h-[160px] w-[112px] rounded-md border-2 border-customBorder sm:h-[200px] sm:w-[140px]"
                      >
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
                          if (data.id !== "temp") {
                            handleEditTitle(e, idx, inputId);
                            setCurentDataId(data.id);
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
    </div>
  );
}
