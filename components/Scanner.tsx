import { useRef, useEffect, useState } from 'react';

import { Result } from '@zxing/library';
import { BrowserMultiFormatReader, BrowserCodeReader, IScannerControls } from '@zxing/browser';

export default function Scanner() {
  const [ inputDevices, setInputDevices ] = useState<MediaDeviceInfo[]>([]);
  const [ selectedDevice, setSelectedDevice ] = useState<MediaDeviceInfo>();
  const [ controls, setControls ] = useState<IScannerControls>();
  const [ isScanning, setIsScanning ] = useState(false);
  const [ scannedResult, setScannedResult ] = useState<Result>();
  const previewEl = useRef<HTMLVideoElement>();

  const codeReader = new BrowserMultiFormatReader();

  const startScanning = async () => {
    if (selectedDevice === undefined)
      return console.error('No device selected');

    if (previewEl.current === undefined)
      return console.error('no video element');

    setControls(await codeReader.decodeFromVideoDevice(
      selectedDevice.deviceId,
      previewEl.current,
      (result, error, controls) => {
        setScannedResult(result);
        console.log(result, error, controls);
      }
    ));
    setIsScanning(true);

    console.log(`Started continous decode from camera with id ${selectedDevice.deviceId}`);
  };

  const stopScanning = async () => {
    if (controls === undefined)
      return console.error('No controls to stop');

    controls.stop();

    setIsScanning(false);
  };

  useEffect(() => {
    // Trigger the load for input devices on component mount
    BrowserCodeReader.listVideoInputDevices().then((devices) => {
      if (devices.length <= 0) {
        console.log('No devices found!');
        return;
      }

      setInputDevices(devices);
      setSelectedDevice(devices[0]);
    });
  }, []);

  return (
    <>
      <div>
        Using {selectedDevice?.label || 'None'}
      </div>
      <select onChange={(value) => console.log(value)}>
        {
          inputDevices.map((device, index) =>
            <option key={index}>
              {device.label}
            </option>
          )
        }
      </select>
      <button
        onClick={isScanning ? stopScanning : startScanning}
      >
        {isScanning ? 'Stop Scanning' : 'Start Scanning'}
      </button>
      <div>
        <video ref={previewEl}></video>
      </div>
      <div>
        { scannedResult?.getText() || 'None' }
      </div>
    </>
  );
}

