export const getTextsByParentId = async (email: string, parentId: string) => {
  const result = await fetch(
    `${process.env.NEXT_PUBLIC_SITE}/api/text?id=${email}:${parentId}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const final = await result.json();
  return final.data || [];
};

export const getFoldersByParentId = async (email: string, parentId: string) => {
  const result = await fetch(
    `${process.env.NEXT_PUBLIC_SITE}/api/folder?id=${email}:${parentId}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const final = await result.json();
  return final.data || [];
};

export const fetchFoldersByParentId = async (
  email: string,
  parentId: string,
) => {
  const result = await fetch(
    `${process.env.NEXT_PUBLIC_SITE}/api/folder?id=${email}:${parentId}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  return result.json();
};

export const fetchTextsByParentId = async (email: string, parentId: string) => {
  const result = await fetch(
    `${process.env.NEXT_PUBLIC_SITE}/api/text?id=${email}:${parentId}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  return result.json();
};

export const fetchAllFoldersFlat = async (email: string) => {
  const result = await fetch(
    `${process.env.NEXT_PUBLIC_SITE}/api/path?id=${email}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  return result.json();
};

export const fetchFolderParentInfo = async (folderId: string) => {
  const result = await fetch(`/api/folder/${folderId}`, {
    method: "GET",
    cache: "no-store",
  });

  return result.json();
};

export const createTextItem = async (payload: {
  title: string;
  path: string;
  order: number;
  realTitle: string;
  user?: string | null;
  liked: boolean;
  parentId: string;
}) => {
  const result = await fetch(`${process.env.NEXT_PUBLIC_SITE}/api/text`, {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  return result.json();
};

export const createFolderItem = async (payload: {
  title: string;
  order: number;
  realTitle: string;
  user?: string | null;
  liked: boolean;
  parentId: string;
}) => {
  const result = await fetch(`${process.env.NEXT_PUBLIC_SITE}/api/folder`, {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  return result.json();
};

export const deleteTextItem = async (payload: {
  id: string;
  title: string;
  email?: string | null;
}) => {
  const result = await fetch(
    `${process.env.NEXT_PUBLIC_SITE}/api/text/delete`,
    {
      method: "DELETE",
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  return result.json();
};

export const deleteFolderItem = async (payload: {
  id: string;
  email?: string | null;
}) => {
  const result = await fetch(
    `${process.env.NEXT_PUBLIC_SITE}/api/folder/delete`,
    {
      method: "DELETE",
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  return result.json();
};

export const editTextTitleItem = async (payload: {
  id: string;
  newTitle: string;
  email?: string | null;
}) => {
  const result = await fetch(
    `${process.env.NEXT_PUBLIC_SITE}/api/text/edit-title`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  return result.json();
};

export const editFolderTitleItem = async (payload: {
  id: string;
  newTitle: string;
  email?: string | null;
}) => {
  const result = await fetch(
    `${process.env.NEXT_PUBLIC_SITE}/api/folder/edit-title`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  return result.json();
};

export const editChildrenPath = async (payload: {
  id: string;
  type: string;
  newPath: string;
  email?: string | null;
}) => {
  const result = await fetch(
    `${process.env.NEXT_PUBLIC_SITE}/api/children/edit-path`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  return result.json();
};

export const fetchPreviewTextById = async (textId: string) => {
  const result = await fetch(`/api/text/${textId}`, {
    cache: "no-store",
  });

  return result.json();
};

export const editItemOrder = async ({
  id,
  order,
  type,
  email,
}: {
  id: string;
  order: number;
  type: "text" | "folder";
  email?: string | null;
}) => {
  try {
    const res = await fetch("/api/edit-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, order, type, email }),
    });

    return await res.json();
  } catch (error) {
    console.error("editItemOrder error:", error);
    return null;
  }
};
