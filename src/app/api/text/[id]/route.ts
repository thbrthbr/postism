import {
  deleteSpecificText,
  editSpecificTitle,
  getSpecificText,
} from "@/firebase/firebaseConfig";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const fetchedSearchTexts = await getSpecificText(id);

    if (!fetchedSearchTexts) {
      return NextResponse.json(
        { message: "데이터를 찾을 수 없습니다." },
        { status: 404 }, // 404 Not Found
      );
    }

    return NextResponse.json(
      { message: "성공", data: fetchedSearchTexts },
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

    if (id === "edit-title") {
      const { id: textId, newTitle } = body;

      const result = await editSpecificTitle({ id: textId, newTitle });

      return NextResponse.json(
        { message: "제목 수정 성공", data: result },
        { status: 200 }, // 200 OK
      );
    }

    // if (id === "edit-content") {
    //   const { id: textId, newTitle } = body;

    //   const result = await editSpecificTitle({ id: textId, newTitle });

    //   return NextResponse.json(
    //     { message: "제목 수정 성공", data: result },
    //     { status: 200 }, // 200 OK
    //   );
    // }

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

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = context.params;

  try {
    if (id === "delete") {
      const body = await request.json();
      const { id: textId, title } = body;

      const deleteResult = await deleteSpecificText(textId, title);

      if (!deleteResult) {
        return NextResponse.json(
          { message: "삭제할 데이터를 찾을 수 없습니다." },
          { status: 404 }, // 404 Not Found
        );
      }

      return NextResponse.json(
        { message: "삭제 성공", data: deleteResult },
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
