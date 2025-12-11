import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { deleteObject, getStorage, ref } from "firebase/storage";
import CryptoJS from "crypto-js";

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: "next-app-fbdce.appspot.com",
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function isOwner({ id, user }) {
  const querySnapshot = await getDocs(
    query(collection(db, "folder"), where("id", "==", id)),
  );
  let checker = true;

  for (const doc of querySnapshot.docs) {
    if (doc.data().user !== user) {
      checker = false;
      break;
    }
  }
  return checker;
}

export async function isTextOwner({ id, user }) {
  const querySnapshot = await getDocs(
    query(collection(db, "text"), where("id", "==", id)),
  );
  let checker = true;

  for (const doc of querySnapshot.docs) {
    if (doc.data().user !== user) {
      checker = false;
      break;
    }
  }
  return checker;
}

export async function addText({
  title,
  path,
  order,
  realTitle,
  user,
  liked,
  parentId,
}) {
  if ((await isOwner({ id: parentId, user })) === true) {
    const newReplay = doc(collection(db, "text"));
    await setDoc(newReplay, {
      id: newReplay.id,
      title,
      realTitle,
      path,
      liked,
      parentId,
      order,
      user,
    });
    return {
      id: newReplay.id,
      title,
      path,
      order,
      realTitle,
      liked,
      parentId,
      user,
    };
  } else {
    return {};
  }
}

export async function addFolder({
  title,
  order,
  realTitle,
  user,
  liked,
  parentId,
}) {
  if ((await isOwner({ id: parentId, user })) === true) {
    const newReplay = doc(collection(db, "folder"));
    await setDoc(newReplay, {
      id: newReplay.id,
      title,
      realTitle,
      liked,
      parentId,
      order,
      user,
    });
    return {
      id: newReplay.id,
      title,
      order,
      realTitle,
      liked,
      parentId,
      user,
    };
  } else {
    return {};
  }
}

export async function getTexts(id, textId) {
  let querySnapshot;
  if (textId == "0") {
    querySnapshot = await getDocs(
      query(
        collection(db, "text"),
        where("user", "==", id),
        where("parentId", "==", textId),
      ),
    );
  } else {
    querySnapshot = await getDocs(
      query(collection(db, "text"), where("parentId", "==", textId)),
    );
  }
  if (querySnapshot.empty) {
    return [];
  }
  const fetchedTexts = [];
  querySnapshot.forEach((doc) => {
    const aTodo = {
      id: doc.id,
      liked: doc.data()["liked"],
      parentId: doc.data()["parentId"],
      realTitle: doc.data()["realTitle"],
      title: doc.data()["title"],
      path: doc.data()["path"],
      order: doc.data()["order"],
      user: doc.data()["user"],
    };
    fetchedTexts.push(aTodo);
  });
  return fetchedTexts;
}

export async function getFolders(id, folderId) {
  let querySnapshot;
  if (folderId == "0") {
    querySnapshot = await getDocs(
      query(
        collection(db, "folder"),
        where("user", "==", id),
        where("parentId", "==", folderId || "0"),
      ),
    );
  } else {
    querySnapshot = await getDocs(
      query(collection(db, "folder"), where("parentId", "==", folderId || "0")),
    );
  }
  if (querySnapshot.empty) {
    return [];
  }
  const fetchedFolders = [];
  querySnapshot.forEach((doc) => {
    const aTodo = {
      id: doc.id,
      liked: doc.data()["liked"],
      parentId: doc.data()["parentId"],
      realTitle: doc.data()["realTitle"],
      title: doc.data()["title"],
      order: doc.data()["order"],
      user: doc.data()["user"],
    };
    fetchedFolders.push(aTodo);
  });
  return fetchedFolders;
}

export async function getSpecificText(id) {
  const querySnapshot = await getDocs(
    query(collection(db, "text"), where("id", "==", id)),
  );
  if (querySnapshot.empty) {
    return [];
  }
  const fetchedTexts = [];
  querySnapshot.forEach((doc) => {
    fetchedTexts.push({
      id: doc.id,
      title: doc.data()["title"],
      liked: doc.data()["liked"],
      parentId: doc.data()["parentId"],
      realTitle: doc.data()["realTitle"],
      path: doc.data()["path"],
      order: doc.data()["order"],
      user: doc.data()["user"],
    });
  });
  return fetchedTexts;
}

export async function getSpecificFolder(id) {
  const querySnapshot = await getDocs(
    query(collection(db, "folder"), where("id", "==", id)),
  );
  if (querySnapshot.empty) {
    return [];
  }
  const fetchedFolder = [];
  querySnapshot.forEach((doc) => {
    fetchedFolder.push({
      parentId: doc.data()["parentId"],
      user: doc.data()["user"],
    });
  });
  return fetchedFolder;
}

// export async function getSpecificFolder(id) {
//   const querySnapshot = await getDocs(
//     query(collection(db, "folder"), where("id", "==", id)),
//   );
//   if (querySnapshot.empty) {
//     return [];
//   }
//   const fetchedFolder = [];
//   querySnapshot.forEach((doc) => {
//     fetchedFolder.push({
//       id: doc.id,
//       title: doc.data()["title"],
//       liked: doc.data()["liked"],
//       parentId: doc.data()["parentId"],
//       realTitle: doc.data()["realTitle"],
//       order: doc.data()["order"],
//       user: doc.data()["user"],
//     });
//   });
//   return fetchedFolder;
// }

export async function getChildren(id, user) {
  const querySnapshot = await getDocs(
    query(
      collection(db, "folder"),
      where("user", "==", user),
      where("parentId", "==", id),
    ),
  );
  const fetchedFolder = [];
  querySnapshot.forEach((doc) => {
    fetchedFolder.push({
      id: doc.id,
      title: doc.data()["title"],
      liked: doc.data()["liked"],
      parentId: doc.data()["parentId"],
      realTitle: doc.data()["realTitle"],
      order: doc.data()["order"],
      user: doc.data()["user"],
    });
  });
  return fetchedFolder;
}

export async function editSpecificTitle({ id, newTitle }) {
  const todoRef = doc(db, "text", id);
  const fetched = await updateDoc(todoRef, {
    realTitle: newTitle,
  });
  return fetched;
}
export async function editSpecificFolderTitle({ id, newTitle }) {
  const todoRef = doc(db, "folder", id);
  const fetched = await updateDoc(todoRef, {
    realTitle: newTitle,
  });
  return fetched;
}

export async function editLikeState({ id, isLike, type }) {
  let todoRef;
  if (type === "text") todoRef = doc(db, "text", id);
  if (type === "folder") todoRef = doc(db, "folder", id);
  const fetched = await updateDoc(todoRef, {
    liked: isLike,
  });
  return fetched;
}

export async function editPath({ id, type, newPath }) {
  let todoRef;
  if (type === "folder") todoRef = doc(db, "folder", id);
  else todoRef = doc(db, "text", id);
  const fetched = await updateDoc(todoRef, {
    parentId: newPath,
  });
  return fetched;
}

export async function deleteSpecificText({ id, title, email }) {
  if ((await isTextOwner({ id, user: email })) === true) {
    const fileRef = ref(storage, `texts/${title}.txt`);
    if (id !== "nope") {
      await deleteDoc(doc(db, "text", id));
    }
    await deleteObject(fileRef);
    return { status: "성공" };
  } else {
    if (id === "nope") {
      const fileRef = ref(storage, `texts/${title}.txt`);
      await deleteObject(fileRef);
    }
    return { status: "실패" };
  }
}

export async function deleteSpecificFolder({ id, email }) {
  if ((await isOwner({ id, user: email })) === true) {
    await deleteDoc(doc(db, "folder", id));
    return { status: "성공" };
  } else {
    return { status: "실패" };
  }
}

export async function addOrNotMember({ email, password, image }) {
  let cryptedPW = CryptoJS.PBKDF2(password, process.env.NEXT_PUBLIC_SALT, {
    keySize: 512 / 32,
    iterations: 1000,
  });
  const encrypted = CryptoJS.AES.encrypt(password, cryptedPW, {
    iv: CryptoJS.enc.Hex.parse(process.env.NEXT_PUBLIC_SALT),
  });
  const querySnapshot = await getDocs(collection(db, "user-postism"));
  const newSnapshot = doc(collection(db, "user-postism"));
  let check = 0;
  querySnapshot.forEach((doc) => {
    if (doc.data()["userEmail"] === email) {
      check = 2;
    }
  });
  if (check === 0) {
    await setDoc(newSnapshot, {
      id: newSnapshot.id,
      userEmail: email,
      userPw: encrypted.toString(),
      userImage: image,
    });
    return { status: "성공" };
  } else if (check === 2) {
    return { status: "중복" };
  }
}

export async function replaceToInSiteMember({ email }) {
  const querySnapshot = await getDocs(collection(db, "user-postism"));
  let replaced = { email: "", name: "", image: "" };
  querySnapshot.forEach((doc) => {
    if (doc.data()["userEmail"] === email) {
      replaced.email = doc.data()["userEmail"];
      replaced.image = doc.data()["userImage"];
    }
  });
  return replaced;
}

export async function getFoldersOrderList(id) {
  const querySnapshot = await getDocs(
    query(collection(db, "folder"), where("user", "==", id)),
  );
  if (querySnapshot.empty) {
    return [];
  }
  const fetchedFolders = [];
  querySnapshot.forEach((doc) => {
    const aTodo = {
      id: doc.id,
      liked: doc.data()["liked"],
      parentId: doc.data()["parentId"],
      realTitle: doc.data()["realTitle"],
      title: doc.data()["title"],
      order: doc.data()["order"],
      user: doc.data()["user"],
    };
    fetchedFolders.push(aTodo);
  });
  // 여기다 정렬 로직 추가
  return fetchedFolders;
}

export async function getUserPath(user) {
  const querySnapshot = await getDocs(
    query(collection(db, "folder"), where("user", "==", user)),
  );
  const fetchedPath = [];
  querySnapshot.forEach((doc) => {
    fetchedPath.push({
      id: doc.id,
      title: doc.data()["title"],
      liked: doc.data()["liked"],
      parentId: doc.data()["parentId"],
      realTitle: doc.data()["realTitle"],
      order: doc.data()["order"],
      user: doc.data()["user"],
    });
  });
  return fetchedPath;
}
