/**
 * Logosphere BITS — top bar tests (presentational only).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { vwTopBar } from '../src/components/vwTopBar';

function fncRunRenderBar(
  fldObjOverrides: Record<string, unknown> = {},
): ReturnType<typeof ReactTestRenderer.create> {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwTopBar, {
        fldStrTitle: 'Rare Books',
        fldStrBackLabel: 'Back',
        actHandOnBack: () => undefined,
        fldStrActionLabel: 'Collection settings',
        actHandOnAction: () => undefined,
        ...fldObjOverrides,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: top bar was not rendered.');
  }
  return fldObjRenderer;
}

function fncRunPressableByTestId(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrTestId: string,
) {
  const fldObjNode = fldObjRenderer.root
    .findAllByProps({ testID: fldStrTestId })
    .find(
      fldObjCandidate => typeof fldObjCandidate.props.onPress === 'function',
    );
  if (fldObjNode === undefined) {
    throw new Error(`Logosphere BITS: "${fldStrTestId}" is not pressable.`);
  }
  return fldObjNode;
}

describe('top bar', () => {
  it('renders the title with back and action targets', () => {
    const fldObjRenderer = fncRunRenderBar();

    const fldStrTree = JSON.stringify(fldObjRenderer.toJSON());
    expect(fldStrTree).toContain('Rare Books');
    const fldObjBack = fncRunPressableByTestId(fldObjRenderer, 'topbar-back');
    expect(fldObjBack.props.accessibilityLabel).toBe('Back');
    const fldObjAction = fncRunPressableByTestId(
      fldObjRenderer,
      'topbar-action',
    );
    expect(fldObjAction.props.accessibilityLabel).toBe('Collection settings');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('forwards back and action presses to the caller', () => {
    const fldObjOnBack = jest.fn();
    const fldObjOnAction = jest.fn();
    const fldObjRenderer = fncRunRenderBar({
      actHandOnBack: fldObjOnBack,
      actHandOnAction: fldObjOnAction,
    });

    ReactTestRenderer.act(() => {
      const fldObjBack = fncRunPressableByTestId(fldObjRenderer, 'topbar-back');
      (fldObjBack.props.onPress as () => void)();
      const fldObjAction = fncRunPressableByTestId(
        fldObjRenderer,
        'topbar-action',
      );
      (fldObjAction.props.onPress as () => void)();
    });

    expect(fldObjOnBack).toHaveBeenCalledTimes(1);
    expect(fldObjOnAction).toHaveBeenCalledTimes(1);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('renders a lone back target when no action is wired', () => {
    const fldObjRenderer = fncRunRenderBar({ actHandOnAction: null });

    const fldObjBack = fncRunPressableByTestId(fldObjRenderer, 'topbar-back');
    expect(fldObjBack.props.accessibilityLabel).toBe('Back');
    expect(
      fldObjRenderer.root.findAllByProps({ testID: 'topbar-action' }).length,
    ).toBe(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
