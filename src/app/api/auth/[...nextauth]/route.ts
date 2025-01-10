// import KakaoProvider from 'next-auth/providers/kakao'
// import CredentialsProvider from 'next-auth/providers/credentials'
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import {
  addOrNotMember,
  replaceToInSiteMember,
} from "@/firebase/firebaseConfig";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session !== null) {
        const { image } = session as { image: string };
        if (image?.length > 1) {
          token.image = image;
          token.picture = image;
        }
      }
      return { ...token, ...user };
    },

    // async session({ session, token }) {
    //   session.user = {
    //     ...session.user,
    //     name: token.name || '',
    //     email: token.email || '',
    //     image: token.image || '',
    //   } as any // 세션 데이터에 타입 지정
    //   return session
    // },

    async signIn({ user }) {
      try {
        const makeCode = (length: number) => {
          const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
          return Array.from({ length })
            .map(() =>
              characters.charAt(Math.floor(Math.random() * characters.length)),
            )
            .join("");
        };

        const email = user.email!;
        const password = `${user.id}${makeCode(8)}`;
        const image = user.image!;

        const state = await addOrNotMember({ email, password, image });

        if (state?.status === "중복") {
          const replaced = await replaceToInSiteMember({ email });
          //   user.name = replaced.name
          user.image = replaced.image;
        }
        return true;
      } catch (e) {
        console.error("Sign-in Error:", e);
        return false;
      }
    },
  },
};

export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions);

// export { handler as GET, handler as POST }
