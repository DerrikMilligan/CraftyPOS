import React, { useRef, useEffect, useState } from 'react';

import { Result, NotFoundException } from '@zxing/library';
import {
  BrowserMultiFormatReader,
  BrowserCodeReader,
  IScannerControls,
} from '@zxing/browser';

import {
  Container,
  Group,
  NativeSelect,
  Text,
} from '@mantine/core';

export interface IScannerProps {
  onScanned?(text: string): void;
  width?: number;
  height?: number;
}

export default function Scanner({ onScanned = (text) => {} }: IScannerProps) {
  const [ inputDevices, setInputDevices ] = useState<MediaDeviceInfo[]>([]);
  const [ selectedDevice, setSelectedDevice ] = useState<MediaDeviceInfo>();
  const [ controls, setControls ] = useState<IScannerControls>();

  const previewEl = useRef<HTMLVideoElement>(null);

  const codeReader = new BrowserMultiFormatReader();

  const startScanning = async () => {
    if (selectedDevice === undefined)
      return console.error('No device selected');

    if (previewEl.current === null)
      return console.error('no video element');

    setControls(await codeReader.decodeFromVideoDevice(
      selectedDevice.deviceId,
      previewEl.current,
      (result, error, controls) => {
        // If we just haven't found anything then just hangout
        if (error instanceof NotFoundException) {
          return;
        }

        onScanned(result?.getText() || '__ScanError__');
        // console.log(result, error, controls);
      }
    ));

    console.log(`Started continous decode from camera with id ${selectedDevice.deviceId}`);
  };

  const stopScanning = () => {
    if (controls === undefined)
      return console.error('No controls to stop');

    controls.stop();
  };

  useEffect(() => { startScanning(); return stopScanning }, [ selectedDevice ]);

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
      <Group position="center">
        <NativeSelect
          m="xs"
          size="xs"
          data={inputDevices.map(device => device.label)}
          onChange={event => setSelectedDevice(inputDevices.find(device => device.label == event.target.value))}
        ></NativeSelect>
        <video style={{ width: '100%' }} ref={previewEl}></video>
      </Group>
    </>
  );
}

