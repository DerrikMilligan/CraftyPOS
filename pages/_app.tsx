import { useState } from 'react';

import { AppProps } from 'next/app';
import Head from 'next/head';

import { Sun, MoonStars } from 'tabler-icons-react';

import {
  ActionIcon,
  AppShell,
  Burger,
  ColorScheme,
  Group,
  Header,
  MantineProvider,
  MediaQuery,
  Navbar,
  Text,
  useMantineTheme,
} from '@mantine/core';

import NavbarLinks from '../components/NavbarLinks';

export default function App(props: AppProps) {
  const { Component, pageProps } = props;
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
            <Header height={70} p="md" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
                <Burger
                  opened={opened}
                  onClick={() => setOpened((o) => !o)}
                  size="sm"
                  color={theme.colors.gray[6]}
                  mr="xl"
                />
              </MediaQuery>

              <Group position="apart" style={{ width: '100%' }}>
                <Text>Crafty POS</Text>
                <ActionIcon variant="default" onClick={() => toggleColorScheme()} size={30}>
                  {colorScheme === 'dark' ? <Sun size={16} /> : <MoonStars size={16} />}
                </ActionIcon>
              </Group>
            </Header>
          }
          navbar={
            <Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 200, lg: 300 }}>
              <NavbarLinks></NavbarLinks>
            </Navbar>
          }
        >
          {/* Here we actually have our page outlet */}
          <Component {...pageProps} />
        </AppShell>
      </MantineProvider>
    </>
  );
}
