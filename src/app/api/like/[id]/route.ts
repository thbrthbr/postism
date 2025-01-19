import { editLikeState } from "@/firebase/firebaseConfig";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const body = await request.json();
    const { id, isLike } = body;
    const result = await editLikeState({ id, isLike });
    return NextResponse.json(
      { message: "좋아요 상태 변경 성공", data: result },
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
