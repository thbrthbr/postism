import { useState } from "react";
import type { FileMenuPosition, MenuPosition } from "@/types/explorer";

export default function useMenuState() {
  const [location, setLocation] = useState<MenuPosition>({
    x: -1,
    y: -1,
  });

  const [location2, setLocation2] = useState<FileMenuPosition>({
    x: -1,
    y: -1,
    id: "",
    fileType: "",
    parentId: "",
  });

  const [bulkMoveMenuLocation, setBulkMoveMenuLocation] =
    useState<FileMenuPosition>({
      x: -1,
      y: -1,
      id: "",
      fileType: "",
      parentId: "",
    });

  const closeBaseMenu = () => {
    setLocation({
      x: -1,
      y: -1,
    });
  };

  const closeItemMenu = () => {
    setLocation2({
      x: -1,
      y: -1,
      id: "",
      fileType: "",
      parentId: "",
    });
  };

  const closeBulkMoveMenu = () => {
    setBulkMoveMenuLocation({
      x: -1,
      y: -1,
      id: "",
      fileType: "",
      parentId: "",
    });
  };

  const closeAllMenus = () => {
    closeBaseMenu();
    closeItemMenu();
    closeBulkMoveMenu();
  };

  const openBaseMenu = (x: number, y: number) => {
    closeItemMenu();
    setLocation({ x, y });
  };

  const openItemMenu = (
    x: number,
    y: number,
    id: string,
    fileType: string,
    parentId: string,
  ) => {
    closeBaseMenu();
    setLocation2({
      x,
      y,
      id,
      fileType,
      parentId,
    });
  };

  const toggleBulkMoveMenu = (x: number, y: number) => {
    if (bulkMoveMenuLocation.x !== -1) {
      closeBulkMoveMenu();
      return;
    }

    closeBaseMenu();
    closeItemMenu();

    setBulkMoveMenuLocation({
      x,
      y,
      id: "",
      fileType: "",
      parentId: "",
    });
  };

  return {
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
  };
}
