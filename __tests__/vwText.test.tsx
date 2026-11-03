/**
 * @format
 */

import React from 'react';
import { Text } from 'react-native';
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

test('clamps lines with ellipsis when asked', async () => {
  let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwText, {
        fldStrVariant: 'body',
        fldNumLines: 2,
        fldStrEllipsize: 'tail',
        children: 'A very long line that must clamp on narrow screens.',
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: text was not rendered.');
  }
  const fldObjText = fldObjRenderer.root.findByType(Text);
  expect((fldObjText.props as { numberOfLines: number }).numberOfLines).toBe(2);
  expect((fldObjText.props as { ellipsizeMode: string }).ellipsizeMode).toBe(
    'tail',
  );
});
