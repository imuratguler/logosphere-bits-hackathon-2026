/**
 * Logosphere BITS — searching modal tests (presentational).
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { vwButton } from '../src/components/vwButton';
import { vwSearchingModal } from '../src/components/vwSearchingModal';
import { vwText } from '../src/components/vwText';

function fncRunTexts(
  fldObjRenderer: ReactTestRenderer.ReactTestRenderer,
): string[] {
  return fldObjRenderer.root
    .findAllByType(vwText)
    .map(fldObjNode => String(fldObjNode.props.children));
}

describe('searching modal', () => {
  it('renders nothing while hidden', () => {
    let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
    ReactTestRenderer.act(() => {
      fldObjRenderer = ReactTestRenderer.create(
        React.createElement(vwSearchingModal, {
          fldBooVisible: false,
          fldStrTitle: 'Searching…',
          fldStrStatus: 'Preparing… 1/2',
          fldStrCancelLabel: 'Cancel',
          actHandOnCancel: () => {},
        }),
      );
    });
    if (fldObjRenderer === undefined) {
      throw new Error('Logosphere BITS: modal was not rendered.');
    }
    expect(fldObjRenderer.toJSON()).toBeNull();
  });

  it('shows the live status with a working cancel', () => {
    const fldHandOnCancel = jest.fn();
    let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
    ReactTestRenderer.act(() => {
      fldObjRenderer = ReactTestRenderer.create(
        React.createElement(vwSearchingModal, {
          fldBooVisible: true,
          fldStrTitle: 'Searching…',
          fldStrStatus: 'pre-read · started',
          fldStrCancelLabel: 'Cancel',
          actHandOnCancel: fldHandOnCancel,
        }),
      );
    });
    if (fldObjRenderer === undefined) {
      throw new Error('Logosphere BITS: modal was not rendered.');
    }
    const fldArrTexts = fncRunTexts(fldObjRenderer);
    expect(fldArrTexts).toContain('Searching…');
    expect(fldArrTexts).toContain('pre-read · started');
    const fldObjCancel = fldObjRenderer.root
      .findAllByType(vwButton)
      .find(fldObjNode => fldObjNode.props.fldStrTestId === 'searching-cancel');
    expect(fldObjCancel?.props.fldStrLabel).toBe('Cancel');
    ReactTestRenderer.act(() => {
      fldObjCancel?.props.actHandOnPress();
    });
    expect(fldHandOnCancel).toHaveBeenCalledTimes(1);
  });
});
