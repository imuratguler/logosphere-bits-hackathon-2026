/**
 * Logosphere BITS — capture draft state (reducer + hook).
 *
 * The camera screen owns one draft: entry mode plus target
 * library/collection (fixed at open), and an ordered image
 * list. Adds stamp a fresh UUID and append order; removes
 * keep every surviving identity untouched while resequencing
 * display order; moves clamp into range; rotates step
 * +90 degrees; normalization writes back its output path.
 * Each image holds at most one voice note (F6): setting a
 * note replaces the old one, clearing writes null, and the
 * clear action empties the whole draft at once.
 * The pure reducer is exported for hermetic tests.
 * Naming follows D6 (fld / act / fnc roots).
 */

import React from 'react';

import type {
  fldObjDraftImage,
  fldObjDraftState,
  fldObjDraftTarget,
  fldObjVoiceNote,
  fldStrCaptureMode,
} from '../types/typModels';
import { fncMakeUuid } from '../utils/utlUuid';

export type fldObjDraftAction =
  | { fldStrType: 'add'; fldArrEntries: fldObjDraftImage[] }
  | { fldStrType: 'remove'; fldStrId: string }
  | { fldStrType: 'move'; fldStrId: string; fldNumToIndex: number }
  | { fldStrType: 'rotate'; fldStrId: string }
  | {
      fldStrType: 'normalized';
      fldStrId: string;
      fldStrPath: string | null;
    }
  | {
      fldStrType: 'voiceNote';
      fldStrId: string;
      fldObjNote: fldObjVoiceNote | null;
    }
  | { fldStrType: 'clear' };

function fncConvResequenced(
  fldArrImages: fldObjDraftImage[],
): fldObjDraftImage[] {
  return fldArrImages.map((fldObjImage, fldNumIndex) => ({
    ...fldObjImage,
    fldNumSortOrder: fldNumIndex,
  }));
}

export function fncMakeInitialDraftState(
  fldStrMode: fldStrCaptureMode,
  fldObjTarget: fldObjDraftTarget,
): fldObjDraftState {
  return { fldStrMode, fldObjTarget, fldArrImages: [] };
}

export function fncDraftReducer(
  fldObjState: fldObjDraftState,
  fldObjAction: fldObjDraftAction,
): fldObjDraftState {
  switch (fldObjAction.fldStrType) {
    case 'add': {
      // Intake entries arrive with provisional ids; the draft
      // re-stamps identity and order so one authority owns both.
      const fldArrAdded = fldObjAction.fldArrEntries.map(fldObjEntry => ({
        fldStrId: fncMakeUuid(),
        fldNumSortOrder: 0,
        fldStrLocalPath: fldObjEntry.fldStrLocalPath,
        fldNumRotationDegrees: fldObjEntry.fldNumRotationDegrees,
        fldStrNormalizedPath: fldObjEntry.fldStrNormalizedPath,
        fldObjVoiceNote: fldObjEntry.fldObjVoiceNote,
      }));
      return {
        ...fldObjState,
        fldArrImages: fncConvResequenced([
          ...fldObjState.fldArrImages,
          ...fldArrAdded,
        ]),
      };
    }
    case 'remove': {
      const fldArrKept = fldObjState.fldArrImages.filter(
        fldObjImage => fldObjImage.fldStrId !== fldObjAction.fldStrId,
      );
      if (fldArrKept.length === fldObjState.fldArrImages.length) {
        return fldObjState;
      }
      return {
        ...fldObjState,
        fldArrImages: fncConvResequenced(fldArrKept),
      };
    }
    case 'move': {
      const fldNumFromIndex = fldObjState.fldArrImages.findIndex(
        fldObjImage => fldObjImage.fldStrId === fldObjAction.fldStrId,
      );
      if (fldNumFromIndex < 0) {
        return fldObjState;
      }
      const fldNumClamped = Math.max(
        0,
        Math.min(
          fldObjAction.fldNumToIndex,
          fldObjState.fldArrImages.length - 1,
        ),
      );
      const fldArrNext = [...fldObjState.fldArrImages];
      const fldObjMoved = fldArrNext.splice(fldNumFromIndex, 1)[0];
      if (fldObjMoved === undefined) {
        return fldObjState;
      }
      fldArrNext.splice(fldNumClamped, 0, fldObjMoved);
      return {
        ...fldObjState,
        fldArrImages: fncConvResequenced(fldArrNext),
      };
    }
    case 'rotate': {
      return {
        ...fldObjState,
        fldArrImages: fldObjState.fldArrImages.map(fldObjImage =>
          fldObjImage.fldStrId === fldObjAction.fldStrId
            ? {
                ...fldObjImage,
                fldNumRotationDegrees:
                  (fldObjImage.fldNumRotationDegrees + 90) % 360,
              }
            : fldObjImage,
        ),
      };
    }
    case 'normalized': {
      return {
        ...fldObjState,
        fldArrImages: fldObjState.fldArrImages.map(fldObjImage =>
          fldObjImage.fldStrId === fldObjAction.fldStrId
            ? { ...fldObjImage, fldStrNormalizedPath: fldObjAction.fldStrPath }
            : fldObjImage,
        ),
      };
    }
    case 'voiceNote': {
      return {
        ...fldObjState,
        fldArrImages: fldObjState.fldArrImages.map(fldObjImage =>
          fldObjImage.fldStrId === fldObjAction.fldStrId
            ? { ...fldObjImage, fldObjVoiceNote: fldObjAction.fldObjNote }
            : fldObjImage,
        ),
      };
    }
    case 'clear': {
      if (fldObjState.fldArrImages.length === 0) {
        return fldObjState;
      }
      return { ...fldObjState, fldArrImages: [] };
    }
  }
}

export function useDraft(
  fldStrMode: fldStrCaptureMode,
  fldObjTarget: fldObjDraftTarget,
): {
  fldObjDraft: fldObjDraftState;
  actAddImages: (fldArrEntries: fldObjDraftImage[]) => void;
  actRemoveImage: (fldStrId: string) => void;
  actMoveImage: (fldStrId: string, fldNumToIndex: number) => void;
  actRotateImage: (fldStrId: string) => void;
  actSetNormalized: (fldStrId: string, fldStrPath: string | null) => void;
  actSetVoiceNote: (
    fldStrId: string,
    fldObjNote: fldObjVoiceNote | null,
  ) => void;
  actClearImages: () => void;
} {
  const [fldObjDraft, actDispatch] = React.useReducer(
    fncDraftReducer,
    undefined,
    () => fncMakeInitialDraftState(fldStrMode, fldObjTarget),
  );

  const actAddImages = React.useCallback(
    (fldArrEntries: fldObjDraftImage[]) => {
      actDispatch({ fldStrType: 'add', fldArrEntries });
    },
    [],
  );
  const actRemoveImage = React.useCallback((fldStrId: string) => {
    actDispatch({ fldStrType: 'remove', fldStrId });
  }, []);
  const actMoveImage = React.useCallback(
    (fldStrId: string, fldNumToIndex: number) => {
      actDispatch({ fldStrType: 'move', fldStrId, fldNumToIndex });
    },
    [],
  );
  const actRotateImage = React.useCallback((fldStrId: string) => {
    actDispatch({ fldStrType: 'rotate', fldStrId });
  }, []);
  const actSetNormalized = React.useCallback(
    (fldStrId: string, fldStrPath: string | null) => {
      actDispatch({ fldStrType: 'normalized', fldStrId, fldStrPath });
    },
    [],
  );
  const actSetVoiceNote = React.useCallback(
    (fldStrId: string, fldObjNote: fldObjVoiceNote | null) => {
      actDispatch({ fldStrType: 'voiceNote', fldStrId, fldObjNote });
    },
    [],
  );
  const actClearImages = React.useCallback(() => {
    actDispatch({ fldStrType: 'clear' });
  }, []);

  return {
    fldObjDraft,
    actAddImages,
    actRemoveImage,
    actMoveImage,
    actRotateImage,
    actSetNormalized,
    actSetVoiceNote,
    actClearImages,
  };
}
