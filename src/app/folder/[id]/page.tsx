"use client";

import Spinner from "@/components/spinner";
import UserPage from "@/components/UserPage";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Folder() {
  const [loadedParentId, setLoadedParentId] = useState("");
  const path = usePathname().split("/");
  const folderId = path[path.length - 1];

  const getParentId = async () => {
    const result = await fetch(`/api/folder/${folderId}`, {
      method: "GET",
      cache: "no-store",
    });
    const final = await result.json();
    setLoadedParentId(final.data[0].parentId);
    // return final.data[0].parentId
  };

  useEffect(() => {
    getParentId();
  }, []);
  if (loadedParentId)
    return <UserPage id={folderId} parentId={loadedParentId || "0"} />;
  else return <Spinner />;
}
