import { addText, getTexts } from "@/firebase/firebaseConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.split(":")[0];
  const textId = request.nextUrl.searchParams.get("id")?.split(":")[1];
  const fetchedTexts = await getTexts(id || "", textId || "");
  const response = {
    message: "성공",
    data: fetchedTexts,
    status: 201,
  };
  return NextResponse.json(response, { status: 201 });
}

export async function POST(request: NextRequest) {
  const { title, path, order, realTitle, user, liked, parentId } =
    await request.json();
  let response;
  const addedText = await addText({
    realTitle,
    title,
    path,
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
