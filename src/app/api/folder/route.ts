import { addFolder, getFolders } from "@/firebase/firebaseConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.split(":")[0];
  const folderId = request.nextUrl.searchParams.get("id")?.split(":")[1];
  const fetchedReplays = await getFolders(id || "", folderId || "");
  const response = {
    message: "성공",
    data: fetchedReplays,
    status: 201,
  };
  return NextResponse.json(response, { status: 201 });
}

export async function POST(request: NextRequest) {
  const { title, order, realTitle, user, liked, parentId } =
    await request.json();
  let response;
  const addedText = await addFolder({
    realTitle,
    title,
    order,
    user,
    liked,
    parentId,
  });
  if (addedText.id === undefined) {
    response = {
      message: "아오",
      data: addedText,
    };
  } else {
    response = {
      message: "무라사키",
      data: addedText,
    };
  }
  return Response.json(response, { status: 200 });
}
