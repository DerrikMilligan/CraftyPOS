import type { NextPage } from 'next'
import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

// @ts-ignore
import Barcode from 'react-barcode';

import {
  Button,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  Radio,
  RadioGroup,
  Space,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title, useMantineTheme,
} from '@mantine/core';
import { Barcode as BarcodeIcon, User as UserIcon } from 'tabler-icons-react';

import { Role, User } from '@prisma/client';
import { showNotification } from '@mantine/notifications';
import UseItems from '../lib/hooks/useItems';

const Admin: NextPage = () => {
  const [ role, setRole ] = useState(Role.USER);
  const [ username, setUsername ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ password2, setPassword2 ] = useState('');
  
  // const theme = useMantineTheme();
  // theme.colorScheme
  
  const { data: sessionData, status: authStatus } = useSession();
  
  const { items, isLoading, isError } = UseItems('all');
  
  if (isError) return (
    <Container p={0}>
      <Card p="lg">
        <Stack align="center">
          <Text align="center">{isError}</Text>
        </Stack>
      </Card>
    </Container>
  );
  
  // Handle the loading and error states
  if (authStatus === 'loading' || isLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );
  
  // @ts-ignore
  if (authStatus === 'unauthenticated' || sessionData?.role !== Role.ADMIN) return (
    <Container p={0}>
      <Card p="lg">
        <Stack align="center">
          <Text align="center">You are not authorized to view this page!</Text>
          <Button onClick={() => signIn()}>Click here to sign in</Button>
        </Stack>
      </Card>
    </Container>
  );
  
  const registerUser = async () => {
    if (password !== password2)
      return showNotification({
        title: 'Whoops!',
        color: 'red',
        message: 'The two passwords don\'t match',
      });
    
    const response = await fetch('/api/admin/register', {
      method: 'POST',
      body: JSON.stringify({
        username: username,
        password: password,
        role    : role,
        email   : '',
      }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    const body: GenericResponse = await response.json();
    
    if (body.success)
      showNotification({
        title: 'Success!',
        color: 'green',
        message: `Created ${username} successfully!`,
      });
    else
      showNotification({
        title: 'Uh oh!',
        color: 'red',
        message: `Failed to create ${username} Error: ${body.message}!`,
      });
  };
  
  return (
    <Container p={0}>
      <Card p="xl">
        <Title order={1}>Admin Tools</Title>
        
        <Space h="md" />
        
        <Tabs variant="outline" tabPadding="md">
          <Tabs.Tab label="Create User" icon={<UserIcon size={14} />}>
            <Title order={3}>Create a new user</Title>
            <Space h="md" />
            
            <form onSubmit={e => e.preventDefault()}>
              <TextInput mb="sm" value={username}  onChange={(event) => setUsername(event.target.value)} label="Username" />
              <TextInput mb="sm" value={password}  onChange={(event) => setPassword(event.target.value)} label="Password" type="password" />
              <TextInput mb="sm" value={password2} onChange={(event) => setPassword2(event.target.value)} label="Repeat Password" type="password" />

              <RadioGroup label="User Role" value={role} onChange={(r) => setRole(r as any)}>
                <Radio value={Role.ADMIN} label={Role.ADMIN.split(' ').map(w => w[0].toUpperCase() + w.substring(1).toLowerCase()).join(' ')} />
                <Radio value={Role.USER} label={Role.USER.split(' ').map(w => w[0].toUpperCase() + w.substring(1).toLowerCase()).join(' ')} />
              </RadioGroup>
            </form>
            
            <Space h="md" />
            <Group position="right">
              <Button onClick={registerUser}>Add User</Button>
            </Group>
          </Tabs.Tab>

          <Tabs.Tab label="Generate Barcodes" icon={<BarcodeIcon size={14} />}>
            <Title order={3}>Barcodes</Title>
            <Space h="md" />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
              {
                items &&
                items.map(item => (
                  <Barcode
                    key={item.id}
                    // Right now for generating we'll pad the start so that it's all the same size
                    value={JSON.stringify({i: item.id.toString().padStart(3, '0')})}
                    width={2}
                    text={`${item.id}: ${item.name}` + (item.Tags?.length > 0 ? ` (${item.Tags[0].name})` : '' )}
                    textMargin={10}
                    fontSize={12}
                    margin={20}
                  />
                ))
              }
            </div>
          </Tabs.Tab>
          
        </Tabs>
      </Card>
    </Container>
  );
};

export default Admin;
