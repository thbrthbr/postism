import {
  editPath,
  editSpecificFolderTitle,
  getChildren,
} from "@/firebase/firebaseConfig";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = context.params;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const queryParam = searchParams.get("user");

  console.log(queryParam);
  try {
    const fetchedSearchFolder = await getChildren(id, queryParam);

    if (!fetchedSearchFolder) {
      return NextResponse.json(
        { message: "데이터를 찾을 수 없습니다." },
        { status: 404 }, // 404 Not Found
      );
    }

    return NextResponse.json(
      { message: "성공", data: fetchedSearchFolder },
      { status: 200 }, // 200 OK
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "서버 에러가 발생했습니다.", error },
      { status: 500 }, // 500 Internal Server Error
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = context.params;

  try {
    const body = await request.json();

    if (id === "edit-path") {
      const { id: textId, newPath, type } = body;

      const result = await editPath({ id: textId, type, newPath });

      return NextResponse.json(
        { message: "경로 수정 성공", data: result },
        { status: 200 }, // 200 OK
      );
    }

    return NextResponse.json(
      { message: "잘못된 요청입니다." },
      { status: 400 }, // 400 Bad Request
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "서버 에러가 발생했습니다.", error },
      { status: 500 }, // 500 Internal Server Error
    );
  }
}
