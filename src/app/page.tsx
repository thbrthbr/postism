import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import UserPage from "@/components/UserPage";
import LoginSection from "@/components/LoginSection";

export default async function Login() {
  const session = await getServerSession(authOptions);
  if (!session) return <LoginSection />;
  return <UserPage />;
}
