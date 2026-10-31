/**
 * Logosphere BITS — checkbox mark tests (maintained).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { vwCheckBox } from '../src/components/vwCheckBox';
import { vwText } from '../src/components/vwText';

test('renders an empty box when unchecked', async () => {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwCheckBox, {
        fldBooChecked: false,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  expect(fldObjRenderer.root.findAllByType(vwText)).toHaveLength(0);
  ReactTestRenderer.act(() => {
    fldObjRenderer?.unmount();
  });
});

test('renders the check mark when checked', async () => {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwCheckBox, {
        fldBooChecked: true,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  const fldArrMarks = fldObjRenderer.root.findAllByType(vwText);
  expect(fldArrMarks).toHaveLength(1);
  expect(fldArrMarks[0]?.props.children).toBe('✓');
  ReactTestRenderer.act(() => {
    fldObjRenderer?.unmount();
  });
});
