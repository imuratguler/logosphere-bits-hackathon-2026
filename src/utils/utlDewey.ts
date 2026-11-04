/**
 * Logosphere BITS — Dewey root-to-leaf path text.
 *
 * The server verifies the suggestion against dewey_nodes and
 * returns the parent-linked nodes root first; the cards render
 * each row with the real code and name_en. The root starts
 * flush, every deeper level adds one indent step with a `>`
 * marker, and the text stays selectable for copying. A broken
 * walk shows the verified part plus the caller's data-error
 * note; nothing is invented for missing parents or cycles.
 * Naming follows D6 (utl / fld roots).
 */

import type { fldObjDeweyPathNode } from '../types/typModels';

export function utlStrDeweyPath(
  fldArrNodes: fldObjDeweyPathNode[],
  fldStrBrokenNote: string | null,
): string | null {
  if (fldArrNodes.length === 0) {
    return null;
  }
  const fldArrLines = fldArrNodes.map((fldObjNode, fldNumDepth) =>
    fldNumDepth === 0
      ? `${fldObjNode.fldStrCode} ${fldObjNode.fldStrTitle}`
      : `${'  '.repeat(fldNumDepth)}> ${fldObjNode.fldStrCode} ${
          fldObjNode.fldStrTitle
        }`,
  );
  if (fldStrBrokenNote !== null) {
    fldArrLines.push(fldStrBrokenNote);
  }
  return fldArrLines.join('\n');
}
