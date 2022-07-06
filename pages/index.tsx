import { useState } from 'react';
import type { NextPage } from 'next'

import { Search } from 'tabler-icons-react';
import {
  Autocomplete,
  AutocompleteItem as AutocompleteItemMantine,
  Button,
  Card,
  Group,
  Loader, MANTINE_COLORS,
  Modal,
  Table,
  TextInput,
  Title,
} from '@mantine/core';

import levenshtein from 'js-levenshtein';
import fuzzysort from 'fuzzysort';

import Scanner from 'components/Scanner';
import { AutocompleteItem, AutocompleteItemProps } from 'components/AutocompleteItem';

import useItems from '../lib/hooks/useItems';

const Checkout: NextPage = () => {
  const [ scanning, setScanning ] = useState(false);
  const [ scannedData, setScannedData ] = useState('');

  // Get the items
  const { items, isLoading, isError } = useItems('all');

  // Handle the loading and error states
  if (isLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );
  if (isError) return <div>Error! {isError}...</div>

  // Make the list of items for the autocomplete to use
  const autocompleteItems = items?.map(item => {
    return {
      value: item.name,
      key: item.id,
      item
    } as AutocompleteItemProps;
  }) || [];
  
  console.log('Component rendering');
  
  // Update the items based upon what the user has typed
  const filterItems = (search: string, autocompleteItem: AutocompleteItemProps): boolean => {
    // If we don't even have a search param then just leave the item in the list
    if (search.trim().length <= 0)
      return true;
    
    const searchLower = search.toLowerCase();
    
    // If the name contains the whole string then heck yeah just return yes
    if (autocompleteItem.item.name.toLowerCase().includes(searchLower))
      return true;
    
    // If we are part of a tag exactly then return true
    for (const tag of autocompleteItem.item.Tags)
      if (tag.name.toLowerCase().includes(searchLower))
        return true;
    
    // If we are part of a persons name then return true as well
    if (
      autocompleteItem.item.Vendor.firstName.toLowerCase().includes(searchLower) ||
      autocompleteItem.item.Vendor.lastName.toLowerCase().includes(searchLower)
    )
      return true;

    // Attempt to do a fuzzy search
    const fuzzy = fuzzysort.go(searchLower, [ autocompleteItem.item.name, ...autocompleteItem.item.Tags.map(t => t.name) ], { threshold: -30000 });
    if (fuzzy.length > 0)
      return true;
    
    // Otherwise we'll try and compute some levenshtein magic
    const lev = levenshtein(search.toLowerCase(), autocompleteItem.item.name.toLowerCase());
    const ratio = (lev) / (Math.max(search.length, autocompleteItem.item.name.length));
    
    // Here's our magic difference ratio for determining if the word is close enough
    return ratio <= .4;
  };

  // @ts-ignore
  // @ts-ignore
  return (
    <>
      <Modal
        opened={scanning}
        onClose={() => setScanning(false)}
        title="Scanning Barcode"
        centered
        size="xl"
      >
        <Scanner scanning={scanning} onScanned={(text) => { setScannedData(text); setScanning(false); }}></Scanner>
      </Modal>

      <Card p="lg">
        <Group position="apart" mb="md">
          <Title>Create Invoice</Title>
          <Button onClick={() => setScanning(true)}>Scan Item</Button>
        </Group>
        
        <Group grow>
          <Autocomplete
            data={autocompleteItems as AutocompleteItemMantine[]}
            // Don't worry about the type mismatch here. The function definition is correct for
            // what we actually receive
            filter={filterItems}
            itemComponent={AutocompleteItem}
            placeholder="Search for items..."
            icon={<Search size={16} />}
            limit={10}
          />
        </Group>
        
        <Table>
          
        </Table>
      </Card>

      <div>Scanned Data: { scannedData }</div>
    </>
  );
}

export default Checkout;
