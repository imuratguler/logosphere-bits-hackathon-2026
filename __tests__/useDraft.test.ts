/**
 * Logosphere BITS — draft reducer tests (pure, no renderer).
 */

import type {
  fldObjDraftImage,
  fldObjDraftTarget,
  fldObjVoiceNote,
} from '../src/types/typModels';
import {
  fncDraftReducer,
  fncMakeInitialDraftState,
} from '../src/hooks/useDraft';

const fldObjTarget: fldObjDraftTarget = {
  fldStrLibraryId: 'lib-1',
  fldStrLibraryName: 'Demo Library',
  fldStrCollectionId: 'col-9',
  fldStrCollectionName: 'Rare Books',
};

function fncMakeInput(fldStrName: string): fldObjDraftImage {
  return {
    fldStrId: `provisional-${fldStrName}`,
    fldNumSortOrder: 99,
    fldStrLocalPath: `/cache/bits-draft/${fldStrName}`,
    fldNumRotationDegrees: 0,
    fldStrNormalizedPath: null,
    fldObjVoiceNote: null,
  };
}

describe('draft reducer', () => {
  it('starts empty with fixed mode and target', () => {
    const fldObjState = fncMakeInitialDraftState('bulk', fldObjTarget);
    expect(fldObjState.fldStrMode).toBe('bulk');
    expect(fldObjState.fldObjTarget).toEqual(fldObjTarget);
    expect(fldObjState.fldArrImages).toEqual([]);
  });

  it('adds with fresh UUIDs and append order', () => {
    let fldObjState = fncMakeInitialDraftState('single', fldObjTarget);
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'add',
      fldArrEntries: [fncMakeInput('a.jpg')],
    });
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'add',
      fldArrEntries: [fncMakeInput('b.jpg'), fncMakeInput('c.jpg')],
    });
    const fldArrIds = fldObjState.fldArrImages.map(
      fldObjImage => fldObjImage.fldStrId,
    );
    expect(new Set(fldArrIds).size).toBe(3);
    for (const fldStrId of fldArrIds) {
      expect(fldStrId.startsWith('provisional-')).toBe(false);
    }
    for (const fldStrId of fldArrIds) {
      expect(fldStrId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
    expect(
      fldObjState.fldArrImages.map(fldObjImage => fldObjImage.fldNumSortOrder),
    ).toEqual([0, 1, 2]);
    expect(fldObjState.fldStrMode).toBe('single');
    expect(fldObjState.fldObjTarget).toEqual(fldObjTarget);
  });

  it('keeps surviving identities on remove', () => {
    let fldObjState = fncMakeInitialDraftState('single', fldObjTarget);
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'add',
      fldArrEntries: [
        fncMakeInput('a.jpg'),
        fncMakeInput('b.jpg'),
        fncMakeInput('c.jpg'),
      ],
    });
    const fldStrVictim = fldObjState.fldArrImages[1]?.fldStrId ?? '';
    const fldArrSurvivors = fldObjState.fldArrImages
      .filter(fldObjImage => fldObjImage.fldStrId !== fldStrVictim)
      .map(fldObjImage => fldObjImage.fldStrId);
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'remove',
      fldStrId: fldStrVictim,
    });
    expect(
      fldObjState.fldArrImages.map(fldObjImage => fldObjImage.fldStrId),
    ).toEqual(fldArrSurvivors);
    expect(
      fldObjState.fldArrImages.map(fldObjImage => fldObjImage.fldNumSortOrder),
    ).toEqual([0, 1]);
  });

  it('ignores unknown remove and move targets', () => {
    let fldObjState = fncMakeInitialDraftState('single', fldObjTarget);
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'add',
      fldArrEntries: [fncMakeInput('a.jpg')],
    });
    const fldObjSame = fldObjState;
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'remove',
      fldStrId: 'ghost',
    });
    expect(fldObjState).toBe(fldObjSame);
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'move',
      fldStrId: 'ghost',
      fldNumToIndex: 0,
    });
    expect(fldObjState).toBe(fldObjSame);
  });

  it('moves with clamped order and stable identities', () => {
    let fldObjState = fncMakeInitialDraftState('single', fldObjTarget);
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'add',
      fldArrEntries: [
        fncMakeInput('a.jpg'),
        fncMakeInput('b.jpg'),
        fncMakeInput('c.jpg'),
      ],
    });
    const fldStrFirst = fldObjState.fldArrImages[0]?.fldStrId ?? '';
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'move',
      fldStrId: fldStrFirst,
      fldNumToIndex: 99,
    });
    expect(
      fldObjState.fldArrImages.map(fldObjImage =>
        fldObjImage.fldStrLocalPath.split('/').pop(),
      ),
    ).toEqual(['b.jpg', 'c.jpg', 'a.jpg']);
    expect(
      fldObjState.fldArrImages.map(fldObjImage => fldObjImage.fldNumSortOrder),
    ).toEqual([0, 1, 2]);
    const fldStrLast = fldObjState.fldArrImages[2]?.fldStrId ?? '';
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'move',
      fldStrId: fldStrLast,
      fldNumToIndex: -5,
    });
    expect(
      fldObjState.fldArrImages.map(fldObjImage =>
        fldObjImage.fldStrLocalPath.split('/').pop(),
      ),
    ).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
  });

  it('rotates in quarter turns', () => {
    let fldObjState = fncMakeInitialDraftState('single', fldObjTarget);
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'add',
      fldArrEntries: [fncMakeInput('a.jpg')],
    });
    const fldStrId = fldObjState.fldArrImages[0]?.fldStrId ?? '';
    for (const fldNumExpected of [90, 180, 270, 0, 90]) {
      fldObjState = fncDraftReducer(fldObjState, {
        fldStrType: 'rotate',
        fldStrId,
      });
      expect(fldObjState.fldArrImages[0]?.fldNumRotationDegrees).toBe(
        fldNumExpected,
      );
    }
  });

  it('writes back the normalized path', () => {
    let fldObjState = fncMakeInitialDraftState('single', fldObjTarget);
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'add',
      fldArrEntries: [fncMakeInput('a.jpg')],
    });
    const fldStrId = fldObjState.fldArrImages[0]?.fldStrId ?? '';
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'normalized',
      fldStrId,
      fldStrPath: '/cache/bits-normalized/x.jpg',
    });
    expect(fldObjState.fldArrImages[0]?.fldStrNormalizedPath).toBe(
      '/cache/bits-normalized/x.jpg',
    );
  });

  it('sets and replaces the single voice note', () => {
    const fldObjFirst: fldObjVoiceNote = {
      fldStrId: 'note-1',
      fldNumVersion: 1,
      fldStrFilePath: '/cache/bits-audio/note-1.m4a',
      fldStrMimeType: 'audio/mp4',
      fldNumDurationSec: 4,
      fldStrTranscriptionStatus: 'none',
    };
    const fldObjSecond: fldObjVoiceNote = {
      ...fldObjFirst,
      fldStrId: 'note-2',
      fldNumVersion: 2,
      fldStrFilePath: '/cache/bits-audio/note-2.m4a',
    };
    let fldObjState = fncMakeInitialDraftState('single', fldObjTarget);
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'add',
      fldArrEntries: [fncMakeInput('a.jpg'), fncMakeInput('b.jpg')],
    });
    const fldStrId = fldObjState.fldArrImages[0]?.fldStrId ?? '';
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'voiceNote',
      fldStrId,
      fldObjNote: fldObjFirst,
    });
    expect(fldObjState.fldArrImages[0]?.fldObjVoiceNote).toEqual(fldObjFirst);
    expect(fldObjState.fldArrImages[1]?.fldObjVoiceNote).toBe(null);
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'voiceNote',
      fldStrId,
      fldObjNote: fldObjSecond,
    });
    expect(fldObjState.fldArrImages[0]?.fldObjVoiceNote).toEqual(fldObjSecond);
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'voiceNote',
      fldStrId,
      fldObjNote: null,
    });
    expect(fldObjState.fldArrImages[0]?.fldObjVoiceNote).toBe(null);
  });

  it('clears every image at once', () => {
    let fldObjState = fncMakeInitialDraftState('bulk', fldObjTarget);
    const fldObjSame = fldObjState;
    fldObjState = fncDraftReducer(fldObjState, { fldStrType: 'clear' });
    expect(fldObjState).toBe(fldObjSame);
    fldObjState = fncDraftReducer(fldObjState, {
      fldStrType: 'add',
      fldArrEntries: [fncMakeInput('a.jpg'), fncMakeInput('b.jpg')],
    });
    fldObjState = fncDraftReducer(fldObjState, { fldStrType: 'clear' });
    expect(fldObjState.fldArrImages).toEqual([]);
    expect(fldObjState.fldStrMode).toBe('bulk');
    expect(fldObjState.fldObjTarget).toEqual(fldObjTarget);
  });
});
