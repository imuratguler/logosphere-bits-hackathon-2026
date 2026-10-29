/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { vwCard } from '../src/components/vwCard';

test('renders children', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwCard, { children: 'Logosphere BITS' }),
    );
  });
});
