import { useState } from 'react';
import Head from 'next/head';

import {
  AppShell,
  MantineProvider,
  useMantineTheme,
  createTheme,
} from '@mantine/core';

import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import NavbarLinks from 'components/NavbarLinks';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode,
}

const mantineTheme = createTheme({});

export default function Layout({ children }: LayoutProps) {
  const theme = useMantineTheme();

  const [ opened, setOpened ] = useState(false);
  const [ opened, { toggle }] = useDisclosure();

  // const [ colorScheme, setColorScheme ] = useState<ColorScheme>('dark');
  //
  // const toggleColorScheme = (value?: ColorScheme) => {
  //   setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  // }

  return (
    <>
      <Head>
        <title>Crafty POS</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>

      <MantineProvider theme={mantineTheme} defaultColorScheme="dark">
        <Notifications position="top-right">
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
              navbar={
                <Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 200, lg: 300 }}>
                  <NavbarLinks closeNav={() => setOpened(false)}></NavbarLinks>
                </Navbar>
              }
            >

              <AppShell.Header>
                <Header
                  opened={opened}
                  setOpened={setOpened}
                  colorScheme={colorScheme}
                  toggleColorScheme={toggleColorScheme}
                ></Header>
              </AppShell.Header>

              <AppShell.Navbar>
              </AppShell.Navbar>

              { children }
            </AppShell>
          </ModalsProvider>
        </Notifications>
      </MantineProvider>
    </>
  );
}
