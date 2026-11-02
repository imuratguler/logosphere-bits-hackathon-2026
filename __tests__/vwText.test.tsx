/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { vwText } from '../src/components/vwText';

test.each([
  'header',
  'body',
  'caption',
  'brand',
  'onAccent',
  'muted',
  'rowTitle',
  'rowSubtitle',
] as const)('renders variant %s', async fldStrVariant => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwText, {
        fldStrVariant,
        children: 'Logosphere BITS',
      }),
    );
  });
});
