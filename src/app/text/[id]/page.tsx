'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { ref, uploadString } from 'firebase/storage'
import { storage } from '@/firebase/firebaseConfig'
import { FaArrowLeft, FaArrowDown, FaRegSave } from 'react-icons/fa'
import Spinner from '@/components/spinner'
import { LuDownload } from 'react-icons/lu'
import { useSession } from 'next-auth/react'

export default function Text() {
  const { data: session } = useSession()
  const router = useRouter()
  const param = useParams()
  const contentRef = useRef<any>(null)
  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(true)
  const [original, setOriginal] = useState('')
  const [txtTitle, setTxtTitle] = useState('')
  const [isMe, setIsMe] = useState(false) // 이 정도로 수정 가능하게 되어 있는데 이거 추후에 수정해야함

  const getContent = async () => {
    if (param) {
      const result = await fetch(`/api/text/${param.id}`, {
        method: 'GET',
        cache: 'no-store',
      })
      const final = await result.json()
      const path = final.data[0].path
      const response = await fetch(path)
      const textContent = await response.text()
      setPath(final.data[0].title)
      setOriginal(textContent)
      if (contentRef.current) {
        if (final.data[0].user === session?.user?.email) {
          contentRef.current.readOnly = false
          setIsMe(true)
        }
        contentRef.current.value = textContent
      }
      setLoading(false)
      setTxtTitle(final.data[0].realTitle)
    }
  }

  const downloadTXT = (e: any) => {
    const willYou = window.confirm('텍스트 파일은 다운로드 하시겠습니까?')
    if (willYou) {
      if (contentRef.current) {
        const blob = new Blob([contentRef.current.value], {
          type: 'text/plain',
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.download = txtTitle
        a.href = url
        a.click()
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 100)
      }
    }
  }

  const editTXT = useCallback(async () => {
    if (contentRef.current) {
      if (isMe) {
        const fileRef = ref(storage, `texts/${path}.txt`)
        await uploadString(fileRef, contentRef.current.value, 'raw', {
          contentType: 'text/plain;charset=utf-8',
        })
        alert('저장되었습니다')
        setOriginal(contentRef.current.value)
      } else {
        alert('수정권한이 없습니다')
      }
    }
  }, [path, isMe])

  const handleSaveShortcut = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey && (event.key === 's' || event.key === 'S')) {
        event.preventDefault()
        editTXT()
      }
    },
    [editTXT],
  )

  const handleTabKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      const target = event.target as HTMLTextAreaElement
      const start = target.selectionStart
      const tabSpace = '  '
      target.focus()
      // execCommand 써야 tab한 것에 대한 컨트롤 z가 제대로 작동함 -> 바꿀 수 있으면 나중에 바꿔보자
      document.execCommand('insertText', false, `${tabSpace}`)
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + tabSpace.length
      }, 0)
    }
  }

  const handleBack = () => {
    if (contentRef.current) {
      if (contentRef.current.value !== original) {
        const confirm = window.confirm(
          '내용이 변경되었습니다. \n변경사항을 저장하지 않고 페이지를 이탈하시겠습니까?',
        )
        if (confirm) router.push('/')
      } else router.push('/')
    }
  }

  useEffect(() => {
    getContent()
    document.addEventListener('keydown', handleSaveShortcut)
    return () => {
      document.removeEventListener('keydown', handleSaveShortcut)
    }
  }, [handleSaveShortcut])

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center text-white">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="w-full flex justify-center items-center gap-16 px-1 py-3">
        <button onClick={handleBack}>
          <FaArrowLeft className="text-[#FFFFFF]" />
        </button>
        <button onClick={editTXT}>
          <FaRegSave className="text-[#FFFFFF]" />
        </button>
        <button onClick={downloadTXT}>
          <LuDownload className="text-[#FFFFFF] font-bold" />
        </button>
        <button
          onClick={() =>
            contentRef.current?.scrollTo({
              top: contentRef.current.scrollHeight,
            })
          }
        >
          <FaArrowDown className="text-[#FFFFFF]" />
        </button>
      </div>
      <textarea
        readOnly={true}
        ref={contentRef}
        onKeyDown={handleTabKey}
        className="relative h-screen overflow-y-scroll scrollbar outline-none bg-black m-4 text-white resize-none"
      ></textarea>
    </div>
  )
}
