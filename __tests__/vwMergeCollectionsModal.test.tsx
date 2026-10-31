/**
 * Logosphere BITS — collection merge dialog tests (maintained).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { vwButton } from '../src/components/vwButton';
import { vwCheckBox } from '../src/components/vwCheckBox';
import { vwMergeCollectionsModal } from '../src/components/vwMergeCollectionsModal';
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';
import type { fldObjMoveTargetRow } from '../src/types/typModels';

const fldStrLibrary = '22222222-2222-2222-2222-222222222222';
const fldStrTarget = '33333333-3333-3333-3333-333333333333';
const fldStrSource = '44444444-4444-4444-4444-444444444444';

function fncConvBaseProps() {
  return {
    fldBooVisible: true,
    fldStrTitle: 'Merge collections',
    fldStrSources: 'Collections to merge',
    fldNumSources: 2,
    fldStrInto: 'Into',
    fldStrIntoName: 'Manuscripts',
    fldStrNewCollection: 'New collection',
    fldStrNamePlaceholder: 'Name',
    fldStrDraftName: '',
    actHandOnDraftChange: jest.fn(),
    fldStrExisting: 'Merge into existing',
    fldArrRows: [] as fldObjMoveTargetRow[],
    fldBooLoading: false,
    fldStrLoading: 'Loading destinations…',
    fldStrErrorTitle: 'Could not load destinations',
    fldStrError: null as string | null,
    fldStrRetry: 'Retry',
    actHandOnRetry: jest.fn(),
    actHandOnSelectTarget: jest.fn(),
    fldStrMergeLabel: 'Merge',
    fldBooMergeDisabled: false,
    fldBooMerging: false,
    fldStrMergeErrorTitle: 'Could not merge',
    fldStrMergeError: null as string | null,
    actHandOnConfirmMerge: jest.fn(),
    fldStrCancelLabel: 'Cancel',
    actHandOnCancel: jest.fn(),
  };
}

function fncConvRow(
  fldStrId: string,
  fldStrName: string,
  fldObjFlags: Partial<fldObjMoveTargetRow> = {},
): fldObjMoveTargetRow {
  return {
    fldStrId,
    fldStrName,
    fldStrKind: 'collection',
    fldNumDepth: 0,
    fldBooSelected: false,
    fldBooInvalid: false,
    fldBooIsCurrent: false,
    fldBooCanCreateCollection: false,
    fldBooCanCreateSet: false,
    ...fldObjFlags,
  };
}

async function fncRunRenderMerge(
  fldObjProps: ReturnType<typeof fncConvBaseProps>,
) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwMergeCollectionsModal, fldObjProps),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  return fldObjRenderer;
}

function fncRunRowPressable(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
  fldStrName: string,
) {
  const fldObjRowText = fldObjRenderer.root
    .findAllByType(vwText)
    .find(fldObjNode => fldObjNode.props.children === fldStrName);
  if (fldObjRowText === undefined) {
    throw new Error('Logosphere BITS: merge row was not rendered.');
  }
  let fldObjRowPressable = fldObjRowText.parent;
  while (
    fldObjRowPressable !== null &&
    typeof fldObjRowPressable.props.onPress !== 'function'
  ) {
    fldObjRowPressable = fldObjRowPressable.parent;
  }
  if (fldObjRowPressable === null) {
    throw new Error('Logosphere BITS: merge row has no pressable.');
  }
  return fldObjRowPressable;
}

describe('collection merge dialog', () => {
  it('renders nothing while hidden', async () => {
    const fldObjProps = { ...fncConvBaseProps(), fldBooVisible: false };
    const fldObjRenderer = await fncRunRenderMerge(fldObjProps);

    expect(fldObjRenderer.toJSON()).toBeNull();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the count, into line, and collection rows only', async () => {
    const fldObjProps = fncConvBaseProps();
    fldObjProps.fldArrRows = [
      fncConvRow(fldStrLibrary, 'Demo Library', {
        fldStrKind: 'library',
      }),
      fncConvRow(fldStrTarget, 'Manuscripts', { fldBooSelected: true }),
      fncConvRow(fldStrSource, 'Incunabula', { fldBooInvalid: true }),
    ];
    const fldObjRenderer = await fncRunRenderMerge(fldObjProps);

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Collections to merge: 2');
    expect(fldArrTexts).toContain('Into: Manuscripts');
    expect(fldArrTexts).toContain('Manuscripts');
    expect(fldArrTexts).toContain('Incunabula');
    expect(fldArrTexts).not.toContain('Demo Library');
    expect(
      fldObjRenderer.root
        .findAllByType(vwCheckBox)
        .map(fldObjNode => fldObjNode.props.fldBooChecked),
    ).toEqual([true]);
    expect(
      fncRunRowPressable(fldObjRenderer, 'Incunabula').props.disabled,
    ).toBe(true);

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('Combined');
    });
    expect(fldObjProps.actHandOnDraftChange).toHaveBeenCalledWith('Combined');

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows loading and error states with retry', async () => {
    const fldObjLoadingProps = {
      ...fncConvBaseProps(),
      fldBooLoading: true,
    };
    const fldObjLoading = await fncRunRenderMerge(fldObjLoadingProps);
    expect(
      fldObjLoading.root
        .findAllByType(vwText)
        .map(fldObjNode => fldObjNode.props.children),
    ).toContain('Loading destinations…');
    ReactTestRenderer.act(() => {
      fldObjLoading.unmount();
    });

    const fldObjErrorProps = {
      ...fncConvBaseProps(),
      fldStrError: 'demo db down',
    };
    const fldObjError = await fncRunRenderMerge(fldObjErrorProps);
    await ReactTestRenderer.act(async () => {
      fldObjError.root
        .findAllByType(vwButton)
        .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Retry')
        ?.props.actHandOnPress();
    });
    expect(fldObjErrorProps.actHandOnRetry).toHaveBeenCalledTimes(1);
    ReactTestRenderer.act(() => {
      fldObjError.unmount();
    });
  });

  it('gates the merge action and surfaces errors', async () => {
    const fldObjProps = fncConvBaseProps();
    fldObjProps.fldBooMergeDisabled = true;
    fldObjProps.fldStrMergeError = 'demo merge target is not empty';
    const fldObjRenderer = await fncRunRenderMerge(fldObjProps);

    const fldObjMerge = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Merge');
    expect(fldObjMerge?.props.fldBooDisabled).toBe(true);
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Could not merge');
    expect(fldArrTexts).toContain('demo merge target is not empty');
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findAllByType(vwButton)
        .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Cancel')
        ?.props.actHandOnPress();
    });
    expect(fldObjProps.actHandOnCancel).toHaveBeenCalledTimes(1);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
