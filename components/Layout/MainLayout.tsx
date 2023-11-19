import { useState } from 'react';
import Head from 'next/head';

import {
  AppShell,
  ColorScheme,
  MantineProvider,
  Navbar,
  useMantineTheme,
} from '@mantine/core';

import { NotificationsProvider } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

import NavbarLinks from 'components/NavbarLinks';
import Header from './Header';

interface ILayoutProps {
  children: React.ReactNode,
}

export default function Layout({ children }: ILayoutProps) {
  const theme = useMantineTheme();

  const [ opened, setOpened ] = useState(false);
  const [ colorScheme, setColorScheme ] = useState<ColorScheme>('dark');

  const toggleColorScheme = (value?: ColorScheme) => {
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  }

  return (
    <>
      <Head>
        <title>Crafty POS</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>

      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{ colorScheme: colorScheme }}
      >
        <NotificationsProvider position="top-right">
          <ModalsProvider>
            <AppShell
              styles={{
                main: {
                  background: colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
                },
              }}
              navbarOffsetBreakpoint="sm"
              asideOffsetBreakpoint="sm"
              fixed
              header={
                <Header
                  opened={opened}
                  setOpened={setOpened}
                  colorScheme={colorScheme}
                  toggleColorScheme={toggleColorScheme}
                ></Header>
              }
              navbar={
                <Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 200, lg: 300 }}>
                  <NavbarLinks closeNav={() => setOpened(false)}></NavbarLinks>
                </Navbar>
              }
            >
              { children }
            </AppShell>
          </ModalsProvider>
        </NotificationsProvider>
      </MantineProvider>
    </>
  );
}
