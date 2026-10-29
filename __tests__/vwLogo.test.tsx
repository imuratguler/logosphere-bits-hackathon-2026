/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { vwLogo } from '../src/components/vwLogo';

test('renders default width', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(React.createElement(vwLogo, {}));
  });
});

test('renders custom width', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(React.createElement(vwLogo, { fldNumWidth: 96 }));
  });
});
