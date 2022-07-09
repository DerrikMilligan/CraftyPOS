import { forwardRef } from 'react';
import { Avatar, Badge, Container, Grid, Group, SelectItemProps, Text } from '@mantine/core';

import { Item, Tag, Vendor } from '@prisma/client';

export interface AutocompleteItemProps extends Omit<SelectItemProps, 'label'> {
  item: Item & { Vendor: Vendor, Tags: Tag[] };
}

export const AutocompleteItem = forwardRef<HTMLDivElement, AutocompleteItemProps>(({ value, item, ...others }: AutocompleteItemProps, ref) => {
  return (
    <Container ref={ref} {...others}>
      <Grid align="center">
        <Grid.Col span={1}>
          <Avatar radius="xl" size="sm" style={{ backgroundColor: item.Vendor.color }}>{item.Vendor.firstName[0]}{item.Vendor.lastName[0]}</Avatar>
        </Grid.Col>
        <Grid.Col span={3}><Text>{item.name}</Text></Grid.Col>
        <Grid.Col span={2}><Text color="green">${item.price}</Text></Grid.Col>
        <Grid.Col span={6}>
          <Group spacing="xs">
            {
              item.Tags &&
              item.Tags.map((tag) => (
                <Badge color="green" key={tag.id} size="xs">
                  {tag.name}
                </Badge>
              ))
            }
          </Group>
        </Grid.Col>
      </Grid>
    </Container>
  );
});

export default AutocompleteItem;
