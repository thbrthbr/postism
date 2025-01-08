import { addText, getTexts } from '@/firebase/firebaseConfig'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const fetchedReplays = await getTexts(id || '')
  const response = {
    message: '성공',
    data: fetchedReplays,
    status: 201,
  }
  return NextResponse.json(response, { status: 201 })
}

export async function POST(request: NextRequest) {
  const { title, path, order, realTitle, user } = await request.json()
  const addedText = await addText({
    realTitle,
    title,
    path,
    order,
    user,
  })
  const response = {
    message: '무라사키',
    data: addedText,
  }
  return Response.json(response, { status: 200 })
}
