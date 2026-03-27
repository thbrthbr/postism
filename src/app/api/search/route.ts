import { searchUserItems } from "@/firebase/firebaseConfig";

export async function POST(req: any) {
  const { user, queryText, type } = await req.json();

  const results = await searchUserItems({
    user,
    queryText,
    type,
  });

  return Response.json({
    message: "검색 성공",
    data: results,
  });
}
