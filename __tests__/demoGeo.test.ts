/**
 * Logosphere BITS — geo reference service tests (maintained).
 *
 * The Supabase client is fake, so no network is touched. Seed rows
 * are public, non-secret reference data shaped like geo_nodes.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { fldObjGeoNode } from '../src/services/srvDemoGeo';
import {
  fncConvFilterGeoNodesByQuery,
  srvApiGetGeoChildren,
  srvApiGetGeoRoots,
} from '../src/services/srvDemoGeo';

function fncConvFakeClient(fldObjResult: { data: unknown; error: unknown }) {
  const fldObjBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (
      fldObjResolve: (fldObjValue: unknown) => void,
      fldObjReject: (fldObjReason?: unknown) => void,
    ) => Promise.resolve(fldObjResult).then(fldObjResolve, fldObjReject),
  };
  const fldObjFrom = jest.fn().mockReturnValue(fldObjBuilder);
  return {
    fldObjClient: { from: fldObjFrom } as unknown as SupabaseClient,
    fldObjFrom,
    fldObjBuilder,
  };
}

function fncConvSeedNode(fldObjOverrides: Record<string, unknown> = {}) {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    code: 'TR',
    name: 'Türkiye',
    level: 'country',
    parent_id: null,
    postal_code: null,
    ...fldObjOverrides,
  };
}

describe('geo reference roots', () => {
  it('returns country roots in name order', async () => {
    const fldObjFake = fncConvFakeClient({
      data: [
        fncConvSeedNode(),
        fncConvSeedNode({
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          code: 'DE',
          name: 'Germany',
        }),
      ],
      error: null,
    });

    const fldArrRows = await srvApiGetGeoRoots(fldObjFake.fldObjClient);

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('geo_nodes');
    expect(fldObjFake.fldObjBuilder.is).toHaveBeenCalledWith('parent_id', null);
    expect(fldObjFake.fldObjBuilder.eq).toHaveBeenCalledWith(
      'level',
      'country',
    );
    expect(fldObjFake.fldObjBuilder.order).toHaveBeenCalledWith('name', {
      ascending: true,
    });
    expect(fldArrRows).toEqual([
      {
        fldStrId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        fldStrCode: 'TR',
        fldStrName: 'Türkiye',
        fldStrLevel: 'country',
        fldStrParentId: null,
        fldStrPostalCode: null,
      },
      {
        fldStrId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        fldStrCode: 'DE',
        fldStrName: 'Germany',
        fldStrLevel: 'country',
        fldStrParentId: null,
        fldStrPostalCode: null,
      },
    ]);
  });

  it('surfaces read errors naming the table', async () => {
    const fldObjFake = fncConvFakeClient({
      data: null,
      error: { message: 'demo db down' },
    });

    await expect(srvApiGetGeoRoots(fldObjFake.fldObjClient)).rejects.toThrow(
      'geo_nodes read failed: demo db down',
    );
  });

  it('rejects malformed rows', async () => {
    const fldObjFake = fncConvFakeClient({
      data: [{ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Türkiye' }],
      error: null,
    });

    await expect(srvApiGetGeoRoots(fldObjFake.fldObjClient)).rejects.toThrow(
      'need id + code + name + level',
    );
  });
});

describe('geo reference children', () => {
  it('returns children of one parent', async () => {
    const fldStrParentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const fldObjFake = fncConvFakeClient({
      data: [
        fncConvSeedNode({
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          code: 'TR-34',
          name: 'Istanbul',
          level: 'state',
          parent_id: fldStrParentId,
        }),
      ],
      error: null,
    });

    const fldArrRows = await srvApiGetGeoChildren(
      fldObjFake.fldObjClient,
      fldStrParentId,
    );

    expect(fldObjFake.fldObjFrom).toHaveBeenCalledWith('geo_nodes');
    expect(fldObjFake.fldObjBuilder.eq).toHaveBeenCalledWith(
      'parent_id',
      fldStrParentId,
    );
    expect(fldArrRows).toHaveLength(1);
    expect(fldArrRows[0]?.fldStrCode).toBe('TR-34');
  });

  it('rejects a blank parent id before any call', async () => {
    const fldObjFake = fncConvFakeClient({ data: [], error: null });

    await expect(
      srvApiGetGeoChildren(fldObjFake.fldObjClient, '  '),
    ).rejects.toThrow('geo parent ID is missing or blank');
    expect(fldObjFake.fldObjFrom).not.toHaveBeenCalled();
  });
});

describe('geo reference search filter', () => {
  function fncConvRows(): fldObjGeoNode[] {
    return [
      {
        fldStrId: '1',
        fldStrCode: 'TR-35',
        fldStrName: 'İzmir',
        fldStrLevel: 'state',
        fldStrParentId: 'TR',
        fldStrPostalCode: null,
      },
      {
        fldStrId: '2',
        fldStrCode: 'TR-34',
        fldStrName: 'Istanbul',
        fldStrLevel: 'state',
        fldStrParentId: 'TR',
        fldStrPostalCode: null,
      },
      {
        fldStrId: '3',
        fldStrCode: 'TR-63',
        fldStrName: 'Şanlıurfa',
        fldStrLevel: 'state',
        fldStrParentId: 'TR',
        fldStrPostalCode: null,
      },
      {
        fldStrId: '4',
        fldStrCode: 'TR-21',
        fldStrName: 'Diyarbakır',
        fldStrLevel: 'state',
        fldStrParentId: 'TR',
        fldStrPostalCode: null,
      },
    ];
  }

  it('returns the first rows for a blank query', () => {
    const fldArrRows = Array.from({ length: 12 }, (_, fldNumIndex) => ({
      fldStrId: `id-${fldNumIndex}`,
      fldStrCode: `C-${fldNumIndex}`,
      fldStrName: `Name ${fldNumIndex}`,
      fldStrLevel: 'state',
      fldStrParentId: 'TR',
      fldStrPostalCode: null,
    }));

    expect(fncConvFilterGeoNodesByQuery(fldArrRows, '  ')).toHaveLength(10);
  });

  it('matches across case and Turkish folding', () => {
    const fldArrRows = fncConvRows();

    expect(
      fncConvFilterGeoNodesByQuery(fldArrRows, 'izmir').map(
        fldObjRow => fldObjRow.fldStrCode,
      ),
    ).toEqual(['TR-35']);
    expect(
      fncConvFilterGeoNodesByQuery(fldArrRows, 'ISTANBUL').map(
        fldObjRow => fldObjRow.fldStrCode,
      ),
    ).toEqual(['TR-34']);
    expect(
      fncConvFilterGeoNodesByQuery(fldArrRows, 'sanliurfa').map(
        fldObjRow => fldObjRow.fldStrCode,
      ),
    ).toEqual(['TR-63']);
    expect(
      fncConvFilterGeoNodesByQuery(fldArrRows, 'diyarbakir').map(
        fldObjRow => fldObjRow.fldStrCode,
      ),
    ).toEqual(['TR-21']);
  });

  it('returns nothing without a match', () => {
    expect(fncConvFilterGeoNodesByQuery(fncConvRows(), 'Ankara')).toEqual([]);
  });
});
