"use client";

import UserPage from "@/components/UserPage";
import { usePathname } from "next/navigation";
export default function Folder() {
  const path = usePathname().split("/");
  const folderId = path[path.length - 1];

  return <UserPage id={folderId} />;
}
