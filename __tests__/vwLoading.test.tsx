/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { vwLoading } from '../src/components/vwLoading';

test('renders without message', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(React.createElement(vwLoading, {}));
  });
});

test('renders with message', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwLoading, { fldStrMessage: 'Loading' }),
    );
  });
});
