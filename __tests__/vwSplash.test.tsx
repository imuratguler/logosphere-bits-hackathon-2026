/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vwButton } from '../src/components/vwButton';
import { vwLoading } from '../src/components/vwLoading';
import { vwLogo } from '../src/components/vwLogo';
import { vwSplash } from '../src/components/vwSplash';
import { fldObjStringsEn } from '../src/i18n/intTranslations';

test('shows brand and loading state while starting', async () => {
  let fldObjTree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjTree = ReactTestRenderer.create(
      React.createElement(vwSplash, {
        fldBooLoading: true,
        fldObjStrings: fldObjStringsEn,
        fldStrError: null,
        actHandOnRetry: () => undefined,
      }),
    );
  });
  const fldObjRoot = fldObjTree?.root;
  expect(fldObjRoot?.findAllByType(SafeAreaView).length).toBe(1);
  expect(fldObjRoot?.findAllByType(vwLogo).length).toBe(1);
  expect(fldObjRoot?.findAllByType(vwLoading).length).toBe(1);
  expect(fldObjRoot?.findAllByType(vwButton).length).toBe(0);
});

test('shows error with retry instead of the loader', async () => {
  let fldBooRetried = false;
  let fldObjTree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjTree = ReactTestRenderer.create(
      React.createElement(vwSplash, {
        fldBooLoading: false,
        fldObjStrings: fldObjStringsEn,
        fldStrError: 'Please try again.',
        actHandOnRetry: () => {
          fldBooRetried = true;
        },
      }),
    );
  });
  const fldObjRoot = fldObjTree?.root;
  expect(fldObjRoot?.findAllByType(vwLoading).length).toBe(0);
  expect(fldObjRoot?.findAllByType(vwButton).length).toBe(1);
  fldObjRoot?.findByType(vwButton).props.actHandOnPress();
  expect(fldBooRetried).toBe(true);
});

test('shows brand alone once ready', async () => {
  let fldObjTree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjTree = ReactTestRenderer.create(
      React.createElement(vwSplash, {
        fldBooLoading: false,
        fldObjStrings: fldObjStringsEn,
        fldStrError: null,
        actHandOnRetry: () => undefined,
      }),
    );
  });
  const fldObjRoot = fldObjTree?.root;
  expect(fldObjRoot?.findAllByType(vwLogo).length).toBe(1);
  expect(fldObjRoot?.findAllByType(vwLoading).length).toBe(0);
  expect(fldObjRoot?.findAllByType(vwButton).length).toBe(0);
});
