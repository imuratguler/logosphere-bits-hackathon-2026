/**
 * Logosphere BITS — Dewey path text tests.
 *
 * Root starts flush, deeper levels indent one step with a
 * `>` marker, and broken walks append the data-error note.
 */

import { utlStrDeweyPath } from '../src/utils/utlDewey';

describe('utlStrDeweyPath', () => {
  test('renders root-to-leaf rows with real codes and titles', () => {
    expect(
      utlStrDeweyPath(
        [
          { fldStrCode: '800', fldStrTitle: 'Root Eight' },
          { fldStrCode: '81', fldStrTitle: 'Branch One' },
          { fldStrCode: '813.54', fldStrTitle: 'Leaf Five-Four' },
        ],
        null,
      ),
    ).toBe(
      '800 Root Eight\n' +
        '  > 81 Branch One\n' +
        '    > 813.54 Leaf Five-Four',
    );
  });

  test('appends the broken note after the verified part', () => {
    expect(
      utlStrDeweyPath(
        [{ fldStrCode: '813.54', fldStrTitle: 'Leaf Five-Four' }],
        'Catalog path incomplete: data error',
      ),
    ).toBe('813.54 Leaf Five-Four\nCatalog path incomplete: data error');
  });

  test('returns null without nodes', () => {
    expect(utlStrDeweyPath([], null)).toBe(null);
  });
});
