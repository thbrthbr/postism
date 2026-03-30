import { useState } from "react";
import type { SelectedItem } from "@/types/explorer";

export default function useSelection() {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const isSelected = (id: string, type: "file" | "folder") => {
    return selectedItems.some((item) => item.id === id && item.type === type);
  };

  const toggleSelectedItem = (item: SelectedItem) => {
    setSelectedItems((prev) => {
      const exists = prev.some(
        (selected) => selected.id === item.id && selected.type === item.type,
      );

      if (exists) {
        return prev.filter(
          (selected) =>
            !(selected.id === item.id && selected.type === item.type),
        );
      }

      return [...prev, item];
    });
  };

  const clearSelectedItems = () => {
    setSelectedItems([]);
  };

  const selectAllItemsInCurrentPage = (folders: any[], datas: any[]) => {
    const selectableFolders = folders
      .filter((folder: any) => folder.id !== "temp")
      .map((folder: any) => ({
        id: folder.id,
        type: "folder" as const,
        title: folder.realTitle,
        parentId: folder.parentId,
      }));

    const selectableFiles = datas
      .filter((data: any) => data.id !== "temp")
      .map((data: any) => ({
        id: data.id,
        type: "file" as const,
        title: data.realTitle,
        parentId: data.parentId,
      }));

    setSelectedItems([...selectableFolders, ...selectableFiles]);
  };

  return {
    selectedItems,
    setSelectedItems,
    isSelected,
    toggleSelectedItem,
    clearSelectedItems,
    selectAllItemsInCurrentPage,
  };
}
