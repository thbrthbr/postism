export const makeUniqueName = (fileName: string, usedNames: Set<string>) => {
  if (!usedNames.has(fileName)) {
    usedNames.add(fileName);
    return fileName;
  }

  const dotIndex = fileName.lastIndexOf(".");
  const hasExt = dotIndex > 0;
  const name = hasExt ? fileName.slice(0, dotIndex) : fileName;
  const ext = hasExt ? fileName.slice(dotIndex) : "";

  let count = 1;
  let nextName = `${name} (${count})${ext}`;

  while (usedNames.has(nextName)) {
    count += 1;
    nextName = `${name} (${count})${ext}`;
  }

  usedNames.add(nextName);
  return nextName;
};

export const isDescendantFolder = (
  sourceFolderId: string,
  targetFolderId: string,
  allFolders: any[],
) => {
  let currentParentId = targetFolderId;

  while (currentParentId && currentParentId !== "0") {
    if (currentParentId === sourceFolderId) {
      return true;
    }

    const currentFolder = allFolders.find(
      (folder: any) => folder.id === currentParentId,
    );

    if (!currentFolder) {
      break;
    }

    currentParentId = currentFolder.parentId;
  }

  return false;
};
