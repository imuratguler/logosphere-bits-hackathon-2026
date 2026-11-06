# Logosphere BITS — Font Record

This file is the single record of installed fonts. Only verified
files are kept under `assets/fonts`; a font not written here is not
packaged.

Source: `D:\Downloads\Logosphere-BITS.zip` (contains 19 TTFs) +
user addition `NotoSansSymbols2-Regular.ttf` (2026-11-04, source
not stated; the power glyph ⏻ U+23FB was verified in this file).

Finalized 2026-11-06: 20/20 registered on Android (19 Lato /
EB Garamond + Symbols2).

Active install (2026-10-29, K30): the following 6 files were
selected for UI + brand.

| File | Size (bytes) | SHA256 | nameID1 | nameID2 | Weight |
|---|---|---|---|---|---|
| `Lato-Regular.ttf` | 657212 | `6F6940BE0835C3DDEC9199E5FC42BE4CBC61EBCFD58C623FDF719366253F1780` | Lato | Regular | 400 |
| `Lato-Bold.ttf` | 657188 | `BF1B8130069B44B9148EEECE35E5423BEDAC49777BA746615B826B8276574A7B` | Lato | Bold | 700 |
| `Lato-Light.ttf` | 644556 | `E9D59AFB6D9CB9CF6E8D8159D4639D5B577E29EFC64A15182F228659CFC1E818` | Lato | Light | 300 |
| `Lato-Italic.ttf` | 723544 | `8C863F833B12BC8486671D26E3A58B13B0F9EAFF1D6B10398E7C107A9B7EE05A` | Lato | Italic | 400 |
| `Lato-BoldItalic.ttf` | 699008 | `E2F9244FDCD20840F2480F91370CEA885BF99230C49D153199FA64853AD74B69` | Lato | Bold Italic | 700 |
| `EBGaramond-Medium.ttf` | 680636 | `57F9E2A5881AC1A3A7BF02935CEB604BA0CA21961FB161D7A535BAE4F74A52B1` | EB Garamond Medium | Regular | 500 |

Spare install (2026-10-29, K31): the remaining 13 files were copied
by the user into the same folder, verified under the same
discipline; available for future use.

| File | Size (bytes) | SHA256 | nameID1 | nameID2 | Weight |
|---|---|---|---|---|---|
| `Lato-Black.ttf` | 614544 | `4ED66FA3928AE769205635C916B4F9E6A63F6A77F5D9693AC31A83D0D96AE1EF` | Lato | Black | 900 |
| `Lato-BlackItalic.ttf` | 672480 | `0AE5310FE1ED156AB6AF26A8C0BE61AEE44C166896765D5A9473670AD9C28DBC` | Lato | Black Italic | 900 |
| `Lato-Hairline.ttf` | 584784 | `80DC280E8A05B80D7A566A15B379BBA422A776E5BC58B92A9B8F3A9BBEA7EB03` | Lato | Hairline | 250 |
| `Lato-HairlineItalic.ttf` | 609436 | `9E469D156B0471556F202358939CC7FD2CAB421659E3A3638136431D3C46EC8B` | Lato | Hairline Italic | 250 |
| `Lato-Heavy.ttf` | 665420 | `4CE7EC20CD9C391B271B4149AD8CF5A71301D98965403F14FC5530D017146DBB` | Lato | Heavy | 800 |
| `Lato-HeavyItalic.ttf` | 698924 | `4C9AF8DF580F1B7A2E3336D69B225A38364A636DC014D8FD9C2B72ADEA68DD2D` | Lato | Heavy Italic | 800 |
| `Lato-LightItalic.ttf` | 658212 | `8926C41622B7400D7F6F7DBF31CEA50495F31230CF40904B8B83E634BF3CF6C6` | Lato | Light Italic | 300 |
| `Lato-Medium.ttf` | 637068 | `BE8BBF7105500E8FC1F9429307FB396905A0E6CFF63FE1EB751BB319D0F1B0DB` | Lato | Medium | 500 |
| `Lato-MediumItalic.ttf` | 695588 | `0739BE048A122E3ABB0CB731B49F6C07AC212A54EB182EBAA25A65829D5AC0CF` | Lato | Medium Italic | 500 |
| `Lato-Semibold.ttf` | 669228 | `2DC5D31E2CF1E29F3430EB2DFA1BA9911E08EE401B61DD12F40E0ACB047A17A3` | Lato | Semibold | 600 |
| `Lato-SemiboldItalic.ttf` | 698028 | `0AA594079C213D1DBA417A2FC34B8170445D0F03AF02A3B35F16B9B775EEF398` | Lato | Semibold Italic | 600 |
| `Lato-Thin.ttf` | 627220 | `11B51A8BB6361BE3E4642DE40B49C210ECB4A19B8BF630F3335FF07813726F3B` | Lato | Thin | 275 |
| `Lato-ThinItalic.ttf` | 654216 | `C8AD5351E800F8286890A4C8A57D849207CB930287CAEB40C4FFBE538F2F3E0E` | Lato | Thin Italic | 275 |

Verification:

- File names match the target list exactly.
- Real metadata was read from the name table with `fontTools`:
  Lato v2.015 (2015); EB Garamond v1.002. Name ↔ metadata
  matches in every file (active 6: Regular 400, Bold 700,
  Light 300, Italic 400, BoldItalic 700, EB Garamond Medium
  500; spare 13: Thin 275, Hairline 250, Medium 500,
  Semibold 600, Heavy 800, Black 900 + italics).
- Copy integrity: 6/6 SHA256 matched in K30, 13/13 in K31.
- WPF `GlyphTypeface` did not run in this environment
  (constructor STA/context error); GDI+ family names +
  `fontTools` were used instead.

Roles:

- Lato Regular/Bold/Light/Italic/BoldItalic: UI typeface (active).
- EB Garamond Medium: packaged for future live brand text
  (even if the logo text stays drawn).
- Other 13 Lato styles: spare (available for future use).

License note: the zip holds no license text; the licensed-source
principle in D4 applies, no further license claim was recorded.

Android binding (2026-10-29, K32):

- Method: manual copy (`react-native-asset` was not installed;
  no new package and no unverifiable iOS change was wanted).
  Source names are kept; the Android side uses RN resolution names.
- RN 0.88.1 rule (read from source): `fonts/<family>`
  + `""`/`_bold`/`_italic`/`_bold_italic` + `.ttf`; weight<700
  collapses onto the normal/italic file.
- Mapping (`assets/fonts` → `android/app/src/main/assets/fonts`):
  - `Lato-Regular.ttf` → `Lato.ttf` (family "Lato")
  - `Lato-Bold.ttf` → `Lato_bold.ttf`
  - `Lato-Italic.ttf` → `Lato_italic.ttf`
  - `Lato-BoldItalic.ttf` → `Lato_bold_italic.ttf`
  - `Lato-Light.ttf` → `Lato Light.ttf` (family "Lato Light";
    weight 300 would collapse onto the normal file, hence a
    separate family)
  - `EBGaramond-Medium.ttf` → `EB Garamond Medium.ttf` (family
    "EB Garamond Medium", single style)
- Constraint: in the "Lato Light" and "EB Garamond Medium"
  families only the normal style is requested (no bold
  variant; a bold request falls back to the system font).
- Verification (K32): 6 files listed under `assets/fonts/` in
  the APK; each style seen separately on device in a
  temporary view (Regular/Bold/Italic/BoldItalic/Light
  300/EB Garamond Medium); `fontFamily: "Lato-Regular"` fell
  back to the system font (negative control). The temporary
  view was removed, a clean base reinstalled and verified.
- No iOS binding; screen/icon/AI code was outside this step.

Full Android registration (2026-11-04):

- Scope: all 19 TTFs under `assets/fonts` are now registered
  under `android/app/src/main/assets/fonts` with RN resolution
  names (19/19). The code uses the "Lato" (+bold weight via
  `Lato_bold.ttf`), "Lato-Medium", "Lato Black" and
  "EB Garamond Medium" families (`utlTheme.ts`; Command 15:
  buttons Lato+bold, numbers Lato-Medium; Command 17: sale '?'
  glyph in Lato Black); the remaining families are ready for
  future change rounds.
- Addition (2026-11-04, Command 14): `NotoSansSymbols2-Regular.ttf`
  (1228868 bytes, SHA256 `F67F40C6…39EB97E`, nameID1 "Noto Sans
  Symbols 2") → `Noto Sans Symbols 2.ttf` (family "Noto Sans
  Symbols 2", 20/20). The code uses this family for the logoff
  glyph (`fldStrFontFamilySymbols`, `scrHome.tsx`); the
  U+23FB/⏻ mapping was verified with fontTools. Copy SHA256
  matched (1/1).
- New mapping (source → Android; same K32 rule):
  - `Lato-Black.ttf` → `Lato Black.ttf` (family "Lato Black")
  - `Lato-BlackItalic.ttf` → `Lato Black_italic.ttf`
  - `Lato-Hairline.ttf` → `Lato Hairline.ttf` (family "Lato Hairline")
  - `Lato-HairlineItalic.ttf` → `Lato Hairline_italic.ttf`
  - `Lato-Heavy.ttf` → `Lato Heavy.ttf` (family "Lato Heavy")
  - `Lato-HeavyItalic.ttf` → `Lato Heavy_italic.ttf`
  - `Lato-Semibold.ttf` → `Lato Semibold.ttf` (family "Lato Semibold")
  - `Lato-SemiboldItalic.ttf` → `Lato Semibold_italic.ttf`
  - `Lato-Thin.ttf` → `Lato Thin.ttf` (family "Lato Thin")
  - `Lato-ThinItalic.ttf` → `Lato Thin_italic.ttf`
  - `Lato-LightItalic.ttf` → `Lato Light_italic.ttf` (joined the
    "Lato Light" family)
  - `Lato-MediumItalic.ttf` → `Lato-Medium_italic.ttf` (joined the
    "Lato-Medium" family)
- Exception (documented): `Lato-Medium.ttf` keeps its source
  name; the "Lato-Medium" family is used in code, so it was not
  renamed. Its SHA256 matches the table above (the file is
  real, only the name is spaceless).
- Constraint (same as K32): weight<700 requests collapse onto
  the normal/italic file; only normal + italic is requested in
  each new family.
- Verification: 12 copy SHA256 values matched the source
  exactly (12/12). In-APK listing + on-device style view
  followed the next `run-android` build; the shipped styles
  (Lato+bold buttons, Lato-Medium numbers, Lato Black '?',
  Symbols2 logoff) were confirmed on device in the Command 14–17
  rounds.
- Note: `assets/fonts` names did not change; the Android side
  uses only resolution names.
