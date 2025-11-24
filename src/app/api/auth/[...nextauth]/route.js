import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

console.log("Loading NextAuth route (no MongoDB)");

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // No database: use JWT sessions (default when no adapter provided)
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };