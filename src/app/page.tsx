import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]/route'
import LoginSection from '@/components/LoginSection'
import UserPage from '@/components/UserPage'

export default async function Login() {
  const session = await getServerSession(authOptions)
  if (!session) return <LoginSection />
  return <UserPage />
}
