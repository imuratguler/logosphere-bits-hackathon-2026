/**
 * Logosphere BITS — brand header tests.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { vwBrandHeader } from '../src/components/vwBrandHeader';
import { vwText } from '../src/components/vwText';
import { fldStrFontFamilyBrand } from '../src/utils/utlTheme';

test('renders the name with a small-caps suffix on one baseline', async () => {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwBrandHeader, {
        fldStrName: 'Logosphere',
        fldStrSuffix: 'BITS',
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  const fldObjBrand = fldObjRenderer.root.findByType(vwText);
  expect(fldObjBrand.props.fldStrVariant).toBe('brand');
  const fldArrChildren = React.Children.toArray(
    fldObjBrand.props.children as React.ReactNode,
  );
  expect(fldArrChildren[0]).toBe('Logosphere');
  const fldObjSuffix = fldObjRenderer.root
    .findAllByType(Text)
    .find(
      fldObjNode =>
        fldObjNode.props.children === 'BITS' &&
        fldObjNode.props.style !== undefined,
    );
  if (fldObjSuffix === undefined) {
    throw new Error('Logosphere BITS: suffix text was not rendered.');
  }
  const fldObjStyle = fldObjSuffix.props.style as {
    fontFamily: string;
    fontSize: number;
    letterSpacing: number;
  };
  expect(fldObjStyle.fontFamily).toBe(fldStrFontFamilyBrand);
  expect(fldObjStyle.fontSize).toBeLessThan(22);
  expect(fldObjStyle.letterSpacing).toBeGreaterThan(0);
  expect('fontWeight' in fldObjStyle).toBe(false);
  await ReactTestRenderer.act(async () => {
    fldObjRenderer?.unmount();
  });
});
