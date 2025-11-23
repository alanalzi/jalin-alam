import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from '@/app/lib/db';
import User from '@/app/models/User';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // Use JWT strategy since we manage users with Mongoose
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // On sign in, ensure the user exists in our MongoDB (create or update)
    async signIn({ user, account, profile }) {
      try {
        await connectDB();
        // Upsert user by email
        const filter = { email: user.email };
        const update = {
          name: user.name,
          email: user.email,
          image: user.image,
        };
        const options = { upsert: true, new: true, setDefaultsOnInsert: true };
        // findOneAndUpdate returns the document when used on the model (mongoose)
        await User.findOneAndUpdate(filter, update, options);
        return true;
      } catch (err) {
        console.error('Error in signIn callback:', err);
        return false;
      }
    },

    // Persist user id and role into the token
    async jwt({ token, user }) {
      // On initial sign in, query DB for user to get _id and role
      if (user) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email }).lean();
          if (dbUser) {
            token.id = String(dbUser._id);
            token.role = dbUser.role || 'user';
          }
        } catch (err) {
          console.error('Error in jwt callback (initial):', err);
        }
      }
      return token;
    },

    // Make id and role available in session on the client
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role || 'user';
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };