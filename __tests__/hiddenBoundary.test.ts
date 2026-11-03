/**
 * Logosphere BITS — hidden/demo boundary tests (hermetic source scan).
 *
 * Reads repo sources with fs (no imports of the scanned modules, so
 * the scan itself cannot wire anything): demo entry files must not
 * import hidden account modules, account modules must not import
 * demo session wiring, the navigator must carry exactly the ten
 * demo routes with no linking config, the manifest must carry no
 * deep-link filter, and each side must use only its own string
 * groups. Failing closed: an unknown future screen file on either
 * side fails the inventory checks until it is classified.
 */

// Minimal node shapes: the project tsconfig carries only jest
// globals, so the scan shapes the two modules it needs instead
// of widening globals for mobile code.
declare const __dirname: string;

type fldObjFsShape = {
  readFileSync: (fldStrPath: string, fldStrEncoding: string) => string;
  readdirSync: (fldStrPath: string) => string[];
};

type fldObjPathShape = {
  resolve: (...fldArrParts: string[]) => string;
  join: (...fldArrParts: string[]) => string;
};

const fldObjFs = require('fs') as fldObjFsShape;
const fldObjPath = require('path') as fldObjPathShape;

const fldStrRoot = fldObjPath.resolve(__dirname, '..');

const fldArrDemoScreens = [
  'src/screens/scrHome.tsx',
  'src/screens/scrLibraryList.tsx',
  'src/screens/scrPersonaSelection.tsx',
  'src/screens/scrCollectionBrowser.tsx',
  'src/screens/scrLibrarySettings.tsx',
  'src/screens/scrCollectionSettings.tsx',
  'src/screens/scrCameraCapture.tsx',
  'src/screens/scrAnalysisFlow.tsx',
  'src/screens/scrAnalysisResult.tsx',
  'src/screens/scrMarketPrice.tsx',
  'src/screens/scrResultMulti.tsx',
  'src/screens/scrResultSingle.tsx',
  'src/screens/scrSetDetail.tsx',
];

const fldArrAccountScreens = [
  'src/screens/scrAccountLogin.tsx',
  'src/screens/scrAccountRegister.tsx',
  'src/screens/scrAccountProfile.tsx',
  'src/screens/scrAccountDocuments.tsx',
  'src/screens/scrAccountRoles.tsx',
  'src/screens/scrAccountMessages.tsx',
  'src/screens/scrAccountInvitations.tsx',
  'src/screens/scrAccountRelations.tsx',
];

const fldArrAccountServices = [
  'src/services/srvRealAccount.ts',
  'src/services/srvAccountProfile.ts',
  'src/services/srvAccountDocuments.ts',
  'src/services/srvAccountRoles.ts',
  'src/services/srvAccountSocial.ts',
];

function fncRunRead(fldStrRelative: string): string {
  return fldObjFs.readFileSync(
    fldObjPath.join(fldStrRoot, fldStrRelative),
    'utf8',
  );
}

function fncRunListDir(fldStrRelative: string): string[] {
  return fldObjFs
    .readdirSync(fldObjPath.join(fldStrRoot, fldStrRelative))
    .filter(
      fldStrName => fldStrName.endsWith('.ts') || fldStrName.endsWith('.tsx'),
    )
    .map(fldStrName => `${fldStrRelative}/${fldStrName}`);
}

function fncRunDemoEntryFiles(): string[] {
  return [
    'App.tsx',
    ...fncRunListDir('src/navigation'),
    ...fncRunListDir('src/contexts'),
    ...fldArrDemoScreens,
    ...fncRunListDir('src/services').filter(fldStrFile =>
      fldStrFile.includes('srvDemo'),
    ),
    ...fncRunListDir('src/components'),
    'src/validation/vldAuthorization.ts',
    'src/validation/vldDetails.ts',
    'src/validation/vldHierarchy.ts',
    'src/validation/vldMembership.ts',
  ];
}

function fncRunAccountFiles(): string[] {
  return [
    ...fldArrAccountScreens,
    ...fldArrAccountServices,
    'src/validation/vldAccount.ts',
  ];
}

function fncRunStripComments(fldStrSource: string): string {
  return fldStrSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1');
}

describe('hidden/demo boundary', () => {
  it('knows every screen file on both sides', () => {
    const fldArrScreens = fncRunListDir('src/screens');
    expect(fldArrScreens.sort()).toEqual(
      [...fldArrDemoScreens, ...fldArrAccountScreens].sort(),
    );
  });

  it('keeps account modules out of every demo entry file', () => {
    const fldObjAccountImport =
      /(?:from\s+|require\()\s*['"][^'"]*Account[^'"]*['"]/;
    const fldObjAccountIdentifier =
      /\b(?:scrAccount|srvAccount|srvRealAccount|srvAuth(?:Login|Register|Logout|LinkIdentity)|vldSchAccount|vldChgIsAccountRelation|vldChgIsProfileType|fldObjAccount|fldStrAccount)\w*\b/;
    for (const fldStrFile of fncRunDemoEntryFiles()) {
      const fldStrCode = fncRunStripComments(fncRunRead(fldStrFile));
      expect(`${fldStrFile}: ${fldStrCode}`).not.toMatch(fldObjAccountImport);
      expect(`${fldStrFile}: ${fldStrCode}`).not.toMatch(
        fldObjAccountIdentifier,
      );
    }
  });

  it('keeps demo session wiring out of every account module', () => {
    const fldObjDemoImport =
      /(?:from\s+|require\()\s*['"][^'"]*(?:srvDemo|ctxDemo)[^'"]*['"]/;
    const fldObjDemoIdentifier =
      /\b(?:useDemoSession|VwDemoSessionProvider|srvApiGetDemoClient|srvApiSelectPersona|srvApiClearPersona|srvApiRefreshSession)\b|DemoSession|DemoClient/;
    for (const fldStrFile of fncRunAccountFiles()) {
      const fldStrCode = fncRunStripComments(fncRunRead(fldStrFile));
      expect(`${fldStrFile}: ${fldStrCode}`).not.toMatch(fldObjDemoImport);
      expect(`${fldStrFile}: ${fldStrCode}`).not.toMatch(fldObjDemoIdentifier);
    }
  });

  it('closes the demo navigator to exactly twelve routes', () => {
    const fldStrNav = fncRunRead('src/navigation/navApplication.tsx');
    const fldArrRouteNames = [...fldStrNav.matchAll(/name="([A-Za-z]+)"/g)]
      .map(fldArrMatch => fldArrMatch[1])
      .filter(fldStrName => fldStrName !== undefined);
    const fldArrScreens = [...fldStrNav.matchAll(/<fldObjStack\.Screen/g)];
    expect(fldArrScreens.length).toBe(12);
    expect(fldArrRouteNames.sort()).toEqual(
      [
        'AnalysisFlow',
        'AnalysisResult',
        'CameraCapture',
        'CollectionBrowser',
        'CollectionSettings',
        'Home',
        'LibraryList',
        'LibrarySettings',
        'MarketPrice',
        'PersonaSelection',
        'SetDetail',
        'Splash',
      ].sort(),
    );
    const fldArrScreenImports = [
      ...fldStrNav.matchAll(/from\s+'\.\.\/screens\/(\w+)'/g),
    ].map(fldArrMatch => fldArrMatch[1]);
    expect(fldArrScreenImports.sort()).toEqual(
      [
        'scrAnalysisFlow',
        'scrAnalysisResult',
        'scrCameraCapture',
        'scrCollectionBrowser',
        'scrCollectionSettings',
        'scrHome',
        'scrLibraryList',
        'scrLibrarySettings',
        'scrMarketPrice',
        'scrPersonaSelection',
        'scrSetDetail',
      ].sort(),
    );
  });

  it('carries no linking config on the demo navigator or app root', () => {
    expect(fncRunRead('src/navigation/navApplication.tsx')).not.toMatch(
      /[Ll]inking/,
    );
    expect(fncRunRead('App.tsx')).not.toMatch(/[Ll]inking/);
  });

  it('carries no deep-link filter in the Android manifest', () => {
    const fldStrManifest = fncRunRead(
      'android/app/src/main/AndroidManifest.xml',
    );
    expect(fldStrManifest).not.toMatch(/android\.intent\.action\.VIEW/);
    expect(fldStrManifest).not.toMatch(/android\.intent\.category\.BROWSABLE/);
  });

  it('keeps account string groups out of demo screens', () => {
    for (const fldStrFile of fldArrDemoScreens) {
      expect(fncRunRead(fldStrFile)).not.toMatch(/fldObjAccount/);
    }
  });

  it('keeps demo string groups out of account screens', () => {
    for (const fldStrFile of fldArrAccountScreens) {
      const fldStrCode = fncRunStripComments(fncRunRead(fldStrFile));
      expect(`${fldStrFile}: ${fldStrCode}`).not.toMatch(
        /fldObjStrings\.fldObj(?!Account)/,
      );
    }
  });

  it('keeps secrets out of the export module code', () => {
    const fldStrCode = fncRunStripComments(
      fncRunRead('src/services/srvDemoExport.ts'),
    );
    expect(fldStrCode).not.toMatch(
      /\b(session|token|secret|password|personas?|audioUrl|publicUrl|file_path|buckets?|storage|anonKey|credential|privateKey)\b/i,
    );
  });

  it('exports through the fixed public column list only', () => {
    const fldStrCode = fncRunRead('src/services/srvDemoExport.ts');
    const fldObjColumns = fldStrCode.match(
      /fldArrExportColumns[^=]*=\s*\[([\s\S]*?)\];/,
    );
    if (fldObjColumns === null || fldObjColumns[1] === undefined) {
      throw new Error('Logosphere BITS: export columns were not found.');
    }
    const fldArrColumns = [...fldObjColumns[1].matchAll(/'([^']+)'/g)].map(
      fldArrMatch => fldArrMatch[1],
    );
    expect(fldArrColumns).toEqual([
      'Title',
      'Contributors',
      'ISBN-13',
      'ISBN-10',
      'Publisher',
      'Year',
      'Edition',
      'Condition',
      'Source type',
      'New (USD)',
      'Min (USD)',
      'Max (USD)',
      'Recommended (USD)',
      'Tag price (USD)',
      'Sale status',
    ]);
  });
});
