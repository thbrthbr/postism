import JSZip from "jszip";
import { makeUniqueName } from "./explorer-utils";
import { getFoldersByParentId, getTextsByParentId } from "./explorer-api";

export const triggerDownloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const addFilesToZipFolder = async (zipFolder: JSZip, files: any[]) => {
  const usedNames = new Set<string>();

  for (const file of files) {
    if (!file?.path) continue;

    const response = await fetch(file.path, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`파일 다운로드 실패: ${file.realTitle}`);
    }

    const text = await response.text();
    const safeName = makeUniqueName(`${file.realTitle}.txt`, usedNames);

    zipFolder.file(safeName, text);
  }
};

export const addFolderRecursivelyToZip = async (
  parentZip: JSZip,
  email: string,
  folderId: string,
  folderName: string,
) => {
  const folderZip = parentZip.folder(folderName);

  if (!folderZip) {
    throw new Error(`zip 폴더 생성 실패: ${folderName}`);
  }

  const childFiles = await getTextsByParentId(email, folderId);
  const childFolders = await getFoldersByParentId(email, folderId);

  await addFilesToZipFolder(folderZip, childFiles);

  const usedFolderNames = new Set<string>();

  for (const childFolder of childFolders) {
    const safeFolderName = makeUniqueName(
      childFolder.realTitle,
      usedFolderNames,
    );

    await addFolderRecursivelyToZip(
      folderZip,
      email,
      childFolder.id,
      safeFolderName,
    );
  }
};
