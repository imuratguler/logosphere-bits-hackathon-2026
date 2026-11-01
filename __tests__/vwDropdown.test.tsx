/**
 * Logosphere BITS — dropdown select tests (presentational only).
 */

import React from 'react';
import { Modal } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import { vwButton } from '../src/components/vwButton';
import { vwDropdown } from '../src/components/vwDropdown';
import { vwListRow } from '../src/components/vwListRow';

const fldArrOptions = [
  { fldStrId: 'id-a', fldStrLabel: 'Public Library' },
  { fldStrId: 'id-b', fldStrLabel: 'High School' },
];

function fncRunRenderDropdown(
  fldObjOverrides: Record<string, unknown> = {},
): ReturnType<typeof ReactTestRenderer.create> {
  let fldObjRenderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  ReactTestRenderer.act(() => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwDropdown, {
        fldArrOptions,
        fldStrPickedId: 'id-a',
        fldStrPlaceholder: 'Select a persona',
        fldStrTitle: 'Choose a demo persona',
        fldStrCancelLabel: 'Cancel',
        actHandOnPick: () => undefined,
        ...fldObjOverrides,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: dropdown was not rendered.');
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

function fncRunOpenSheet(
  fldObjRenderer: ReturnType<typeof ReactTestRenderer.create>,
): void {
  const fldObjField = fncRunPressableByTestId(fldObjRenderer, 'dropdown-field');
  ReactTestRenderer.act(() => {
    (fldObjField.props.onPress as () => void)();
  });
}

describe('dropdown select', () => {
  it('shows the picked label in the closed field', () => {
    const fldObjRenderer = fncRunRenderDropdown();

    expect(JSON.stringify(fldObjRenderer.toJSON())).toContain('Public Library');
    expect(fldObjRenderer.root.findAllByType(Modal).length).toBe(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('shows the placeholder when nothing is picked', () => {
    const fldObjRenderer = fncRunRenderDropdown({ fldStrPickedId: null });

    expect(JSON.stringify(fldObjRenderer.toJSON())).toContain(
      'Select a persona',
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('lists every option with the picked row checked', () => {
    const fldObjRenderer = fncRunRenderDropdown();
    fncRunOpenSheet(fldObjRenderer);

    const fldArrRows = fldObjRenderer.root.findAllByType(vwListRow);
    expect(fldArrRows.map(fldObjRow => fldObjRow.props.fldStrTitle)).toEqual([
      'Public Library',
      'High School',
    ]);
    expect(fldArrRows.map(fldObjRow => fldObjRow.props.fldBooChecked)).toEqual([
      true,
      false,
    ]);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('picks an option and closes the sheet', () => {
    const fldObjOnPick = jest.fn();
    const fldObjRenderer = fncRunRenderDropdown({
      actHandOnPick: fldObjOnPick,
    });
    fncRunOpenSheet(fldObjRenderer);

    const fldObjRow = fldObjRenderer.root
      .findAllByType(vwListRow)
      .find(fldObjNode => fldObjNode.props.fldStrTitle === 'High School');
    if (fldObjRow === undefined) {
      throw new Error('Logosphere BITS: option row was not rendered.');
    }
    ReactTestRenderer.act(() => {
      (fldObjRow.props.actHandOnPress as () => void)();
    });

    expect(fldObjOnPick).toHaveBeenCalledWith('id-b');
    expect(fldObjRenderer.root.findAllByType(Modal).length).toBe(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('closes the sheet on cancel without picking', () => {
    const fldObjOnPick = jest.fn();
    const fldObjRenderer = fncRunRenderDropdown({
      actHandOnPick: fldObjOnPick,
    });
    fncRunOpenSheet(fldObjRenderer);

    const fldObjCancel = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Cancel');
    if (fldObjCancel === undefined) {
      throw new Error('Logosphere BITS: cancel was not rendered.');
    }
    ReactTestRenderer.act(() => {
      (fldObjCancel.props.actHandOnPress as () => void)();
    });

    expect(fldObjOnPick).not.toHaveBeenCalled();
    expect(fldObjRenderer.root.findAllByType(Modal).length).toBe(0);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('marks the field disabled while disabled', () => {
    const fldObjRenderer = fncRunRenderDropdown({ fldBooDisabled: true });

    const fldObjField = fncRunPressableByTestId(
      fldObjRenderer,
      'dropdown-field',
    );
    expect(fldObjField.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
