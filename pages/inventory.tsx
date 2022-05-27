import { useState } from 'react';
import type { NextPage } from 'next'

import { Modal, Button, Group } from '@mantine/core';

import Scanner from 'components/Scanner';

const Inventory: NextPage = () => {
  const [ scanning, setScanning ] = useState(false);
  const [ scannedData, setScannedData ] = useState('');

  return (
    <>
      <Modal
        opened={scanning}
        onClose={() => setScanning(false)}
        title="Scanning Barcode"
        centered
        size="xl"
      >
        <Scanner onScanned={setScannedData}></Scanner>
      </Modal>

      <Group position="center">
        <Button onClick={() => setScanning(true)}>Start Scanning</Button>
      </Group>

      <div>Scanned Data: { scannedData }</div>
    </>
  );
}

export default Inventory;
