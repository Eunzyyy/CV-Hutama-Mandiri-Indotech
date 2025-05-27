// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password diperlukan");
        }

        try {
          // Cari user berdasarkan email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user) {
            throw new Error("Email atau password salah");
          }

          // Verifikasi password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Email atau password salah");
          }

          // Return user object (tanpa password)
          return {
            id: user.id.toString(), // Convert to string
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      }
    })
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  
  callbacks: {
    async jwt({ token, user }) {
      // Simpan data user ke dalam token saat login
      if (user) {
        console.log("🔧 JWT Callback - User data:", user);
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
      }
      console.log("🔧 JWT Callback - Token:", { id: token.id, role: token.role, name: token.name });
      return token;
    },
    
    async session({ session, token }) {
      // Kirim properti ke client
      if (token) {
        console.log("🔧 Session Callback - Token data:", { id: token.id, role: token.role });
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      console.log("🔧 Session Callback - Final session:", session.user);
      return session;
    }
  },
  
  pages: {
    signIn: "/login",
    signUp: "/register"
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  // Kustomisasi error handling
  events: {
    async signIn({ user }) {
      console.log(`✅ User ${user.email} berhasil login dengan role ${user.role}`);
    },
    async signOut({ session }) {
      console.log(`👋 User logout`);
    }
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
};