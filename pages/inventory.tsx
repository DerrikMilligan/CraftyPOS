import { useState } from 'react';
import type { NextPage } from 'next'

import Scanner from 'components/Scanner';

const Inventory: NextPage = () => {
  const [ scannedData, setScannedData ] = useState('');

  return (
    <div>
      <div style={{ position: 'relative', height: '500px', width: '400px' }}>
        {
          scannedData === ''
            ? <Scanner onScanned={setScannedData}></Scanner>
            : null
        }
      </div>

      <div>Data: { scannedData }</div>
    </div>
  );
}

export default Inventory;
