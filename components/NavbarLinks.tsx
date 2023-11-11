import React from 'react';
import Link from 'next/link';

import { Box, Cash, List, ReportMoney, User } from 'tabler-icons-react';
import { NavLink, ThemeIcon } from '@mantine/core';

interface NavbarLinkProps {
  icon : React.ReactNode;
  color: string;
  label: string;
  path : string;
  closeNav(): void;
}

function NavbarLink({ icon, color, label, path, closeNav }: NavbarLinkProps) {
  return (
    <Link href={path} passHref>
      <NavLink
        onClick={() => closeNav()}
        label={label}
        leftSection={
          <ThemeIcon size="lg" color={color} variant="light">
            {icon}
          </ThemeIcon>
        }
      >
      </NavLink>
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
    { icon: <Box         size={24} />, color: 'lime',  label: 'Vendors'  , path: '/vendors' },
    { icon: <User        size={24} />, color: 'red',   label: 'Admin'    , path: '/admin' },
    { icon: <ReportMoney size={24} />, color: 'blue',  label: 'Reports'  , path: '/reports' },
  ];

  const links = navbarLinks.map((link) => {
    return <NavbarLink {...link} closeNav={closeNav} key={link.label} />;
  });

  return <div>{links}</div>;
}
