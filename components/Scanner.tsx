import React, { useRef, useEffect, useState, useMemo } from 'react';

import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';
import {
  BrowserMultiFormatOneDReader,
  BrowserCodeReader,
  IScannerControls,
} from '@zxing/browser';

import {
  Group,
  NativeSelect,
} from '@mantine/core';

import { useLocalStorage } from '@mantine/hooks';

export interface IScannerProps {
  scanning?: boolean;
  onScanned?(text: string): void;
}

export default function Scanner({ scanning = true, onScanned = () => {} }: IScannerProps) {
  const [ inputDevices, setInputDevices ] = useState<MediaDeviceInfo[]>([]);
  const [ selectedDevice, setSelectedDevice ] = useState<MediaDeviceInfo>();
  const [ controls, setControls ] = useState<IScannerControls>();
  const [ lastCameraUsed, setLastCameraUsed ] = useLocalStorage<string | null>({ key: 'last-camera', defaultValue: null });

  const previewEl = useRef<HTMLVideoElement>(null);
  // const codeReader = new BrowserMultiFormatReader();

  // prep the codeReader with using a 1D reader so there's less codes we're scanning for
  const hints      = useMemo(() => new Map(), []);
  const codeReader = useMemo(() => new BrowserMultiFormatOneDReader(hints), [hints]);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [ BarcodeFormat.CODE_128 ]);

  useEffect(() => {
    if (scanning === true) {
      if (selectedDevice === undefined)
        return console.error('No device selected');

      if (previewEl.current === null)
        return console.error('no video element');

      setLastCameraUsed(selectedDevice.deviceId);

      codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        previewEl.current,
        (result, error, controls) => {
          // If we just haven't found anything then just hangout
          if (error instanceof NotFoundException)
            return;

          // We found something so send it up!
          onScanned(result?.getText() || '__ScanError__');

          // Right now how I'll always use it is to stop scanning when we find something
          controls.stop();
        }
      ).then(setControls);

      console.log(`Started continuous decode from camera with id ${selectedDevice.deviceId}`);

      return () => {
        if (controls === undefined)
          return console.error('No controls to stop');

        controls.stop();
      };
    }
  }, [ codeReader, controls, onScanned, scanning, selectedDevice, setLastCameraUsed ]);

  useEffect(() => {
    // Trigger the load for input devices on component mount
    BrowserCodeReader.listVideoInputDevices().then((devices) => {
      if (devices.length <= 0) {
        console.log('No devices found!');
        return;
      }

      setInputDevices(devices);

      if (lastCameraUsed !== null)
        setSelectedDevice(devices.find(device => device.deviceId === lastCameraUsed) || devices[0]);
      else
        setSelectedDevice(devices[0]);

      return () => {
        if (controls === undefined)
          return console.error('No controls to stop');

        controls.stop();
      };
    });
  }, [ controls, lastCameraUsed ]);

  return (
    <>
      <Group position="center">
        <NativeSelect
          m="xs"
          size="xs"
          data={inputDevices.map(device => device.label)}
          value={selectedDevice?.label}
          onChange={event => setSelectedDevice(inputDevices.find(device => device.label == event.target.value))}
        ></NativeSelect>
        <video style={{ width: '100%' }} ref={previewEl}></video>
      </Group>
    </>
  );
}
