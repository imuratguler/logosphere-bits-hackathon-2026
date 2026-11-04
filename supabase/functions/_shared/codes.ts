// Logosphere BITS — label-to-code mapping (shared).
// Deterministic, exact-label matching against the §03
// contract tables: the input is folded (NFKC, case,
// whitespace) and must equal a known English or Turkish
// label, otherwise the code stays null. Nothing is
// guessed — an unknown condition is null, never New (0),
// and region tags outside the prompt vocabulary add no
// bits. Identifiers follow D6.

function fncConvFold(fldObjValue: unknown): string | null {
  if (typeof fldObjValue !== 'string') {
    return null;
  }
  const fldStrFolded = fldObjValue
    .normalize('NFKC')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return fldStrFolded === '' ? null : fldStrFolded;
}

function fncConvTable(
  fldArrRows: [number, string, string][],
): Map<string, number> {
  const fldObjOut = new Map<string, number>();
  for (const [fldNumCode, fldStrEn, fldStrTr] of fldArrRows) {
    for (const fldStrLabel of [fldStrEn, fldStrTr]) {
      const fldStrKey = fncConvFold(fldStrLabel);
      if (fldStrKey !== null && !fldObjOut.has(fldStrKey)) {
        fldObjOut.set(fldStrKey, fldNumCode);
      }
    }
  }
  return fldObjOut;
}

function fncConvLookup(
  fldObjTable: Map<string, number>,
  fldObjValue: unknown,
): number | null {
  const fldStrKey = fncConvFold(fldObjValue);
  if (fldStrKey === null) {
    return null;
  }
  return fldObjTable.get(fldStrKey) ?? null;
}

const fldObjPublicationTypes = fncConvTable([
  [0, 'Book', 'Kitap'],
  [1, 'Academic Journal', 'Akademik Dergi'],
  [2, 'Magazine', 'Dergi'],
  [3, 'Periodical', 'Süreli Yayın'],
  [4, 'Encyclopedia', 'Ansiklopedi'],
  [5, 'Dictionary', 'Sözlük'],
  [6, 'Newspaper', 'Gazete'],
  [7, 'Newsletter', 'Bülten'],
  [8, 'Almanac', 'Almanak'],
  [9, 'Fascicle', 'Fasikül'],
  [10, 'Catalog', 'Katalog'],
  [11, 'Thesis', 'Tez'],
  [12, 'Report', 'Rapor'],
  [13, 'Brochure', 'Broşür'],
  [14, 'Booklet', 'Kitapçık'],
  [15, 'Proceedings', 'Bildiriler'],
  [16, 'Album', 'Albüm'],
  [17, 'Atlas', 'Atlas'],
  [18, 'Planner', 'Planlayıcı'],
  [19, 'Set-in-Set', 'Set-içi Set'],
]);

const fldObjPersonRoles = fncConvTable([
  [0, 'Contributor', 'Katkıda Bulunan'],
  [1, 'Author', 'Yazar'],
  [2, 'Prepared', 'Hazırlayan'],
  [3, 'Compiled', 'Derleyen'],
  [4, 'Editor', 'Editör'],
  [5, 'Foreword', 'Önsöz Yazarı'],
  [6, 'Illustrator', 'Resimleyen'],
  [7, 'Photographer', 'Fotoğrafçı'],
  [8, 'Translator', 'Çevirmen'],
  [9, 'Cover Art', 'Kapak Sanatçısı'],
]);

const fldObjCovers = fncConvTable([
  [0, 'None', 'Yok'],
  [1, 'Paperback', 'Karton Kapak'],
  [2, 'Hardcover', 'Sert Kapak'],
  [3, 'Greyboard', 'Gri Mukavva'],
  [4, 'Flexibound', 'Esnek Kapak'],
  [5, 'Clothbound', 'Bez Ciltli'],
  [6, 'Leatherbound', 'Deri Ciltli'],
  [7, 'Spiralbound', 'Spiralli'],
  [8, 'Smyth Sewn', 'Smyth Dikişli'],
  [9, 'Saddle Stitched', 'Tel Dikişli'],
  [10, 'Mounted', 'Monte'],
]);

const fldObjPapers = fncConvTable([
  [0, 'Unspecified', 'Belirtilmemiş'],
  [1, 'Premium Offset', 'Premium Ofset'],
  [2, 'Bookprint', 'Kitap Baskı Kağıdı'],
  [3, 'Newsprint', 'Gazete Kağıdı'],
  [4, 'Glossy Coated', 'Parlak Kuşe'],
  [5, 'Matte Coated', 'Mat Kuşe'],
  [6, 'Bristol Board', 'Bristol Karton'],
  [7, 'Tracing', 'Aydınger'],
  [8, 'Textured', 'Dokulu'],
  [9, 'BOPP Lamination', 'BOPP Kaplama'],
  [10, 'Kraft', 'Kraft'],
]);

const fldObjConditions = fncConvTable([
  [0, 'New', 'Yeni'],
  [1, 'Poor', 'Kötü'],
  [2, 'Fair', 'Orta'],
  [3, 'Good', 'İyi'],
  [4, 'Very Good', 'Çok İyi'],
  [5, 'Like New', 'Yeni Gibi'],
]);

export function fncConvPublicationTypeCode(
  fldObjValue: unknown,
): number | null {
  return fncConvLookup(fldObjPublicationTypes, fldObjValue);
}

export function fncConvPersonRoleCode(fldObjValue: unknown): number | null {
  return fncConvLookup(fldObjPersonRoles, fldObjValue);
}

export function fncConvCoverCode(fldObjValue: unknown): number | null {
  return fncConvLookup(fldObjCovers, fldObjValue);
}

export function fncConvPaperCode(fldObjValue: unknown): number | null {
  return fncConvLookup(fldObjPapers, fldObjValue);
}

export function fncConvConditionCode(fldObjValue: unknown): number | null {
  return fncConvLookup(fldObjConditions, fldObjValue);
}

const fldObjPackaging = fncConvTable([
  [0, 'None', 'Yok'],
  [1, 'Shrink Wrap', 'Shrink Ambalaj'],
  [2, 'Slipcase', 'Kılıf Kutu'],
  [3, 'Clamshell', 'Kapaklı Kutu'],
  [4, 'Leather Case', 'Deri Kutu'],
  [5, 'Wooden Box', 'Ahşap Kutu'],
  [6, 'Cloth Box', 'Bez Kutu'],
  [7, 'Acetate Sleeve', 'Asetat Kılıf'],
  [8, 'Presentation Case', 'Sunum Kutusu'],
]);

export function fncConvPackagingCode(fldObjValue: unknown): number | null {
  return fncConvLookup(fldObjPackaging, fldObjValue);
}

export function fncConvFlagCode(fldObjValue: unknown): number | null {
  const fldStrText = fncConvFold(fldObjValue);
  if (fldStrText === null) {
    return null;
  }
  if (
    /\b(no|not|missing|absent|without|none|yok|hayır|hayir)\b/.test(fldStrText)
  ) {
    return 0;
  }
  if (
    /\b(yes|present|has|have|with|intact|var|mevcut|evet)\b/.test(fldStrText)
  ) {
    return 1;
  }
  return null;
}

const fldObjRegionBits: Record<string, number> = {
  front_cover: 1,
  back_cover: 16,
  spine: 32,
  title_page: 64,
  colophon: 128,
  dedication: 256,
  other: 2048,
};

export function fncConvContentTags(fldObjValue: unknown): number | null {
  if (!Array.isArray(fldObjValue)) {
    return null;
  }
  let fldNumTags = 0;
  let fldBooKnown = false;
  for (const fldObjEntry of fldObjValue) {
    if (typeof fldObjEntry !== 'string') {
      continue;
    }
    const fldNumBit = fldObjRegionBits[fldObjEntry.trim().toLowerCase()];
    if (fldNumBit === undefined) {
      continue;
    }
    fldBooKnown = true;
    fldNumTags |= fldNumBit;
  }
  return fldBooKnown ? fldNumTags : null;
}
