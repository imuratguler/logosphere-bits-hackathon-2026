/**
 * @format
 */

import React from 'react';
import { TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { vwTextInput } from '../src/components/vwTextInput';

test('renders value', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwTextInput, {
        fldStrValue: 'Logosphere BITS',
        actHandOnChange: () => undefined,
        fldStrPlaceholder: 'Search',
      }),
    );
  });
});

test('renders error', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwTextInput, {
        fldStrValue: '',
        actHandOnChange: () => undefined,
        fldStrError: 'Required',
      }),
    );
  });
});

test('renders disabled', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwTextInput, {
        fldStrValue: 'Logosphere BITS',
        actHandOnChange: () => undefined,
        fldBooDisabled: true,
      }),
    );
  });
});

test('masks secure entry', async () => {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwTextInput, {
        fldStrValue: 'secret',
        actHandOnChange: () => undefined,
        fldBooSecureEntry: true,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  expect(fldObjRenderer.root.findByType(TextInput).props.secureTextEntry).toBe(
    true,
  );
  ReactTestRenderer.act(() => {
    fldObjRenderer?.unmount();
  });
});
