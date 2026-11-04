/**
 * Logosphere BITS — tri-state sale switch (Komut16).
 *
 * Controlled 3-detent switch: none (left) / some (middle) / all
 * (right). Tap and drag gestures may only commit to an extreme
 * (left clears every flag, right flags everything); the middle
 * detent is data-only and is never committed by the user. The
 * thumb always rests on the data state.
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (vwTriStateSwitch); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import type {
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import {
  colBorderSecondary,
  colSaleAll,
  colSaleNone,
  colSalePartial,
  colTextPrimary,
} from '../utils/utlTheme';

export type fldStrTriState = 'none' | 'some' | 'all';

type vwTriStateSwitchProps = {
  fldStrState: fldStrTriState;
  fldBooDisabled?: boolean;
  fldStrTestId?: string;
  actHandOnCommit: (fldBooActive: boolean) => void;
};

const fldNumTrackWidth = 56;
const fldNumTrackHeight = 30;
const fldNumTrackRadius = 15;
const fldNumThumb = 24;
const fldNumThumbTop = 3;
const fldNumDetentLeft = 3;
const fldNumDetentMiddle = 16;
const fldNumDetentRight = 29;
const fldNumTapSlop = 8;

function fncConvDetent(fldStrState: fldStrTriState): number {
  if (fldStrState === 'some') {
    return fldNumDetentMiddle;
  }
  if (fldStrState === 'all') {
    return fldNumDetentRight;
  }
  return fldNumDetentLeft;
}

/**
 * Gesture target: a tap lands on the tapped half, a drag on the
 * half the pointer ends in. The middle is never a target.
 */
export function fncConvTriStateColor(fldStrState: fldStrTriState): string {
  if (fldStrState === 'some') {
    return colSalePartial;
  }
  if (fldStrState === 'all') {
    return colSaleAll;
  }
  return colSaleNone;
}

export function fncConvGestureSide(
  fldNumGrantX: number,
  fldNumDx: number,
): 'left' | 'right' {
  const fldNumEndX =
    Math.abs(fldNumDx) < fldNumTapSlop ? fldNumGrantX : fldNumGrantX + fldNumDx;
  return fldNumEndX < fldNumTrackWidth / 2 ? 'left' : 'right';
}

export function vwTriStateSwitch({
  fldStrState,
  fldBooDisabled = false,
  fldStrTestId,
  actHandOnCommit,
}: vwTriStateSwitchProps): React.JSX.Element {
  const [fldNumDragLeft, actSetDragLeft] = React.useState<number | null>(null);
  const fldObjGrantX = React.useRef(0);
  const fldObjLive = React.useRef({
    fldBooDisabled,
    fldStrState,
    actHandOnCommit,
  });
  fldObjLive.current = { fldBooDisabled, fldStrState, actHandOnCommit };
  const fldObjPan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !fldObjLive.current.fldBooDisabled,
      onMoveShouldSetPanResponder: () => !fldObjLive.current.fldBooDisabled,
      onPanResponderGrant: (fldObjEvent: GestureResponderEvent) => {
        fldObjGrantX.current = fldObjEvent.nativeEvent.locationX;
        actSetDragLeft(fncConvDetent(fldObjLive.current.fldStrState));
      },
      onPanResponderMove: (
        _fldObjEvent: GestureResponderEvent,
        fldObjGesture: PanResponderGestureState,
      ) => {
        const fldNumLeft =
          fncConvDetent(fldObjLive.current.fldStrState) + fldObjGesture.dx;
        actSetDragLeft(
          Math.min(fldNumDetentRight, Math.max(fldNumDetentLeft, fldNumLeft)),
        );
      },
      onPanResponderRelease: (
        _fldObjEvent: GestureResponderEvent,
        fldObjGesture: PanResponderGestureState,
      ) => {
        const fldStrSide = fncConvGestureSide(
          fldObjGrantX.current,
          fldObjGesture.dx,
        );
        actSetDragLeft(null);
        const fldObjNow = fldObjLive.current;
        if (fldObjNow.fldBooDisabled) {
          return;
        }
        if (fldStrSide === 'left' && fldObjNow.fldStrState === 'none') {
          return;
        }
        if (fldStrSide === 'right' && fldObjNow.fldStrState === 'all') {
          return;
        }
        fldObjNow.actHandOnCommit(fldStrSide === 'right');
      },
      onPanResponderTerminate: () => {
        actSetDragLeft(null);
      },
    }),
  );
  const fldStrColor = fldBooDisabled
    ? colBorderSecondary
    : fncConvTriStateColor(fldStrState);
  return (
    <View
      accessibilityRole="switch"
      accessibilityState={{ disabled: fldBooDisabled }}
      accessibilityValue={{ text: fldStrState }}
      testID={fldStrTestId}
      style={vwTriStateSwitchStyles.fldObjTouch}
      {...fldObjPan.current.panHandlers}
    >
      <View
        style={[
          vwTriStateSwitchStyles.fldObjTrack,
          { backgroundColor: fldStrColor },
        ]}
      >
        <View
          testID={
            fldStrTestId === undefined ? undefined : `${fldStrTestId}-thumb`
          }
          style={[
            vwTriStateSwitchStyles.fldObjThumb,
            { left: fldNumDragLeft ?? fncConvDetent(fldStrState) },
          ]}
        />
      </View>
    </View>
  );
}

const vwTriStateSwitchStyles = StyleSheet.create({
  fldObjTouch: {
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  fldObjTrack: {
    width: fldNumTrackWidth,
    height: fldNumTrackHeight,
    borderRadius: fldNumTrackRadius,
  },
  fldObjThumb: {
    position: 'absolute',
    top: fldNumThumbTop,
    width: fldNumThumb,
    height: fldNumThumb,
    borderRadius: fldNumThumb / 2,
    backgroundColor: colTextPrimary,
  },
});
