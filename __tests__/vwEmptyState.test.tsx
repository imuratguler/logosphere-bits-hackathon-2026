/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { vwEmptyState } from '../src/components/vwEmptyState';

test('renders title only', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwEmptyState, { fldStrTitle: 'Empty' }),
    );
  });
});

test('renders title and message', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwEmptyState, {
        fldStrTitle: 'Empty',
        fldStrMessage: 'Nothing here yet',
      }),
    );
  });
});
