/**
 * Logosphere BITS — move destination picker tests (maintained).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { vwButton } from '../src/components/vwButton';
import { vwCheckBox } from '../src/components/vwCheckBox';
import { vwMoveDestinationModal } from '../src/components/vwMoveDestinationModal';
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';
import type { fldObjMoveTargetRow } from '../src/types/typModels';

const fldStrLibrary = '22222222-2222-2222-2222-222222222222';
const fldStrCollection = '33333333-3333-3333-3333-333333333333';
const fldStrSet = '44444444-4444-4444-4444-444444444444';

function fncConvBaseProps() {
  return {
    fldBooVisible: true,
    fldStrTitle: 'Move to…',
    fldArrRows: [] as fldObjMoveTargetRow[],
    fldBooLoading: false,
    fldStrLoading: 'Loading destinations…',
    fldStrErrorTitle: 'Could not load destinations',
    fldStrError: null as string | null,
    fldStrRetry: 'Retry',
    actHandOnRetry: jest.fn(),
    fldStrCurrent: 'Current',
    actHandOnSelectTarget: jest.fn(),
    fldStrNamePlaceholder: 'Name',
    fldStrDraftName: '',
    actHandOnDraftChange: jest.fn(),
    fldStrNewCollection: 'New collection here',
    fldStrNewSet: 'New set here',
    fldStrCreatingKind: null as 'collection' | 'set' | null,
    actHandOnCreateCollection: jest.fn(),
    actHandOnCreateSet: jest.fn(),
    fldStrSaveErrorTitle: 'Could not save',
    fldStrSaveError: null as string | null,
    fldStrMoveLabel: 'Move',
    fldBooMoveDisabled: false,
    fldBooMoving: false,
    fldStrMoveErrorTitle: 'Could not move',
    fldStrMoveError: null as string | null,
    actHandOnConfirmMove: jest.fn(),
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

async function fncRunRenderPicker(
  fldObjProps: ReturnType<typeof fncConvBaseProps>,
) {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwMoveDestinationModal, fldObjProps),
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
    throw new Error('Logosphere BITS: picker row was not rendered.');
  }
  let fldObjRowPressable = fldObjRowText.parent;
  while (
    fldObjRowPressable !== null &&
    typeof fldObjRowPressable.props.onPress !== 'function'
  ) {
    fldObjRowPressable = fldObjRowPressable.parent;
  }
  if (fldObjRowPressable === null) {
    throw new Error('Logosphere BITS: picker row has no pressable.');
  }
  return fldObjRowPressable;
}

describe('move destination picker', () => {
  it('renders nothing while hidden', async () => {
    const fldObjProps = { ...fncConvBaseProps(), fldBooVisible: false };
    const fldObjRenderer = await fncRunRenderPicker(fldObjProps);

    expect(fldObjRenderer.toJSON()).toBeNull();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('renders rows with selection, current, and invalid states', async () => {
    const fldObjProps = fncConvBaseProps();
    fldObjProps.fldArrRows = [
      fncConvRow(fldStrLibrary, 'Demo Library', {
        fldStrKind: 'library',
        fldBooSelected: true,
        fldBooIsCurrent: true,
      }),
      fncConvRow(fldStrCollection, 'Manuscripts', { fldNumDepth: 1 }),
      fncConvRow(fldStrSet, 'First Editions', {
        fldStrKind: 'set',
        fldNumDepth: 2,
        fldBooInvalid: true,
      }),
    ];
    const fldObjRenderer = await fncRunRenderPicker(fldObjProps);

    expect(
      fldObjRenderer.root
        .findAllByType(vwCheckBox)
        .map(fldObjNode => fldObjNode.props.fldBooChecked),
    ).toEqual([true, false]);
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Current');
    expect(
      fncRunRowPressable(fldObjRenderer, 'First Editions').props.disabled,
    ).toBe(true);
    expect(
      fncRunRowPressable(fldObjRenderer, 'Manuscripts').props.disabled,
    ).toBe(false);

    await ReactTestRenderer.act(async () => {
      fncRunRowPressable(fldObjRenderer, 'Manuscripts').props.onPress();
    });
    expect(fldObjProps.actHandOnSelectTarget).toHaveBeenCalledWith(
      fldStrCollection,
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows loading and error states with retry', async () => {
    const fldObjLoadingProps = {
      ...fncConvBaseProps(),
      fldBooLoading: true,
    };
    const fldObjLoading = await fncRunRenderPicker(fldObjLoadingProps);
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
    const fldObjError = await fncRunRenderPicker(fldObjErrorProps);
    const fldArrTexts = fldObjError.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Could not load destinations');
    expect(fldArrTexts).toContain('demo db down');
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

  it('offers inline creation under the selected row', async () => {
    const fldObjProps = fncConvBaseProps();
    fldObjProps.fldArrRows = [
      fncConvRow(fldStrCollection, 'Manuscripts', {
        fldBooSelected: true,
        fldBooCanCreateCollection: true,
        fldBooCanCreateSet: true,
      }),
    ];
    const fldObjRenderer = await fncRunRenderPicker(fldObjProps);

    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjNode => fldObjNode.props.fldStrLabel);
    expect(fldArrLabels).toContain('New collection here');
    expect(fldArrLabels).toContain('New set here');
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findByType(vwTextInput)
        .props.actHandOnChange('Incunabula');
    });
    expect(fldObjProps.actHandOnDraftChange).toHaveBeenCalledWith('Incunabula');
    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root
        .findAllByType(vwButton)
        .find(fldObjNode => fldObjNode.props.fldStrLabel === 'New set here')
        ?.props.actHandOnPress();
    });
    expect(fldObjProps.actHandOnCreateSet).toHaveBeenCalledTimes(1);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('gates the move action and surfaces errors', async () => {
    const fldObjProps = fncConvBaseProps();
    fldObjProps.fldBooMoveDisabled = true;
    fldObjProps.fldStrMoveError = 'demo version conflict';
    const fldObjRenderer = await fncRunRenderPicker(fldObjProps);

    const fldObjMove = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Move');
    expect(fldObjMove?.props.fldBooDisabled).toBe(true);
    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Could not move');
    expect(fldArrTexts).toContain('demo version conflict');
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
