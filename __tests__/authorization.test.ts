/**
 * Logosphere BITS — authorization evaluation tests (pure, no mocks).
 *
 * Cell fixtures follow the seeded doctrine in migration 20261030055710:
 * account_manager holds all 21 cells, authorized holds
 * view/create/sell_toggle/price, signatory holds view/buy/sell, and
 * demo_permissions seeds the full 21-cell sandbox.
 */

import type {
  fldObjMembershipLink,
  fldObjPermissionCell,
  fldObjRolePermissionCell,
  fldStrPermissionAction,
  fldStrPermissionScope,
} from '../src/validation/vldAuthorization';
import {
  vldChgCanProfileAct,
  vldChgIsAuthorizationError,
  vldChgIsCellGranted,
  vldChgIsDemoPermitted,
  vldChgIsNetworkError,
  vldChgIsPermissionAction,
  vldChgIsPermissionScope,
} from '../src/validation/vldAuthorization';

const fldArrActions: fldStrPermissionAction[] = [
  'view',
  'create',
  'delete',
  'sell_toggle',
  'price',
  'buy',
  'sell',
];

const fldArrScopes: fldStrPermissionScope[] = ['item', 'collection', 'library'];

function fncConvFullSandbox(): fldObjPermissionCell[] {
  const fldArrCells: fldObjPermissionCell[] = [];
  for (const fldStrAction of fldArrActions) {
    for (const fldStrScope of fldArrScopes) {
      fldArrCells.push({ fldStrAction, fldStrScope });
    }
  }
  return fldArrCells;
}

function fncConvRoleCells(
  fldStrRoleCode: string,
  fldArrAllowed: fldStrPermissionAction[],
): fldObjRolePermissionCell[] {
  const fldArrCells: fldObjRolePermissionCell[] = [];
  for (const fldStrAction of fldArrAllowed) {
    for (const fldStrScope of fldArrScopes) {
      fldArrCells.push({ fldStrRoleCode, fldStrAction, fldStrScope });
    }
  }
  return fldArrCells;
}

const fldArrDoctrineMatrix: fldObjRolePermissionCell[] = [
  ...fncConvRoleCells('account_manager', fldArrActions),
  ...fncConvRoleCells('authorized', ['view', 'create', 'sell_toggle', 'price']),
  ...fncConvRoleCells('signatory', ['view', 'buy', 'sell']),
];

function fncConvMembership(
  fldStrProfileId: string,
  fldStrRoleCode: string,
): fldObjMembershipLink {
  return { fldStrProfileId, fldStrRoleCode };
}

describe('authorization evaluation', () => {
  it('grants a present cell and denies an absent one', () => {
    const fldArrCells: fldObjPermissionCell[] = [
      { fldStrAction: 'create', fldStrScope: 'item' },
    ];

    expect(vldChgIsCellGranted(fldArrCells, 'create', 'item')).toBe(true);
    expect(vldChgIsCellGranted(fldArrCells, 'create', 'library')).toBe(false);
    expect(vldChgIsCellGranted(fldArrCells, 'delete', 'item')).toBe(false);
    expect(vldChgIsCellGranted([], 'view', 'item')).toBe(false);
  });

  it('permits the full demo sandbox without any persona input', () => {
    const fldArrDemo = fncConvFullSandbox();

    expect(vldChgIsDemoPermitted.length).toBe(3);
    expect(vldChgIsDemoPermitted(fldArrDemo, 'create', 'collection')).toBe(
      true,
    );
    expect(vldChgIsDemoPermitted(fldArrDemo, 'sell', 'item')).toBe(true);
    expect(vldChgIsDemoPermitted(fldArrDemo, 'delete', 'library')).toBe(true);
    expect(vldChgIsDemoPermitted([], 'view', 'item')).toBe(false);
    expect(vldChgIsDemoPermitted(fldArrDemo, 'price', 'item')).toBe(
      vldChgIsDemoPermitted(fldArrDemo, 'price', 'item'),
    );
  });

  it('evaluates the authorized role by the seeded doctrine', () => {
    const fldArrMemberships = [fncConvMembership('profile-1', 'authorized')];

    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-1',
        'create',
        'item',
      ),
    ).toBe(true);
    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-1',
        'price',
        'collection',
      ),
    ).toBe(true);
    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-1',
        'delete',
        'item',
      ),
    ).toBe(false);
    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-1',
        'sell',
        'item',
      ),
    ).toBe(false);
  });

  it('evaluates the signatory and manager roles by the doctrine', () => {
    const fldArrMemberships = [
      fncConvMembership('profile-sign', 'signatory'),
      fncConvMembership('profile-mgr', 'account_manager'),
    ];

    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-sign',
        'sell',
        'item',
      ),
    ).toBe(true);
    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-sign',
        'create',
        'item',
      ),
    ).toBe(false);
    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-mgr',
        'delete',
        'library',
      ),
    ).toBe(true);
  });

  it('denies unknown profiles, roles, and vocabulary', () => {
    const fldArrMemberships = [
      fncConvMembership('profile-1', 'authorized'),
      fncConvMembership('profile-ghost', 'no-such-role'),
    ];
    const fldStrUnknownAction = 'launch' as unknown as fldStrPermissionAction;
    const fldStrUnknownScope = 'planet' as unknown as fldStrPermissionScope;

    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-unknown',
        'view',
        'item',
      ),
    ).toBe(false);
    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-ghost',
        'view',
        'item',
      ),
    ).toBe(false);
    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-1',
        fldStrUnknownAction,
        'item',
      ),
    ).toBe(false);
    expect(
      vldChgIsDemoPermitted(fncConvFullSandbox(), 'view', fldStrUnknownScope),
    ).toBe(false);
  });

  it('unions roles across several memberships', () => {
    const fldArrMemberships = [
      fncConvMembership('profile-both', 'authorized'),
      fncConvMembership('profile-both', 'signatory'),
    ];

    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-both',
        'create',
        'item',
      ),
    ).toBe(true);
    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-both',
        'sell',
        'item',
      ),
    ).toBe(true);
    expect(
      vldChgCanProfileAct(
        fldArrMemberships,
        fldArrDoctrineMatrix,
        'profile-both',
        'delete',
        'item',
      ),
    ).toBe(false);
  });

  it.each([
    {
      fldStrName: 'demo not permitted',
      fldObjError: new Error('demo operation not permitted: sell on item'),
      fldBooAuth: true,
      fldBooNetwork: false,
    },
    {
      fldStrName: 'demo session expired',
      fldObjError: { message: 'demo session expired' },
      fldBooAuth: true,
      fldBooNetwork: false,
    },
    {
      fldStrName: 'demo session invalid',
      fldObjError: 'demo session invalid',
      fldBooAuth: true,
      fldBooNetwork: false,
    },
    {
      fldStrName: 'demo session revoked',
      fldObjError: { message: 'demo session revoked', code: 'P0001' },
      fldBooAuth: true,
      fldBooNetwork: false,
    },
    {
      fldStrName: 'http 401',
      fldObjError: { message: 'invalid claim', status: 401 },
      fldBooAuth: true,
      fldBooNetwork: false,
    },
    {
      fldStrName: 'http 403',
      fldObjError: { message: 'forbidden', statusCode: 403 },
      fldBooAuth: true,
      fldBooNetwork: false,
    },
    {
      fldStrName: 'postgres privilege',
      fldObjError: { message: 'permission denied', code: '42501' },
      fldBooAuth: true,
      fldBooNetwork: false,
    },
    {
      fldStrName: 'jwt expired',
      fldObjError: new Error('JWT expired'),
      fldBooAuth: true,
      fldBooNetwork: false,
    },
    {
      fldStrName: 'rn fetch failure',
      fldObjError: new TypeError('Network request failed'),
      fldBooAuth: false,
      fldBooNetwork: true,
    },
    {
      fldStrName: 'web fetch failure',
      fldObjError: new TypeError('Failed to fetch'),
      fldBooAuth: false,
      fldBooNetwork: true,
    },
    {
      fldStrName: 'ios load failure',
      fldObjError: new TypeError('Load failed'),
      fldBooAuth: false,
      fldBooNetwork: true,
    },
    {
      fldStrName: 'abort',
      fldObjError: { name: 'AbortError', message: 'Aborted' },
      fldBooAuth: false,
      fldBooNetwork: true,
    },
    {
      fldStrName: 'refused socket',
      fldObjError: { code: 'ECONNREFUSED', message: 'connect refused' },
      fldBooAuth: false,
      fldBooNetwork: true,
    },
    {
      fldStrName: 'dns failure',
      fldObjError: { message: 'getaddrinfo ENOTFOUND api.example' },
      fldBooAuth: false,
      fldBooNetwork: true,
    },
    {
      fldStrName: 'plain timeout',
      fldObjError: new Error('request timeout'),
      fldBooAuth: false,
      fldBooNetwork: true,
    },
    {
      fldStrName: 'unknown persona is neither',
      fldObjError: new Error('unknown demo persona'),
      fldBooAuth: false,
      fldBooNetwork: false,
    },
    {
      fldStrName: 'session timeout is neither',
      fldObjError: new Error('session timeout'),
      fldBooAuth: false,
      fldBooNetwork: false,
    },
    {
      fldStrName: 'plain failure is neither',
      fldObjError: new Error('boom'),
      fldBooAuth: false,
      fldBooNetwork: false,
    },
    {
      fldStrName: 'null is neither',
      fldObjError: null,
      fldBooAuth: false,
      fldBooNetwork: false,
    },
    {
      fldStrName: 'empty object is neither',
      fldObjError: {},
      fldBooAuth: false,
      fldBooNetwork: false,
    },
  ])('classifies $fldStrName', ({ fldObjError, fldBooAuth, fldBooNetwork }) => {
    expect(vldChgIsAuthorizationError(fldObjError)).toBe(fldBooAuth);
    expect(vldChgIsNetworkError(fldObjError)).toBe(fldBooNetwork);
  });

  it('closes the action and scope vocabularies', () => {
    for (const fldStrAction of [
      'view',
      'create',
      'delete',
      'sell_toggle',
      'price',
      'buy',
      'sell',
    ]) {
      expect(vldChgIsPermissionAction(fldStrAction)).toBe(true);
    }
    for (const fldStrScope of ['item', 'collection', 'library']) {
      expect(vldChgIsPermissionScope(fldStrScope)).toBe(true);
    }
    expect(vldChgIsPermissionAction('launch')).toBe(false);
    expect(vldChgIsPermissionAction('')).toBe(false);
    expect(vldChgIsPermissionAction('View')).toBe(false);
    expect(vldChgIsPermissionScope('planet')).toBe(false);
    expect(vldChgIsPermissionScope('')).toBe(false);
    expect(vldChgIsPermissionScope('Item')).toBe(false);
  });
});
