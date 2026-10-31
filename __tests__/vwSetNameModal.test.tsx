/**
 * Logosphere BITS — set name modal tests (presentational only).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { vwButton } from '../src/components/vwButton';
import { vwSetNameModal } from '../src/components/vwSetNameModal';
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';

function fncRunRenderModal(
  fldObjOverrides: Record<string, unknown> = {},
): ReturnType<typeof ReactTestRenderer.create> {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwSetNameModal, {
        fldBooVisible: true,
        fldStrTitle: 'New set',
        fldStrValue: '',
        actHandOnChange: () => undefined,
        fldStrPlaceholder: 'Set name',
        fldStrSaveLabel: 'Save set',
        fldStrCancelLabel: 'Cancel',
        fldBooSaving: false,
        fldStrSaveErrorTitle: 'Could not save the set',
        fldStrSaveError: null,
        actHandOnSave: () => undefined,
        actHandOnCancel: () => undefined,
        ...fldObjOverrides,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: modal was not rendered.');
  }
  return fldObjRenderer;
}

describe('set name modal', () => {
  it('renders nothing while hidden', () => {
    const fldObjRenderer = fncRunRenderModal({ fldBooVisible: false });

    expect(fldObjRenderer.toJSON()).toBeNull();
    expect(fldObjRenderer.root.findAllByType(vwTextInput).length).toBe(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('renders the title, input, and actions while visible', () => {
    const fldObjRenderer = fncRunRenderModal();

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('New set');
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      '',
    );
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain('Save set');
    expect(fldArrLabels).toContain('Cancel');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('forwards typing, save, and cancel to the caller', () => {
    const fldObjOnChange = jest.fn();
    const fldObjOnSave = jest.fn();
    const fldObjOnCancel = jest.fn();
    const fldObjRenderer = fncRunRenderModal({
      actHandOnChange: fldObjOnChange,
      actHandOnSave: fldObjOnSave,
      actHandOnCancel: fldObjOnCancel,
    });

    ReactTestRenderer.act(() => {
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('Signed Copies');
    });
    expect(fldObjOnChange).toHaveBeenCalledWith('Signed Copies');

    const fldArrButtons = fldObjRenderer.root.findAllByType(vwButton);
    const fldObjSave = fldArrButtons.find(
      fldObjNode => fldObjNode.props.fldStrLabel === 'Save set',
    );
    const fldObjCancel = fldArrButtons.find(
      fldObjNode => fldObjNode.props.fldStrLabel === 'Cancel',
    );
    if (fldObjSave === undefined || fldObjCancel === undefined) {
      throw new Error('Logosphere BITS: modal actions were not rendered.');
    }
    ReactTestRenderer.act(() => {
      fldObjSave.props.actHandOnPress();
      fldObjCancel.props.actHandOnPress();
    });
    expect(fldObjOnSave).toHaveBeenCalledTimes(1);
    expect(fldObjOnCancel).toHaveBeenCalledTimes(1);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the save error while keeping the value', () => {
    const fldObjRenderer = fncRunRenderModal({
      fldStrValue: 'Signed Copies',
      fldStrSaveError: 'demo session expired',
    });

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Could not save the set');
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      'Signed Copies',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('disables cancel while saving', () => {
    const fldObjRenderer = fncRunRenderModal({ fldBooSaving: true });

    const fldArrButtons = fldObjRenderer.root.findAllByType(vwButton);
    const fldObjSave = fldArrButtons.find(
      fldObjNode => fldObjNode.props.fldStrLabel === 'Save set',
    );
    const fldObjCancel = fldArrButtons.find(
      fldObjNode => fldObjNode.props.fldStrLabel === 'Cancel',
    );
    if (fldObjSave === undefined || fldObjCancel === undefined) {
      throw new Error('Logosphere BITS: modal actions were not rendered.');
    }
    expect(fldObjSave.props.fldBooLoading).toBe(true);
    expect(fldObjCancel.props.fldBooDisabled).toBe(true);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
