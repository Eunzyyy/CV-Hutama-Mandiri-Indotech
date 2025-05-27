// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "ADMIN" | "OWNER" | "FINANCE" | "CUSTOMER";
      image?: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "OWNER" | "FINANCE" | "CUSTOMER";
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "OWNER" | "FINANCE" | "CUSTOMER";
    name: string;
    email: string;
  }
}