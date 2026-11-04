/**
 * @format
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { vwButton } from '../src/components/vwButton';
import { fldStrFontFamilyUi } from '../src/utils/utlTheme';

test('renders label', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwButton, {
        fldStrLabel: 'Logosphere BITS',
        actHandOnPress: () => undefined,
      }),
    );
  });
});

test('renders disabled', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwButton, {
        fldStrLabel: 'Logosphere BITS',
        fldBooDisabled: true,
        actHandOnPress: () => undefined,
      }),
    );
  });
});

test('renders loading', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwButton, {
        fldStrLabel: 'Logosphere BITS',
        fldBooLoading: true,
        actHandOnPress: () => undefined,
      }),
    );
  });
});

test('renders secondary variant', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwButton, {
        fldStrLabel: 'Logosphere BITS',
        fldStrVariant: 'secondary',
        actHandOnPress: () => undefined,
      }),
    );
  });
});

test('renders text variant', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwButton, {
        fldStrLabel: 'Logosphere BITS',
        fldStrVariant: 'text',
        actHandOnPress: () => undefined,
      }),
    );
  });
});

test('renders pill variant', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      React.createElement(vwButton, {
        fldStrLabel: 'Logosphere BITS',
        fldStrVariant: 'pill',
        actHandOnPress: () => undefined,
      }),
    );
  });
});

test.each(['primary', 'secondary', 'text', 'outline', 'pill'] as const)(
  'renders the %s label in the bold face',
  async fldStrVariant => {
    let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      fldObjRenderer = ReactTestRenderer.create(
        React.createElement(vwButton, {
          fldStrLabel: 'Logosphere BITS',
          fldStrVariant,
          actHandOnPress: () => undefined,
        }),
      );
    });
    if (fldObjRenderer === undefined) {
      throw new Error('Logosphere BITS: renderer was not created.');
    }
    const fldObjLabel = fldObjRenderer.root
      .findAllByType(Text)
      .find(fldObjNode => fldObjNode.props.children === 'Logosphere BITS');
    const fldObjStyle = StyleSheet.flatten(fldObjLabel?.props.style);
    expect(fldObjStyle?.fontFamily).toBe(fldStrFontFamilyUi);
    expect(fldObjStyle?.fontWeight).toBe('bold');
    await ReactTestRenderer.act(async () => {
      fldObjRenderer?.unmount();
    });
  },
);
