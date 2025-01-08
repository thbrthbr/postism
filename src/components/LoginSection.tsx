'use client'

import { signIn, signOut } from 'next-auth/react'
import googleThumbnail from '@/asset/googlethumbnail.png'
import Image from 'next/image'

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
      if (type == 'google') {
        const result = await signIn('google', {
          username: '',
          password: '',
          redirect: true,
          callbackUrl: '/',
        })
      }
    } catch (e) {}
  }
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center gap-4">
      {/* <button className="text-white" onClick={() => handleLogin('kakao')}>
      카카오로 로그인
    </button> */}
      <div className="flex flex-col justify-center items-center text-7xl font-lobster select-none">
        <p className="text-white">Postism</p>
      </div>
      <button
        className="w-48 px-2 bg-white rounded-md flex items-center foont-semibold"
        onClick={() => handleLogin('google')}
      >
        <Image
          src={googleThumbnail.src}
          alt="google-thumbnail"
          width={40}
          height={40}
        />
        <div className="w-full font-lobster">Google</div>
      </button>
    </div>
  )
}
