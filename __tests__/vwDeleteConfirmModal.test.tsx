/**
 * Logosphere BITS — delete confirmation dialog tests (maintained).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { vwButton } from '../src/components/vwButton';
import { vwDeleteConfirmModal } from '../src/components/vwDeleteConfirmModal';
import { vwText } from '../src/components/vwText';

function fncConvBaseProps() {
  return {
    fldBooVisible: true,
    fldStrTitle: 'Delete',
    fldStrSummary: '1 sets · 2 products · 1 photos · 0 voice notes',
    fldStrBlockedReason: null as string | null,
    fldBooLoading: false,
    fldStrLoading: 'Loading affected content…',
    fldStrLoadErrorTitle: 'Could not load affected content',
    fldStrLoadError: null as string | null,
    fldStrRetry: 'Retry',
    actHandOnRetry: jest.fn(),
    fldStrConfirmLabel: 'Delete',
    fldBooConfirmDisabled: false,
    fldBooWorking: false,
    fldStrErrorTitle: 'Could not delete',
    fldStrError: null as string | null,
    actHandOnConfirm: jest.fn(),
    fldStrCancelLabel: 'Cancel',
    actHandOnCancel: jest.fn(),
  };
}

async function fncRunRenderDelete(
  fldObjProps: ReturnType<typeof fncConvBaseProps>,
) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwDeleteConfirmModal, fldObjProps),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  return fldObjRenderer;
}

describe('delete confirmation dialog', () => {
  it('renders nothing while hidden', async () => {
    const fldObjRenderer = await fncRunRenderDelete({
      ...fncConvBaseProps(),
      fldBooVisible: false,
    });

    expect(fldObjRenderer.toJSON()).toBeNull();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the affected content with an enabled confirm', async () => {
    const fldObjProps = fncConvBaseProps();
    const fldObjRenderer = await fncRunRenderDelete(fldObjProps);

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Delete');
    expect(fldArrTexts).toContain(
      '1 sets · 2 products · 1 photos · 0 voice notes',
    );
    const fldObjConfirm = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Delete');
    expect(fldObjConfirm?.props.fldBooDisabled).toBe(false);

    await ReactTestRenderer.act(async () => {
      fldObjConfirm?.props.actHandOnPress();
    });
    expect(fldObjProps.actHandOnConfirm).toHaveBeenCalledTimes(1);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the blocked reason with a locked confirm', async () => {
    const fldObjRenderer = await fncRunRenderDelete({
      ...fncConvBaseProps(),
      fldStrBlockedReason:
        'Collections with sub-collections cannot be deleted.',
      fldBooConfirmDisabled: true,
    });

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain(
      'Collections with sub-collections cannot be deleted.',
    );
    const fldObjConfirm = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Delete');
    expect(fldObjConfirm?.props.fldBooDisabled).toBe(true);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows preview loading, retry, and delete errors', async () => {
    const fldObjLoading = await fncRunRenderDelete({
      ...fncConvBaseProps(),
      fldBooLoading: true,
    });
    expect(
      fldObjLoading.root
        .findAllByType(vwText)
        .map(fldObjNode => fldObjNode.props.children),
    ).toContain('Loading affected content…');
    ReactTestRenderer.act(() => {
      fldObjLoading.unmount();
    });

    const fldObjProps = fncConvBaseProps();
    const fldObjFailed = await fncRunRenderDelete({
      ...fldObjProps,
      fldStrLoadError: 'preview read failed',
      fldStrError: 'demo_delete_sets failed: conflict',
    });
    const fldArrTexts = fldObjFailed.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Could not load affected content');
    expect(fldArrTexts).toContain('preview read failed');
    expect(fldArrTexts).toContain('Could not delete');
    expect(fldArrTexts).toContain('demo_delete_sets failed: conflict');
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
