/**
 * Logosphere BITS — list row tests.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { vwCheckBox } from '../src/components/vwCheckBox';
import { vwListRow } from '../src/components/vwListRow';
import { vwText } from '../src/components/vwText';

type fldObjRowRenderer = ReturnType<typeof ReactTestRenderer.create>;

async function fncRunRenderRow(
  fldObjProps: React.ComponentProps<typeof vwListRow>,
): Promise<fldObjRowRenderer> {
  let fldObjRenderer: fldObjRowRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwListRow, fldObjProps),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  return fldObjRenderer;
}

function fncRunRowNode(fldObjRenderer: fldObjRowRenderer, fldStrTitle: string) {
  const fldObjTitle = fldObjRenderer.root
    .findAllByType(vwText)
    .find(fldObjNode => fldObjNode.props.children === fldStrTitle);
  if (fldObjTitle === undefined) {
    throw new Error(`Logosphere BITS: "${fldStrTitle}" was not rendered.`);
  }
  // Inner views forward the accessibility label, so the walk
  // climbs to the outermost labeled composite: the row itself.
  let fldObjNode = fldObjTitle.parent;
  let fldObjFound: typeof fldObjNode = null;
  while (fldObjNode !== null) {
    if (
      typeof fldObjNode.type !== 'string' &&
      fldObjNode.props.accessibilityLabel === fldStrTitle
    ) {
      fldObjFound = fldObjNode;
    }
    fldObjNode = fldObjNode.parent;
  }
  if (fldObjFound === null) {
    throw new Error(`Logosphere BITS: "${fldStrTitle}" row was not found.`);
  }
  return fldObjFound;
}

test('renders title, subtitle, checkbox, and chevron', async () => {
  const fldObjRenderer = await fncRunRenderRow({
    fldStrTitle: 'First Editions',
    fldStrSubtitle: 'Members: 2',
    fldBooChecked: true,
    fldBooChevron: true,
    actHandOnPress: () => undefined,
    actHandOnLongPress: () => undefined,
  });

  const fldArrTexts = fldObjRenderer.root
    .findAllByType(vwText)
    .map(fldObjNode => fldObjNode.props.children);
  expect(fldArrTexts).toContain('First Editions');
  expect(fldArrTexts).toContain('Members: 2');
  expect(fldArrTexts).toContain('›');
  expect(fldObjRenderer.root.findByType(vwCheckBox).props.fldBooChecked).toBe(
    true,
  );
  const fldObjRow = fncRunRowNode(fldObjRenderer, 'First Editions');
  expect(typeof fldObjRow.props.onPress).toBe('function');
  expect(typeof fldObjRow.props.onLongPress).toBe('function');

  await ReactTestRenderer.act(async () => {
    fldObjRenderer.unmount();
  });
});

test('omits the checkbox, subtitle, and chevron when not given', async () => {
  const fldObjRenderer = await fncRunRenderRow({
    fldStrTitle: 'Demo Library',
    fldBooChecked: null,
  });

  expect(fldObjRenderer.root.findAllByType(vwCheckBox)).toHaveLength(0);
  const fldArrTexts = fldObjRenderer.root
    .findAllByType(vwText)
    .map(fldObjNode => fldObjNode.props.children);
  expect(fldArrTexts).toEqual(['Demo Library']);
  const fldObjRow = fncRunRowNode(fldObjRenderer, 'Demo Library');
  expect(fldObjRow.props.onPress).toBe(undefined);
  expect(fldObjRow.props.onLongPress).toBe(undefined);

  await ReactTestRenderer.act(async () => {
    fldObjRenderer.unmount();
  });
});

test('applies the tall minimum height when asked', async () => {
  const fldObjRenderer = await fncRunRenderRow({
    fldStrTitle: 'Demo Library',
    fldBooChecked: null,
    fldBooTall: true,
  });

  const fldObjJson = fldObjRenderer.toJSON();
  const fldArrStack = [fldObjJson];
  let fldNumFound = 0;
  while (fldArrStack.length > 0) {
    const fldObjNode = fldArrStack.pop();
    if (fldObjNode === null || typeof fldObjNode !== 'object') {
      continue;
    }
    if (!Array.isArray(fldObjNode)) {
      const fldObjStyle = StyleSheet.flatten(
        (fldObjNode as { props?: { style?: never } }).props?.style,
      );
      if (
        fldObjStyle !== undefined &&
        (fldObjStyle as { minHeight?: unknown }).minHeight === 68
      ) {
        fldNumFound += 1;
      }
      const fldObjChildren = (fldObjNode as { children?: unknown }).children;
      if (Array.isArray(fldObjChildren)) {
        fldArrStack.push(...fldObjChildren);
      }
    }
  }
  expect(fldNumFound).toBe(1);

  await ReactTestRenderer.act(async () => {
    fldObjRenderer.unmount();
  });
});

test('forwards press and long-press to the caller', async () => {
  const fldObjOnPress = jest.fn();
  const fldObjOnLongPress = jest.fn();
  const fldObjRenderer = await fncRunRenderRow({
    fldStrTitle: 'Rare Books',
    fldBooChecked: false,
    actHandOnPress: fldObjOnPress,
    actHandOnLongPress: fldObjOnLongPress,
  });

  const fldObjRow = fncRunRowNode(fldObjRenderer, 'Rare Books');
  await ReactTestRenderer.act(async () => {
    (fldObjRow.props.onPress as () => void)();
    (fldObjRow.props.onLongPress as () => void)();
  });
  expect(fldObjOnPress).toHaveBeenCalledTimes(1);
  expect(fldObjOnLongPress).toHaveBeenCalledTimes(1);

  await ReactTestRenderer.act(async () => {
    fldObjRenderer.unmount();
  });
});
