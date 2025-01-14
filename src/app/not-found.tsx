import Link from "next/link";
import Logo from "@/components/Logo";
import { FaArrowLeft } from "react-icons/fa";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-1">
      <Logo />
      <p className="font-lobster text-5xl">404</p>
      <Link href="/" className="flex text-3xl italic">
        <FaArrowLeft />
      </Link>
    </div>
  );
}
