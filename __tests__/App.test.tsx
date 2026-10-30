/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import vwAppRoot from '../App';
import { vwSplash } from '../src/components/vwSplash';
import { fncRunReadDeviceTag } from '../src/i18n/intLocale';

jest.mock('react-native-safe-area-context', () => {
  const fldObjMockModule = jest.requireActual<{
    default: Record<string, unknown>;
  }>('react-native-safe-area-context/jest/mock');
  return fldObjMockModule.default;
});

jest.mock('../src/i18n/intLocale', () => {
  const fldObjActual = jest.requireActual('../src/i18n/intLocale');
  return {
    ...fldObjActual,
    fncRunReadDeviceTag: jest.fn(fldObjActual.fncRunReadDeviceTag),
  };
});

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('shows the splash inside SafeAreaProvider while starting', async () => {
  let fldObjTree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjTree = ReactTestRenderer.create(React.createElement(vwAppRoot));
  });
  const fldObjRoot = fldObjTree?.root;
  expect(fldObjRoot?.findAllByType(SafeAreaProvider).length).toBe(1);
  expect(fldObjRoot?.findByType(vwSplash).props.fldBooLoading).toBe(true);
});

test('finishes loading after the startup delay', async () => {
  let fldObjTree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjTree = ReactTestRenderer.create(React.createElement(vwAppRoot));
  });
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(800);
  });
  const fldObjSplash = fldObjTree?.root.findByType(vwSplash);
  expect(fldObjSplash?.props.fldBooLoading).toBe(false);
  expect(fldObjSplash?.props.fldStrError).toBeNull();
});

test('shows a retryable error instead of loading forever', async () => {
  jest.mocked(fncRunReadDeviceTag).mockImplementationOnce(() => {
    throw new Error('k46-startup');
  });
  let fldObjTree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjTree = ReactTestRenderer.create(React.createElement(vwAppRoot));
  });
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(800);
  });
  const fldObjSplash = fldObjTree?.root.findByType(vwSplash);
  expect(fldObjSplash?.props.fldBooLoading).toBe(false);
  expect(fldObjSplash?.props.fldStrError).toBe('Please try again.');
});

test('retries startup after an error', async () => {
  jest.mocked(fncRunReadDeviceTag).mockImplementationOnce(() => {
    throw new Error('k46-retry');
  });
  let fldObjTree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjTree = ReactTestRenderer.create(React.createElement(vwAppRoot));
  });
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(800);
  });
  expect(
    fldObjTree?.root.findByType(vwSplash).props.fldStrError,
  ).not.toBeNull();
  await ReactTestRenderer.act(async () => {
    fldObjTree?.root.findByType(vwSplash).props.actHandOnRetry();
  });
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(800);
  });
  const fldObjSplash = fldObjTree?.root.findByType(vwSplash);
  expect(fldObjSplash?.props.fldStrError).toBeNull();
  expect(fldObjSplash?.props.fldBooLoading).toBe(false);
});
