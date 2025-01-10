"use client";

import { signIn, signOut } from "next-auth/react";
import googleThumbnail from "@/asset/googlethumbnail.png";
import Image from "next/image";

export default function LoginSection() {
  const handleLogin = async (type: string) => {
    try {
      // if (type == 'kakao') {
      //   const result = await signIn('kakao', {
      //     username: '',
      //     password: '',
      //     redirect: true,
      //     callbackUrl: '/',
      //   })
      // }
      if (type == "google") {
        const result = await signIn("google", {
          username: "",
          password: "",
          redirect: true,
          callbackUrl: "/",
        });
      }
    } catch (e) {}
  };
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      {/* <button className="text-white" onClick={() => handleLogin('kakao')}>
      카카오로 로그인
    </button> */}
      <div className="flex select-none flex-col items-center justify-center font-lobster text-7xl">
        <p>Postism</p>
      </div>
      <button
        className="foont-semibold flex w-48 items-center rounded-md border bg-white px-2"
        onClick={() => handleLogin("google")}
      >
        <Image
          src={googleThumbnail.src}
          alt="google-thumbnail"
          width={40}
          height={40}
        />
        <div className="w-full font-lobster text-black">Google</div>
      </button>
    </div>
  );
}
