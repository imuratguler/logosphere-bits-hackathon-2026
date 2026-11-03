/**
 * Logosphere BITS — sale modal tests (presentational only).
 *
 * Renders the real controlled modal with react-test-renderer:
 * scope lines, the optional product tag input, Activate /
 * Deactivate / Cancel, and the save error slot. All state
 * arrives via props; Cancel never writes.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { vwButton } from '../src/components/vwButton';
import { vwSaleModal } from '../src/components/vwSaleModal';
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';

function fncRunRenderSale(
  fldObjOverrides: Record<string, unknown> = {},
): ReturnType<typeof ReactTestRenderer.create> {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwSaleModal, {
        fldBooVisible: true,
        fldStrTitle: 'Sale',
        fldArrScopeLines: [
          'Sale scope: Rare Folios',
          'Recommended total: 90.50 USD',
        ],
        fldBooTagInput: true,
        fldStrTagLabel: 'Tag price (USD)',
        fldStrTagValue: '19.99',
        actHandOnTagChange: () => undefined,
        fldStrTagPlaceholder: '19.99',
        fldStrActivateLabel: 'Activate',
        fldStrDeactivateLabel: 'Deactivate',
        fldStrCancelLabel: 'Cancel',
        fldBooSaving: false,
        fldStrSaveErrorTitle: 'Sale',
        fldStrSaveError: null,
        actHandOnActivate: () => undefined,
        actHandOnDeactivate: () => undefined,
        actHandOnCancel: () => undefined,
        ...fldObjOverrides,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: sale modal was not rendered.');
  }
  return fldObjRenderer;
}

function fncRunButtonByLabel(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrLabel: string,
) {
  return fldObjRenderer.root
    .findAllByType(vwButton)
    .find(fldObjNode => fldObjNode.props.fldStrLabel === fldStrLabel);
}

describe('sale modal', () => {
  it('renders nothing while hidden', () => {
    const fldObjRenderer = fncRunRenderSale({ fldBooVisible: false });

    expect(fldObjRenderer.toJSON()).toBeNull();
    expect(fldObjRenderer.root.findAllByType(vwButton).length).toBe(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('renders the scope lines, the tag input, and the three actions', () => {
    const fldObjRenderer = fncRunRenderSale();

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => String(fldObjNode.props.children));
    expect(fldArrTexts).toContain('Sale');
    expect(fldArrTexts).toContain('Sale scope: Rare Folios');
    expect(fldArrTexts).toContain('Recommended total: 90.50 USD');
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      '19.99',
    );
    expect(fncRunButtonByLabel(fldObjRenderer, 'Activate')).toBeDefined();
    expect(fncRunButtonByLabel(fldObjRenderer, 'Deactivate')).toBeDefined();
    expect(fncRunButtonByLabel(fldObjRenderer, 'Cancel')).toBeDefined();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('hides the tag input for set and collection scopes', () => {
    const fldObjRenderer = fncRunRenderSale({ fldBooTagInput: false });

    expect(fldObjRenderer.root.findAllByType(vwTextInput).length).toBe(0);
    expect(fncRunButtonByLabel(fldObjRenderer, 'Activate')).toBeDefined();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('forwards activate, deactivate, cancel, and typing', () => {
    const fldHandOnActivate = jest.fn();
    const fldHandOnDeactivate = jest.fn();
    const fldHandOnCancel = jest.fn();
    const fldHandOnTagChange = jest.fn();
    const fldObjRenderer = fncRunRenderSale({
      actHandOnActivate: fldHandOnActivate,
      actHandOnDeactivate: fldHandOnDeactivate,
      actHandOnCancel: fldHandOnCancel,
      actHandOnTagChange: fldHandOnTagChange,
    });

    ReactTestRenderer.act(() => {
      fncRunButtonByLabel(fldObjRenderer, 'Activate')?.props.actHandOnPress();
      fncRunButtonByLabel(fldObjRenderer, 'Deactivate')?.props.actHandOnPress();
      fncRunButtonByLabel(fldObjRenderer, 'Cancel')?.props.actHandOnPress();
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('24.99');
    });

    expect(fldHandOnActivate).toHaveBeenCalledTimes(1);
    expect(fldHandOnDeactivate).toHaveBeenCalledTimes(1);
    expect(fldHandOnCancel).toHaveBeenCalledTimes(1);
    expect(fldHandOnTagChange).toHaveBeenCalledWith('24.99');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the tag and save errors while keeping the draft', () => {
    const fldObjRenderer = fncRunRenderSale({
      fldStrTagError: 'Enter a valid tag price.',
      fldStrSaveError: 'The listing changed. Reload and try again.',
    });

    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrError).toBe(
      'Enter a valid tag price.',
    );
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => String(fldObjNode.props.children));
    expect(fldArrTexts).toContain('The listing changed. Reload and try again.');
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      '19.99',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('locks the actions while saving', () => {
    const fldObjRenderer = fncRunRenderSale({ fldBooSaving: true });

    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Activate')?.props.fldBooLoading,
    ).toBe(true);
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Deactivate')?.props.fldBooDisabled,
    ).toBe(true);
    expect(
      fncRunButtonByLabel(fldObjRenderer, 'Cancel')?.props.fldBooDisabled,
    ).toBe(true);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
