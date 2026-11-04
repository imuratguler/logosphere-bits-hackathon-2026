// Logosphere BITS — code mapping tests (Deno).

import { assertStrictEquals } from '@std/assert';
import {
  fncConvConditionCode,
  fncConvContentTags,
  fncConvCoverCode,
  fncConvFlagCode,
  fncConvPaperCode,
  fncConvPersonRoleCode,
  fncConvPublicationTypeCode,
} from './codes.ts';

Deno.test('codes: publication types match EN, TR, and case folds', () => {
  assertStrictEquals(fncConvPublicationTypeCode('Book'), 0);
  assertStrictEquals(fncConvPublicationTypeCode('  academic JOURNAL '), 1);
  assertStrictEquals(fncConvPublicationTypeCode('Ansiklopedi'), 4);
  assertStrictEquals(fncConvPublicationTypeCode('Set-içi Set'), 19);
  assertStrictEquals(fncConvPublicationTypeCode('Comic'), null);
  assertStrictEquals(fncConvPublicationTypeCode(null), null);
  assertStrictEquals(fncConvPublicationTypeCode(''), null);
});

Deno.test('codes: person roles keep every contributor separate', () => {
  assertStrictEquals(fncConvPersonRoleCode('Author'), 1);
  assertStrictEquals(fncConvPersonRoleCode('translator'), 8);
  assertStrictEquals(fncConvPersonRoleCode('Çevirmen'), 8);
  assertStrictEquals(fncConvPersonRoleCode('Kapak Sanatçısı'), 9);
  assertStrictEquals(fncConvPersonRoleCode('contributor'), 0);
  assertStrictEquals(fncConvPersonRoleCode('author, translator'), null);
  assertStrictEquals(fncConvPersonRoleCode('Writer'), null);
});

Deno.test('codes: cover and paper match exact labels only', () => {
  assertStrictEquals(fncConvCoverCode('Hardcover'), 2);
  assertStrictEquals(fncConvCoverCode('Sert Kapak'), 2);
  assertStrictEquals(fncConvCoverCode('None'), 0);
  assertStrictEquals(fncConvCoverCode('Hardback'), null);
  assertStrictEquals(fncConvPaperCode('Matte Coated'), 5);
  assertStrictEquals(fncConvPaperCode('Mat Kuşe'), 5);
  assertStrictEquals(fncConvPaperCode('Unspecified'), 0);
  assertStrictEquals(fncConvPaperCode('Recycled'), null);
});

Deno.test('codes: condition zero is New and unknowns stay null', () => {
  assertStrictEquals(fncConvConditionCode('New'), 0);
  assertStrictEquals(fncConvConditionCode('Like New'), 5);
  assertStrictEquals(fncConvConditionCode('Çok İyi'), 4);
  assertStrictEquals(fncConvConditionCode('İyi'), 3);
  assertStrictEquals(fncConvConditionCode('Excellent'), null);
  assertStrictEquals(fncConvConditionCode('worn'), null);
  assertStrictEquals(fncConvConditionCode(null), null);
});

Deno.test('codes: flags parse presence and absence conservatively', () => {
  assertStrictEquals(fncConvFlagCode('present'), 1);
  assertStrictEquals(fncConvFlagCode('Yes, intact'), 1);
  assertStrictEquals(fncConvFlagCode('Mevcut'), 1);
  assertStrictEquals(fncConvFlagCode('no dust jacket'), 0);
  assertStrictEquals(fncConvFlagCode('missing'), 0);
  assertStrictEquals(fncConvFlagCode('Yok'), 0);
  assertStrictEquals(fncConvFlagCode('torn, see photo'), null);
  assertStrictEquals(fncConvFlagCode(null), null);
});

Deno.test('codes: content tags OR known regions and skip the rest', () => {
  assertStrictEquals(
    fncConvContentTags(['front_cover', 'spine', 'bogus']),
    33,
  );
  assertStrictEquals(fncConvContentTags(['colophon']), 128);
  assertStrictEquals(fncConvContentTags(['other']), 2048);
  assertStrictEquals(fncConvContentTags([]), null);
  assertStrictEquals(fncConvContentTags(['boxed_set']), null);
  assertStrictEquals(fncConvContentTags(null), null);
});
