import { Dispatch, SetStateAction } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

import { Sun, MoonStars } from 'tabler-icons-react';
import {
  ActionIcon,
  Button,
  Burger,
  ColorScheme,
  Group,
  Header as MantineHeader,
  MediaQuery,
  Text,
  useMantineTheme,
} from '@mantine/core';

interface HeaderProps {
  opened     : boolean;
  setOpened  : Dispatch<SetStateAction<boolean>>;
  colorScheme: ColorScheme;

  toggleColorScheme(value?: ColorScheme | undefined): void;
}

export default function Header({ opened, setOpened, colorScheme, toggleColorScheme }: HeaderProps) {
  const theme = useMantineTheme();

  const { data: session } = useSession();

  return (
    <MantineHeader height={70} p="md" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
        <Burger
          opened={opened}
          onClick={() => setOpened((o) => !o)}
          size="md"
          color={theme.colors.gray[6]}
          mr="xl"
        />
      </MediaQuery>

      <Group position="apart" style={{ width: '100%' }}>
        <Text size='xl'>Crafty POS</Text>
        <Group>
          {
            session
              ? (<Button size="sm" color="pink" onClick={() => signOut()}>Sign Out</Button>)
              : (<Button size="sm" color="green" onClick={() => signIn()}>Sign In</Button>)
          }
          <ActionIcon onClick={() => toggleColorScheme()} size="lg">
            {
              colorScheme === 'dark'
                ? <Sun size={24} />
                : <MoonStars size={24} />
            }
          </ActionIcon>
         </Group>
      </Group>
    </MantineHeader>
  );
}
