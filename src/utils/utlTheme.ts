/**
 * Logosphere BITS — design tokens: colors, font families, spacing, radii.
 *
 * Naming follows D6 "Programcı İsimlendirmeleri" (col / fld roots).
 * Brand font (EB Garamond Medium) has a single style: never request bold
 * for it (no bold variant exists; Android would fall back to a system font).
 */

export const colBackground = '#1a1a2e';
export const colSurface = '#16213e';
export const colSurfaceLight = '#1f2a52';
export const colAccentBlue = '#4A90D9';
export const colAccentGold = '#e8c84a';
export const colDanger = '#CF667C';
export const colDelete = '#C0392B';
export const colDeleteSoft = '#E57373';
export const colScrim = 'rgba(0, 0, 0, 0.6)';
export const colScrimLight = 'rgba(255, 255, 255, 0.12)';
export const colTextPrimary = '#FFFFFF';
export const colTextSecondary = '#C6C6C6';
// Non-text surfaces keep the previous grey.
export const colBorderSecondary = '#A0A0A0';
export const colTextSoft = '#DEDEDE';
export const colTextOnAccent = '#101b38';
// Komut15 row tones: set rows sit on dark matte teal (light text),
// in-set member rows on light matte teal (dark text via colTextOnAccent).
export const colRowSet = '#1D4F4A';
export const colRowMember = '#C2DAD4';

export const fldStrFontFamilyUi = 'Lato';
export const fldStrFontFamilyUiMedium = 'Lato-Medium';
export const fldStrFontFamilyBrand = 'EB Garamond Medium';
export const fldStrFontFamilySymbols = 'Noto Sans Symbols 2';

export const fldNumSpacingXs = 4;
export const fldNumSpacingSm = 8;
export const fldNumSpacingMd = 16;
export const fldNumSpacingLg = 24;
export const fldNumSpacingXl = 32;

export const fldNumRadiusSm = 4;
export const fldNumRadiusMd = 8;
export const fldNumRadiusLg = 16;

export const fldNumTopBarHeight = 60;
export const fldNumTouchTarget = 48;
export const fldNumDropdownHeight = 52;
export const fldNumTitleSize = 22;
