/**
 * Logosphere BITS — tri-state sale switch tests.
 *
 * The switch rests on the data state (none/some/all); tap and drag
 * gestures may only commit to an extreme, never to the middle.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {
  fncConvGestureSide,
  fncConvTriStateColor,
  vwTriStateSwitch,
} from '../src/components/vwTriStateSwitch';
import type { fldStrTriState } from '../src/components/vwTriStateSwitch';
import {
  colBorderSecondary,
  colSaleAll,
  colSaleNone,
  colSalePartial,
} from '../src/utils/utlTheme';

async function fncRunRenderSwitch(
  fldStrState: fldStrTriState,
  actHandOnCommit: (fldBooActive: boolean) => void,
  fldBooDisabled = false,
) {
  let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwTriStateSwitch, {
        fldStrState,
        fldBooDisabled,
        fldStrTestId: 't',
        actHandOnCommit,
      }),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: renderer was not created.');
  }
  return fldObjRenderer;
}

function fncConvTouchEvent(
  fldNumLocationX: number,
  fldNumCurrentX: number,
  fldNumPreviousX: number,
) {
  return {
    nativeEvent: { locationX: fldNumLocationX },
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: 100,
      touchBank: [
        {
          touchActive: true,
          startPageX: 100,
          startPageY: 100,
          previousPageX: fldNumPreviousX,
          previousPageY: 100,
          currentPageX: fldNumCurrentX,
          currentPageY: 100,
          currentTimeStamp: 100,
        },
      ],
    },
  };
}

function fncRunGrant(
  fldObjRenderer: ReactTestRenderer.ReactTestRenderer,
  fldNumX: number,
) {
  const fldObjNode = fldObjRenderer.root.findByProps({ testID: 't' });
  ReactTestRenderer.act(() => {
    fldObjNode.props.onResponderGrant(fncConvTouchEvent(fldNumX, 100, 100));
  });
}

function fncRunMove(
  fldObjRenderer: ReactTestRenderer.ReactTestRenderer,
  fldNumDx: number,
) {
  const fldObjNode = fldObjRenderer.root.findByProps({ testID: 't' });
  ReactTestRenderer.act(() => {
    fldObjNode.props.onResponderMove(fncConvTouchEvent(0, 100 + fldNumDx, 100));
  });
}

function fncRunRelease(fldObjRenderer: ReactTestRenderer.ReactTestRenderer) {
  const fldObjNode = fldObjRenderer.root.findByProps({ testID: 't' });
  ReactTestRenderer.act(() => {
    fldObjNode.props.onResponderRelease({});
  });
}

function fncRunThumbLeft(
  fldObjRenderer: ReactTestRenderer.ReactTestRenderer,
): number | undefined {
  const fldObjThumb = fldObjRenderer.root.findByProps({ testID: 't-thumb' });
  return StyleSheet.flatten(fldObjThumb.props.style)?.left as
    | number
    | undefined;
}

function fncRunTrackColor(
  fldObjRenderer: ReactTestRenderer.ReactTestRenderer,
): unknown {
  const fldObjThumb = fldObjRenderer.root.findByProps({ testID: 't-thumb' });
  const fldObjTrack = fldObjThumb.parent;
  if (fldObjTrack === null) {
    throw new Error('Logosphere BITS: track was not rendered.');
  }
  return StyleSheet.flatten(fldObjTrack.props.style)?.backgroundColor;
}

async function fncRunUnmount(
  fldObjRenderer: ReactTestRenderer.ReactTestRenderer,
) {
  await ReactTestRenderer.act(async () => {
    fldObjRenderer.unmount();
  });
}

test.each([
  ['none', 3, colSaleNone],
  ['some', 16, colSalePartial],
  ['all', 29, colSaleAll],
] as const)(
  'rests the thumb on the %s detent',
  async (fldStrState, fldNumLeft, fldStrColor) => {
    const fldObjRenderer = await fncRunRenderSwitch(fldStrState, () => {});
    expect(fncRunThumbLeft(fldObjRenderer)).toBe(fldNumLeft);
    expect(fncRunTrackColor(fldObjRenderer)).toBe(fldStrColor);
    expect(
      fldObjRenderer.root.findByProps({ testID: 't' }).props.accessibilityValue,
    ).toEqual({ text: fldStrState });
    await fncRunUnmount(fldObjRenderer);
  },
);

test('greys the track when disabled and ignores gestures', async () => {
  const fldObjCommit = jest.fn();
  const fldObjRenderer = await fncRunRenderSwitch('some', fldObjCommit, true);
  expect(fncRunTrackColor(fldObjRenderer)).toBe(colBorderSecondary);
  const fldObjNode = fldObjRenderer.root.findByProps({ testID: 't' });
  expect(fldObjNode.props.onStartShouldSetResponder({}, {})).toBe(false);
  fncRunGrant(fldObjRenderer, 46);
  fncRunRelease(fldObjRenderer);
  expect(fldObjCommit).not.toHaveBeenCalled();
  await fncRunUnmount(fldObjRenderer);
});

test('commits left on a left-half tap', async () => {
  const fldObjCommit = jest.fn();
  const fldObjRenderer = await fncRunRenderSwitch('some', fldObjCommit);
  fncRunGrant(fldObjRenderer, 10);
  fncRunRelease(fldObjRenderer);
  expect(fldObjCommit).toHaveBeenCalledWith(false);
  await fncRunUnmount(fldObjRenderer);
});

test('commits right on a right-half tap', async () => {
  const fldObjCommit = jest.fn();
  const fldObjRenderer = await fncRunRenderSwitch('some', fldObjCommit);
  fncRunGrant(fldObjRenderer, 46);
  fncRunRelease(fldObjRenderer);
  expect(fldObjCommit).toHaveBeenCalledWith(true);
  await fncRunUnmount(fldObjRenderer);
});

test('commits right on a midpoint tap instead of the middle', async () => {
  const fldObjCommit = jest.fn();
  const fldObjRenderer = await fncRunRenderSwitch('some', fldObjCommit);
  fncRunGrant(fldObjRenderer, 28);
  fncRunRelease(fldObjRenderer);
  expect(fldObjCommit).toHaveBeenCalledWith(true);
  await fncRunUnmount(fldObjRenderer);
});

test('commits right on a rightward drag', async () => {
  const fldObjCommit = jest.fn();
  const fldObjRenderer = await fncRunRenderSwitch('none', fldObjCommit);
  fncRunGrant(fldObjRenderer, 10);
  fncRunMove(fldObjRenderer, 20);
  expect(fncRunThumbLeft(fldObjRenderer)).toBe(23);
  fncRunRelease(fldObjRenderer);
  expect(fldObjCommit).toHaveBeenCalledWith(true);
  expect(fncRunThumbLeft(fldObjRenderer)).toBe(3);
  await fncRunUnmount(fldObjRenderer);
});

test('commits left on a leftward drag', async () => {
  const fldObjCommit = jest.fn();
  const fldObjRenderer = await fncRunRenderSwitch('all', fldObjCommit);
  fncRunGrant(fldObjRenderer, 46);
  fncRunMove(fldObjRenderer, -20);
  expect(fncRunThumbLeft(fldObjRenderer)).toBe(9);
  fncRunRelease(fldObjRenderer);
  expect(fldObjCommit).toHaveBeenCalledWith(false);
  expect(fncRunThumbLeft(fldObjRenderer)).toBe(29);
  await fncRunUnmount(fldObjRenderer);
});

test('stays put when the gesture targets the current extreme', async () => {
  const fldObjCommit = jest.fn();
  const fldObjLeft = await fncRunRenderSwitch('none', fldObjCommit);
  fncRunGrant(fldObjLeft, 10);
  fncRunRelease(fldObjLeft);
  expect(fldObjCommit).not.toHaveBeenCalled();
  await fncRunUnmount(fldObjLeft);
  const fldObjRight = await fncRunRenderSwitch('all', fldObjCommit);
  fncRunGrant(fldObjRight, 46);
  fncRunRelease(fldObjRight);
  expect(fldObjCommit).not.toHaveBeenCalled();
  await fncRunUnmount(fldObjRight);
});

test('maps colors and gesture targets', () => {
  expect(fncConvTriStateColor('none')).toBe(colSaleNone);
  expect(fncConvTriStateColor('some')).toBe(colSalePartial);
  expect(fncConvTriStateColor('all')).toBe(colSaleAll);
  expect(fncConvGestureSide(10, 0)).toBe('left');
  expect(fncConvGestureSide(46, 0)).toBe('right');
  expect(fncConvGestureSide(10, 30)).toBe('right');
  expect(fncConvGestureSide(46, -30)).toBe('left');
  expect(fncConvGestureSide(10, -30)).toBe('left');
});

test('renders inside a view tree', async () => {
  const fldObjRenderer = await fncRunRenderSwitch('none', () => {});
  expect(fldObjRenderer.root.findAllByType(View).length).toBeGreaterThan(0);
  await fncRunUnmount(fldObjRenderer);
});
