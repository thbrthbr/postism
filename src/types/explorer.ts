import type React from "react";

export type ExplorerItemType = "file" | "folder";

export type SelectedItem = {
  id: string;
  type: ExplorerItemType;
  title: string;
  parentId: string;
};

export type MenuPosition = {
  x: number;
  y: number;
};

export type FileMenuPosition = {
  x: number;
  y: number;
  id: string;
  fileType: string;
  parentId: string;
};

export type PreviewTarget = {
  id: string;
  title: string;
} | null;

export type TouchGhost = {
  title: string;
  x: number;
  y: number;
} | null;

export type TouchDragItemType = "file" | "folder";

export type TouchDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
  itemType: TouchDragItemType;
  itemId: string;
  title: string;
  parentId: string;
} | null;

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;
