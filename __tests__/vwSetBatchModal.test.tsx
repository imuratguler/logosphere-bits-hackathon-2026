/**
 * Logosphere BITS — set batch dialog tests (maintained).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { vwButton } from '../src/components/vwButton';
import { vwSetBatchModal } from '../src/components/vwSetBatchModal';
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';

function fncConvBaseProps() {
  return {
    fldBooVisible: true,
    fldStrTitle: 'Merge into new set',
    fldStrSummary: '2 sets · 5 items',
    fldStrInto: 'Into',
    fldStrIntoName: 'Combined',
    fldBooNameVisible: true,
    fldStrNamePlaceholder: 'Set name',
    fldStrDraftName: '',
    actHandOnDraftChange: jest.fn(),
    fldBooLoading: false,
    fldStrLoading: 'Loading scope…',
    fldStrLoadErrorTitle: 'Could not load the scope',
    fldStrLoadError: null as string | null,
    fldStrRetry: 'Retry',
    actHandOnRetry: jest.fn(),
    fldStrConfirmLabel: 'Merge',
    fldBooConfirmDisabled: true,
    fldBooWorking: false,
    fldStrErrorTitle: 'Operation failed',
    fldStrError: null as string | null,
    actHandOnConfirm: jest.fn(),
    fldStrCancelLabel: 'Cancel',
    actHandOnCancel: jest.fn(),
  };
}

async function fncRunRenderBatch(
  fldObjProps: ReturnType<typeof fncConvBaseProps>,
) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwSetBatchModal, fldObjProps),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  return fldObjRenderer;
}

function fncRunTexts(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
) {
  return fldObjRenderer.root
    .findAllByType(vwText)
    .map(fldObjNode => fldObjNode.props.children);
}

describe('set batch dialog', () => {
  it('renders nothing while hidden', async () => {
    const fldObjRenderer = await fncRunRenderBatch({
      ...fncConvBaseProps(),
      fldBooVisible: false,
    });

    expect(fldObjRenderer.toJSON()).toBeNull();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the summary with the name field and the into line', async () => {
    const fldObjRenderer = await fncRunRenderBatch(fncConvBaseProps());

    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Merge into new set');
    expect(fldArrTexts).toContain('2 sets · 5 items');
    expect(fldArrTexts).toContain('Into: Combined');
    expect(fldObjRenderer.root.findAllByType(vwTextInput)).toHaveLength(1);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('hides the name field for extract confirmations', async () => {
    const fldObjRenderer = await fncRunRenderBatch({
      ...fncConvBaseProps(),
      fldStrTitle: 'Extract items',
      fldStrSummary: '3 products will leave 2 sets',
      fldStrIntoName: '',
      fldBooNameVisible: false,
      fldStrConfirmLabel: 'Extract',
      fldBooConfirmDisabled: false,
    });

    expect(fncRunTexts(fldObjRenderer)).toContain(
      '3 products will leave 2 sets',
    );
    expect(fldObjRenderer.root.findAllByType(vwTextInput)).toHaveLength(0);
    const fldObjConfirm = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Extract');
    expect(fldObjConfirm?.props.fldBooDisabled).toBe(false);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('locks both buttons while working', async () => {
    const fldObjRenderer = await fncRunRenderBatch({
      ...fncConvBaseProps(),
      fldBooConfirmDisabled: false,
      fldBooWorking: true,
    });

    const fldArrButtons = fldObjRenderer.root.findAllByType(vwButton);
    expect(
      fldArrButtons.find(fldObjNode => fldObjNode.props.fldStrLabel === 'Merge')
        ?.props.fldBooDisabled,
    ).toBe(true);
    expect(
      fldArrButtons.find(
        fldObjNode => fldObjNode.props.fldStrLabel === 'Cancel',
      )?.props.fldBooDisabled,
    ).toBe(true);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows scope loading, retry, and operation errors', async () => {
    const fldObjLoading = await fncRunRenderBatch({
      ...fncConvBaseProps(),
      fldBooLoading: true,
    });
    expect(fncRunTexts(fldObjLoading)).toContain('Loading scope…');
    ReactTestRenderer.act(() => {
      fldObjLoading.unmount();
    });

    const fldObjProps = fncConvBaseProps();
    const fldObjFailed = await fncRunRenderBatch({
      ...fldObjProps,
      fldStrLoadError: 'scope read failed',
      fldStrError: 'demo_convert_leaf_products_to_sets failed: conflict',
    });
    const fldArrTexts = fncRunTexts(fldObjFailed);
    expect(fldArrTexts).toContain('Could not load the scope');
    expect(fldArrTexts).toContain('scope read failed');
    expect(fldArrTexts).toContain('Operation failed');
    expect(fldArrTexts).toContain(
      'demo_convert_leaf_products_to_sets failed: conflict',
    );
    await ReactTestRenderer.act(async () => {
      fldObjFailed.root
        .findAllByType(vwButton)
        .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Retry')
        ?.props.actHandOnPress();
    });
    expect(fldObjProps.actHandOnRetry).toHaveBeenCalledTimes(1);

    ReactTestRenderer.act(() => {
      fldObjFailed.unmount();
    });
  });
});
