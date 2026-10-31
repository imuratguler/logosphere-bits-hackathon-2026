/**
 * Logosphere BITS — geo reference field tests (maintained).
 *
 * Renders the real presentational block with react-test-renderer:
 * no providers, no network. Option rows are public, non-secret
 * reference data shaped like geo_nodes.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { vwButton } from '../src/components/vwButton';
import { vwGeoField } from '../src/components/vwGeoField';
import { vwText } from '../src/components/vwText';
import { vwTextInput } from '../src/components/vwTextInput';
import type { fldObjGeoNode } from '../src/services/srvDemoGeo';

function fncConvSeedOptions(): fldObjGeoNode[] {
  return [
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
  ];
}

async function fncRunRenderField(
  fldObjOverrides: Partial<React.ComponentProps<typeof vwGeoField>> = {},
) {
  const fldObjProps = {
    fldStrLabel: 'Country',
    fldStrText: '',
    actHandOnText: () => undefined,
    fldStrSearchPlaceholder: 'Search or type…',
    fldArrOptions: fncConvSeedOptions(),
    actHandOnSelect: () => undefined,
    ...fldObjOverrides,
  };
  let fldObjRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjRenderer = ReactTestRenderer.create(
      React.createElement(vwGeoField, fldObjProps),
    );
  });
  if (fldObjRenderer === undefined) {
    throw new Error('Logosphere BITS: geo field was not rendered.');
  }
  return fldObjRenderer;
}

describe('geo reference field', () => {
  it('renders the label, text, and option rows', async () => {
    const fldObjRenderer = await fncRunRenderField({ fldStrText: 'Tur' });

    const fldArrTexts = fldObjRenderer.root
      .findAllByType(vwText)
      .map(fldObjNode => fldObjNode.props.children);
    expect(fldArrTexts).toContain('Country');
    expect(fldObjRenderer.root.findByType(vwTextInput).props.fldStrValue).toBe(
      'Tur',
    );
    const fldArrLabels = fldObjRenderer.root
      .findAllByType(vwButton)
      .map(fldObjButton => fldObjButton.props.fldStrLabel);
    expect(fldArrLabels).toEqual(['Türkiye', 'Germany']);

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('reports text changes and selections', async () => {
    const fldObjOnText = jest.fn();
    const fldObjOnSelect = jest.fn();
    const fldObjRenderer = await fncRunRenderField({
      actHandOnText: fldObjOnText,
      actHandOnSelect: fldObjOnSelect,
    });

    await ReactTestRenderer.act(async () => {
      fldObjRenderer.root.findByType(vwTextInput).props.actHandOnChange('Tur');
    });
    expect(fldObjOnText).toHaveBeenCalledWith('Tur');

    await ReactTestRenderer.act(async () => {
      const fldObjButton = fldObjRenderer.root
        .findAllByType(vwButton)
        .find(fldObjNode => fldObjNode.props.fldStrLabel === 'Türkiye');
      if (fldObjButton === undefined) {
        throw new Error('Logosphere BITS: option row was not rendered.');
      }
      fldObjButton.props.actHandOnPress();
    });
    expect(fldObjOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({ fldStrCode: 'TR' }),
    );

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });

  it('renders no rows without options', async () => {
    const fldObjRenderer = await fncRunRenderField({ fldArrOptions: [] });

    expect(fldObjRenderer.root.findAllByType(vwButton)).toHaveLength(0);
    expect(fldObjRenderer.root.findByType(vwTextInput)).toBeDefined();

    ReactTestRenderer.act(() => {
      fldObjRenderer.unmount();
    });
  });
});
