import React, { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';

import { Cash, List, ReportMoney } from 'tabler-icons-react';
import { UnstyledButton, Group, ThemeIcon, Text, MediaQuery, useMantineTheme } from '@mantine/core';

interface NavbarLinkProps {
  icon : React.ReactNode;
  color: string;
  label: string;
  path : string;
  closeNav(): void;
}

function NavbarLink({ icon, color, label, path, closeNav }: NavbarLinkProps) {
  const theme = useMantineTheme();

  return (
    <Link href={path} passHref>
      <UnstyledButton
        onClick={() => closeNav()}
        sx={(theme) => ({
          display: 'block',
          width: '100%',
          padding: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,

          '&:hover': {
            backgroundColor:
              theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
          },
        })}
      >
        <Group>
          <ThemeIcon size="lg" color={color} variant="light">
            {icon}
          </ThemeIcon>

          <Text>{label}</Text>
        </Group>
      </UnstyledButton>
    </Link>
  );
}

interface NavbarLinksProps {
  closeNav(): void;
}

export default function NavbarLinks({ closeNav }: NavbarLinksProps) {
  const navbarLinks = [
    { icon: <Cash        size={24} />, color: 'green', label: 'POS'      , path: '/' },
    { icon: <List        size={24} />, color: 'teal',  label: 'Inventory', path: '/inventory' },
    { icon: <ReportMoney size={24} />, color: 'blue',  label: 'Reports'  , path: '/' },
  ];

  const links = navbarLinks.map((link) => {
    return <NavbarLink {...link} closeNav={closeNav} key={link.label} />;
  });

  return <div>{links}</div>;
}
