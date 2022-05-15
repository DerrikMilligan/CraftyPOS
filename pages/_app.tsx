import { AppProps } from 'next/app';
import { SessionProvider, signIn, signOut, useSession } from 'next-auth/react';

import Layout from 'components/Layout/MainLayout';

export default function App({ Component, pageProps }: AppProps) {
  const session = pageProps.session;

  return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
}
