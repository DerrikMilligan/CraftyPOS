import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { credentialsAreValid } from 'lib/User';

export default NextAuth({
  theme: {
    colorScheme: 'dark',
  },

  session: {
    strategy: 'jwt',
  },

  providers: [
    CredentialsProvider({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials, req) {
        const authResponse = await credentialsAreValid({
          // Check for email or username with the username field
          email   : credentials?.username || '',
          username: credentials?.username || '',
          password: credentials?.password || '',
        });

        if (authResponse.success === false) {
          return null;
        }

        if (authResponse.data === undefined) {
          return null;
        }

        return authResponse.data;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // First time the JWT callback is run we have the user object
      if (user) {
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.id = token.id;
      }

      return session;
    },
  }
});
