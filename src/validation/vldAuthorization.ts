/**
 * Logosphere BITS — authorization evaluation (no DB, no IO).
 *
 * Closed world: presence of an (action, scope) cell grants, absence
 * denies. Vocabulary is closed by the database CHECK constraints
 * (migration 20261030055710): 7 actions over 3 scopes. Real accounts
 * resolve through memberships joined to the role matrix (mirroring
 * the real_effective_permissions view, union across organizations).
 * Demo resolves ONLY through server-provided demo_permissions cells:
 * the demo check takes no persona parameter, so the selected persona
 * type can never widen or narrow demo rights.
 *
 * Error decision table for callers: check vldChgIsAuthorizationError
 * first (re-login / renew the demo session, do not blindly retry),
 * then vldChgIsNetworkError (safe to retry), otherwise surface the
 * failure as-is. Both return false for anything else.
 * Naming follows D6 "Programcı İsimlendirmeleri" (fld / vld / fnc roots).
 */

export type fldStrPermissionAction =
  | 'view'
  | 'create'
  | 'delete'
  | 'sell_toggle'
  | 'price'
  | 'buy'
  | 'sell';

export type fldStrPermissionScope = 'item' | 'collection' | 'library';

export type fldObjPermissionCell = {
  fldStrAction: fldStrPermissionAction;
  fldStrScope: fldStrPermissionScope;
};

export type fldObjRolePermissionCell = {
  fldStrRoleCode: string;
  fldStrAction: fldStrPermissionAction;
  fldStrScope: fldStrPermissionScope;
};

export type fldObjMembershipLink = {
  fldStrProfileId: string;
  fldStrRoleCode: string;
};

type fldObjErrorShape = {
  fldStrMessage: string;
  fldStrCode: string;
  fldStrName: string;
  fldNumStatus: number | null;
};

const fldArrAuthorizationMarkers = [
  'demo operation not permitted',
  'demo session invalid',
  'demo session expired',
  'demo session revoked',
  'not permitted',
  'permission denied',
  'unauthorized',
  'jwt expired',
  'invalid jwt',
];

const fldArrNetworkCodes = [
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNABORTED',
  'EPIPE',
  'EAI_AGAIN',
];

const fldArrNetworkMarkers = [
  'network request failed',
  'failed to fetch',
  'network error',
  'load failed',
  'socket hang up',
  'host not found',
  'econn',
  'enotfound',
  'etimedout',
  'dns',
];

const fldArrTimeoutMarkers = ['timeout', 'timed out'];

function fncConvReadErrorShape(fldObjError: unknown): fldObjErrorShape {
  if (typeof fldObjError === 'string') {
    return {
      fldStrMessage: fldObjError,
      fldStrCode: '',
      fldStrName: '',
      fldNumStatus: null,
    };
  }
  if (typeof fldObjError !== 'object' || fldObjError === null) {
    return {
      fldStrMessage: '',
      fldStrCode: '',
      fldStrName: '',
      fldNumStatus: null,
    };
  }
  const fldObjFields = fldObjError as Record<string, unknown>;
  const fldStrMessage =
    typeof fldObjFields.message === 'string' ? fldObjFields.message : '';
  const fldStrCode =
    typeof fldObjFields.code === 'string' ? fldObjFields.code : '';
  const fldStrName =
    typeof fldObjFields.name === 'string' ? fldObjFields.name : '';
  const fldObjStatus = fldObjFields.status ?? fldObjFields.statusCode;
  return {
    fldStrMessage,
    fldStrCode,
    fldStrName,
    fldNumStatus: typeof fldObjStatus === 'number' ? fldObjStatus : null,
  };
}

const fldArrPermissionActions: fldStrPermissionAction[] = [
  'view',
  'create',
  'delete',
  'sell_toggle',
  'price',
  'buy',
  'sell',
];

const fldArrPermissionScopes: fldStrPermissionScope[] = [
  'item',
  'collection',
  'library',
];

export function vldChgIsPermissionAction(
  fldStrValue: string,
): fldStrValue is fldStrPermissionAction {
  return (fldArrPermissionActions as string[]).includes(fldStrValue);
}

export function vldChgIsPermissionScope(
  fldStrValue: string,
): fldStrValue is fldStrPermissionScope {
  return (fldArrPermissionScopes as string[]).includes(fldStrValue);
}

export function vldChgIsCellGranted(
  fldArrCells: fldObjPermissionCell[],
  fldStrAction: fldStrPermissionAction,
  fldStrScope: fldStrPermissionScope,
): boolean {
  return fldArrCells.some(
    fldObjCell =>
      fldObjCell.fldStrAction === fldStrAction &&
      fldObjCell.fldStrScope === fldStrScope,
  );
}

export function vldChgIsDemoPermitted(
  fldArrDemoCells: fldObjPermissionCell[],
  fldStrAction: fldStrPermissionAction,
  fldStrScope: fldStrPermissionScope,
): boolean {
  return vldChgIsCellGranted(fldArrDemoCells, fldStrAction, fldStrScope);
}

export function vldChgCanProfileAct(
  fldArrMemberships: fldObjMembershipLink[],
  fldArrMatrix: fldObjRolePermissionCell[],
  fldStrProfileId: string,
  fldStrAction: fldStrPermissionAction,
  fldStrScope: fldStrPermissionScope,
): boolean {
  const fldArrRoleCodes = fldArrMemberships
    .filter(fldObjLink => fldObjLink.fldStrProfileId === fldStrProfileId)
    .map(fldObjLink => fldObjLink.fldStrRoleCode);
  if (fldArrRoleCodes.length === 0) {
    return false;
  }
  return fldArrMatrix.some(
    fldObjCell =>
      fldArrRoleCodes.includes(fldObjCell.fldStrRoleCode) &&
      fldObjCell.fldStrAction === fldStrAction &&
      fldObjCell.fldStrScope === fldStrScope,
  );
}

export function vldChgIsAuthorizationError(fldObjError: unknown): boolean {
  const fldObjShape = fncConvReadErrorShape(fldObjError);
  if (fldObjShape.fldNumStatus === 401 || fldObjShape.fldNumStatus === 403) {
    return true;
  }
  if (fldObjShape.fldStrCode === '42501') {
    return true;
  }
  const fldStrLower = fldObjShape.fldStrMessage.toLowerCase();
  return fldArrAuthorizationMarkers.some(fldStrMarker =>
    fldStrLower.includes(fldStrMarker),
  );
}

export function vldChgIsNetworkError(fldObjError: unknown): boolean {
  const fldObjShape = fncConvReadErrorShape(fldObjError);
  if (fldObjShape.fldStrName === 'AbortError') {
    return true;
  }
  if (fldArrNetworkCodes.includes(fldObjShape.fldStrCode)) {
    return true;
  }
  const fldStrLower = fldObjShape.fldStrMessage.toLowerCase();
  if (
    fldArrNetworkMarkers.some(fldStrMarker =>
      fldStrLower.includes(fldStrMarker),
    )
  ) {
    return true;
  }
  if (fldStrLower.includes('session')) {
    return false;
  }
  return fldArrTimeoutMarkers.some(fldStrMarker =>
    fldStrLower.includes(fldStrMarker),
  );
}
