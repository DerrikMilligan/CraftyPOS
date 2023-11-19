import Head from 'next/head';

import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';

import Layout from 'components/Layout/MainLayout';

export default function App({ Component, pageProps }: AppProps) {
  const session = pageProps.session;

  return (
    <>
      <Head>
        <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height, target-densitydpi=device-dpi" />
      </Head>
      <SessionProvider session={session}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </SessionProvider>
    </>
  );
}
