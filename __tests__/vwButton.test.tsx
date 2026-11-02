/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { vwButton } from '../src/components/vwButton';

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
