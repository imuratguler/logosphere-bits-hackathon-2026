/**
 * @format
 */

import React from 'react';
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
