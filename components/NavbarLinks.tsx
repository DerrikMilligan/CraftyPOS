import React from 'react';

import { Cash, List, ReportMoney } from 'tabler-icons-react';

import { UnstyledButton, Group, ThemeIcon, Text } from '@mantine/core';

interface NavbarLinkProps {
  icon: React.ReactNode;
  color: string;
  label: string;
}

function NavbarLink({ icon, color, label }: NavbarLinkProps) {
  return (
    <UnstyledButton
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
        <ThemeIcon color={color} variant="light">
          {icon}
        </ThemeIcon>

        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  );
}

const navbarLinks = [
  { icon: <Cash size={16} />, color: 'green', label: 'POS' },
  { icon: <List size={16} />, color: 'teal', label: 'Inventory' },
  { icon: <ReportMoney size={16} />, color: 'blue', label: 'Reports' },
];

export default function NavbarLinks() {
  const links = navbarLinks.map((link) => <NavbarLink {...link} key={link.label} />);
  return <div>{links}</div>;
}
