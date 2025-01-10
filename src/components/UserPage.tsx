"use client";

import { useEffect, useState } from "react";
import { storage } from "../firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { IoIosClose } from "react-icons/io";
import Menu from "@/components/menu";
import Spinner from "@/components/spinner";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";

export default function UserPage() {
  const { data: session } = useSession();
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
  const [dataCount, setDataCount] = useState<number[]>([]);
  const router = useRouter();

  const addTXT = async () => {
    try {
      let file: any = document.createElement("input");
      file.type = "file";
      file.addEventListener("change", async () => {
        if (file.files[0].type !== "text/plain") {
          alert("txt 파일만 올릴 수 있습니다");
          return;
        }
        const fileName = file.files[0].name;
        const fileRef = ref(storage, `texts/${fileName}:${Date.now()}.txt`);
        await uploadBytes(fileRef, file.files[0]).then(async (snapshot) => {
          getDownloadURL(snapshot.ref).then(async (downUrl) => {
            const brought = await fetch(
              `${process.env.NEXT_PUBLIC_SITE}/api/text`,
              {
                method: "POST",
                body: JSON.stringify({
                  title: `${fileName}:${Date.now()}`,
                  path: downUrl,
                  order: Date.now(),
                  realTitle: fileName,
                  user: session?.user?.email,
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

  const makeTXTfile = () => {
    return new Blob([""], { type: "text/plain;charset=utf-8" });
  };

  const addWritten = async () => {
    const file = makeTXTfile();
    const fileName = `untitled-${dataCount[dataCount.length - 1]}`;
    setDataCount([...dataCount, dataCount[dataCount.length - 1] + 1]);
    const fileRef = ref(storage, `texts/${fileName}.txt`);
    await uploadBytes(fileRef, file).then(async (snapshot) => {
      getDownloadURL(snapshot.ref).then(async (downUrl) => {
        const brought = await fetch(
          `${process.env.NEXT_PUBLIC_SITE}/api/text`,
          {
            method: "POST",
            body: JSON.stringify({
              title: `${fileName}:${Date.now()}`,
              path: downUrl,
              order: Date.now(),
              realTitle: fileName,
              user: session?.user?.email,
            }),
            cache: "no-store",
          },
        );
        const final = await brought.json();
        const semi = datas.slice(0);
        semi.unshift(final.data);
        // setDatas(semi)
        setDatas((prevDatas: any) => [
          { ...final.data, id: `${final.data.id}` }, // 새로운 key 값을 주어 고유하게 식별
          ...prevDatas,
        ]);
      });
    });
  };

  const getWritten = async () => {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_SITE}/api/text?id=${session?.user?.email}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );
    const texts = await result.json();
    const sorted = texts.data
      .sort((x: any, y: any) => x.order - y.order)
      .reverse();
    setDatas(sorted);
    setDataCount([sorted.length]);
    setLoading(false);
  };

  const enterText = (each: string) => {
    router.push(`/text/${each}`);
  };

  const deleteWritten = async (id: string) => {
    const willYou = window.confirm("해당 텍스트를 삭제하시겠습니까");
    if (willYou) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SITE}/api/text/delete`,
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
        for (let i = 0; i < datas.length; i++) {
          if (datas[i].id !== id) {
            temp.push(datas[i]);
          }
        }
        setDatas(temp);
      }
    }
  };

  const editTitle = async (id: string, newTitle: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_SITE}/api/text/edit-title`, {
      method: "POST",
      body: JSON.stringify({
        id,
        newTitle,
      }),
      cache: "no-store",
    });
  };

  useEffect(() => {
    if (session && session?.user?.email !== previousEmail) {
      // session이 갱신되었을 때만 getWritten을 호출
      getWritten();
      setPreviousEmail(session?.user?.email);
    }
  }, [session]);

  return (
    <div
      className="relative flex h-screen flex-col items-center justify-start"
      onContextMenu={(e) => {
        e.preventDefault();
        setLocation({
          x: e.pageX,
          y: e.pageY,
        });
      }}
      onClick={() => {
        setLocation({
          x: -1,
          y: -1,
        });
        setModSwitch(-1);
      }}
    >
      {location.x !== -1 && (
        <Menu location={location} customFunctions={{ addText: addTXT }} />
      )}
      <div>
        {loading ? (
          <div className="flex h-screen w-full items-center justify-center text-white">
            <Spinner />
          </div>
        ) : (
          <div className="m-8 flex flex-wrap gap-8">
            <div
              className="flex w-[140px] flex-col items-center"
              key={0}
              onClick={addWritten}
            >
              <div className="h-[200px] w-[140px] rounded-md border-2 border-border">
                <div className="ml-4 mr-4 flex h-full cursor-pointer items-center justify-center text-center text-4xl">
                  +
                </div>
              </div>
            </div>
            <AnimatePresence>
              {datas.map((data: any, idx: number) => {
                return (
                  <motion.div
                    className="z-40 flex h-[240px] w-[140px] cursor-pointer flex-col items-center"
                    key={data.id}
                    onClick={() => {
                      enterText(data.id);
                    }}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.8 }}
                  >
                    <div
                      style={{
                        backgroundColor: "var(--color-bg-primary)",
                      }}
                      className="mh-[200px] relative h-[200px] w-[140px] rounded-md border-2 border-border"
                    >
                      <div
                        className="absolute end-0 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWritten(data.id);
                        }}
                      >
                        <IoIosClose />
                      </div>
                      <div className="ml-4 mr-4 flex h-full items-center justify-start">
                        <div className="text-overflow w-full text-center">
                          {data.realTitle}
                        </div>
                      </div>
                    </div>
                    <div
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setModSwitch(idx);
                      }}
                    >
                      {modSwitch == idx ? (
                        <div>
                          <input
                            className="text-black"
                            value={data.realTitle}
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
                                setModSwitch(-1);
                                editTitle(data.id, datas[idx].realTitle);
                              }
                            }}
                          ></input>
                        </div>
                      ) : (
                        <div className="text-overflow-2">{data.realTitle}</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
