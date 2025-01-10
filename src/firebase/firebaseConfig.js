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
import { getStorage } from "firebase/storage";
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

export async function addText({ title, path, order, realTitle, user }) {
  const newReplay = doc(collection(db, "text"));
  await setDoc(newReplay, {
    id: newReplay.id,
    title,
    realTitle,
    path,
    order,
    user,
  });
  return {
    id: newReplay.id,
    title,
    path,
    order,
    realTitle,
    user,
  };
}

export async function getTexts(id) {
  const querySnapshot = await getDocs(
    query(collection(db, "text"), where("user", "==", id)),
  );
  if (querySnapshot.empty) {
    return [];
  }
  const fetchedReplays = [];
  querySnapshot.forEach((doc) => {
    const aTodo = {
      id: doc.id,
      realTitle: doc.data()["realTitle"],
      title: doc.data()["title"],
      path: doc.data()["path"],
      order: doc.data()["order"],
      user: doc.data()["user"],
    };
    fetchedReplays.push(aTodo);
  });
  return fetchedReplays;
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
      realTitle: doc.data()["realTitle"],
      path: doc.data()["path"],
      order: doc.data()["order"],
      user: doc.data()["user"],
    });
  });
  return fetchedTexts;
}

export async function editSpecificTitle({ id, newTitle }) {
  const todoRef = doc(db, "text", id);
  const fetched = await updateDoc(todoRef, {
    realTitle: newTitle,
  });
  return fetched;
}

export async function deleteSpecificText(id) {
  // 여기에 실제 파일 삭제하게 로직 추가 -> title로 받아와서 path로 쓰면 될거임
  await deleteDoc(doc(db, "text", id));
  return { status: "성공" };
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
