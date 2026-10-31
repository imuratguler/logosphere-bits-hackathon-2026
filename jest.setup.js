/* eslint-env jest */
/**
 * Logosphere BITS — global jest setup (native module stubs).
 *
 * Suites that render the real navigator transitively import the
 * camera screen, whose native kits (VisionCamera, Nitro Image,
 * image picker, blob file layer, react-native-permissions) have
 * no TurboModules under jest.
 * These lean stubs keep every suite hermetic; suites that drive
 * the camera or permission flow declare their own jest.mock for
 * the same modules, which wins over this file.
 */

jest.mock('react-native-vision-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Camera: props =>
      React.createElement(View, { ...props, testID: 'camera-view' }),
    useCameraDevice: () => undefined,
    usePhotoOutput: () => ({
      capturePhoto: () =>
        Promise.reject(new Error('Logosphere BITS: no camera under jest.')),
    }),
  };
});

jest.mock('react-native-nitro-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    NitroImage: props =>
      React.createElement(View, { ...props, testID: 'photo-preview' }),
  };
});

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: () => Promise.resolve({ didCancel: true }),
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { CacheDir: '/cache', DocumentDir: '/docs' },
      exists: () => Promise.resolve(false),
      isDir: () => Promise.resolve(false),
      mkdir: () => Promise.resolve(),
      cp: () => Promise.resolve(true),
    },
  },
}));

jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
    },
  },
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    LIMITED: 'limited',
    GRANTED: 'granted',
    BLOCKED: 'blocked',
  },
  check: () => Promise.resolve('denied'),
  request: () => Promise.resolve('denied'),
  openSettings: () => Promise.resolve(),
}));
