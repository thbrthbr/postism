import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export async function POST(req: NextRequest) {
  try {
    const { id, order, type } = await req.json();

    if (
      !id ||
      typeof order !== "number" ||
      (type !== "text" && type !== "folder")
    ) {
      return NextResponse.json({
        message: "결과",
        data: { status: "실패", reason: "invalid payload" },
      });
    }

    await updateDoc(doc(db, type, id), {
      order,
    });

    return NextResponse.json({
      message: "결과",
      data: { status: "성공" },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      message: "결과",
      data: { status: "실패" },
    });
  }
}
