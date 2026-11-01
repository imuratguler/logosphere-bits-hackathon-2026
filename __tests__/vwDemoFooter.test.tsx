/**
 * Logosphere BITS — demo footer tests.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { vwDemoFooter } from '../src/components/vwDemoFooter';
import { vwText } from '../src/components/vwText';

test('renders the footer copy as centered caption text', async () => {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwDemoFooter, {
        fldStrText: 'Demo Version © 2026',
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  const fldObjText = fldObjRenderer.root.findByType(vwText);
  expect(fldObjText.props.fldStrVariant).toBe('caption');
  expect(fldObjText.props.children).toBe('Demo Version © 2026');
  await ReactTestRenderer.act(async () => {
    fldObjRenderer?.unmount();
  });
});
