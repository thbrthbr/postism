import { getUserPath } from "@/firebase/firebaseConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.split(":")[0];
  const fetchedPaths = await getUserPath(id);
  const response = {
    message: "성공",
    data: fetchedPaths,
    status: 201,
  };
  return NextResponse.json(response, { status: 201 });
}
