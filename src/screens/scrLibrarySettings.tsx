/**
 * Logosphere BITS — library settings screen (detail editor).
 *
 * Edits one shared library: code, name, type, founded date, the seven
 * geo address levels, extra description, postal code, building,
 * floor, apartment, and website. Each geo level offers the loaded
 * reference rows as a searchable list and accepts free text when the
 * list has no match; the selected reference code is stored separately
 * from the typed text, postal codes stay nullable and editable, and
 * missing town, street, or postal values stay null — never
 * fabricated. Only code and name are required; saving needs a demo
 * session and goes through the ready libraries service. Success shows
 * only after the server confirms; failures keep every input for
 * retry. Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrLibrarySettings); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDemoSession } from '../contexts/ctxDemoSession';
import { vwBrandHeader as VwBrandHeader } from '../components/vwBrandHeader';
import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwGeoField as VwGeoField } from '../components/vwGeoField';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwText as VwText } from '../components/vwText';
import { vwTextInput as VwTextInput } from '../components/vwTextInput';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import type { fldObjGeoNode } from '../services/srvDemoGeo';
import {
  fncConvFilterGeoNodesByQuery,
  srvApiGetGeoChildren,
  srvApiGetGeoRoots,
} from '../services/srvDemoGeo';
import {
  srvApiGetDemoLibraryDetails,
  srvApiSaveDemoLibraryDetails,
} from '../services/srvDemoLibraries';
import {
  fldArrGeoLevels,
  fldArrLibraryShortcutTypes,
  type fldStrGeoLevel,
  type fldStrLibraryShortcutType,
} from '../types/typModels';
import {
  colBackground,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import {
  vldChgIsLibraryShortcutType,
  vldChgIsTextPresent,
} from '../validation/vldDetails';

type scrLibrarySettingsProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrLibraryId: string;
  fldStrLibraryName: string;
};

type fldObjSettingsGeoField = {
  fldStrCode: string | null;
  fldStrText: string;
};

type fldObjSettingsForm = {
  fldStrCode: string;
  fldStrName: string;
  fldStrLibraryType: fldStrLibraryShortcutType | null;
  fldStrFoundedDate: string;
  fldObjGeo: Record<fldStrGeoLevel, fldObjSettingsGeoField>;
  fldStrExtraDescription: string;
  fldStrPostalCode: string;
  fldStrBuilding: string;
  fldStrFloor: string;
  fldStrApartment: string;
  fldStrWebsite: string;
};

type fldObjGeoLevelOptions = {
  fldStrParentId: string | null;
  fldArrRows: fldObjGeoNode[];
};

type fldStrSettingsTextField =
  | 'fldStrCode'
  | 'fldStrName'
  | 'fldStrFoundedDate'
  | 'fldStrExtraDescription'
  | 'fldStrPostalCode'
  | 'fldStrBuilding'
  | 'fldStrFloor'
  | 'fldStrApartment'
  | 'fldStrWebsite';

function fncConvBlankGeoField(): fldObjSettingsGeoField {
  return { fldStrCode: null, fldStrText: '' };
}

function fncConvBlankSettingsForm(
  fldStrLibraryName: string,
): fldObjSettingsForm {
  return {
    fldStrCode: '',
    fldStrName: fldStrLibraryName,
    fldStrLibraryType: null,
    fldStrFoundedDate: '',
    fldObjGeo: {
      country: fncConvBlankGeoField(),
      state: fncConvBlankGeoField(),
      city: fncConvBlankGeoField(),
      district: fncConvBlankGeoField(),
      town: fncConvBlankGeoField(),
      neighborhood: fncConvBlankGeoField(),
      street: fncConvBlankGeoField(),
    },
    fldStrExtraDescription: '',
    fldStrPostalCode: '',
    fldStrBuilding: '',
    fldStrFloor: '',
    fldStrApartment: '',
    fldStrWebsite: '',
  };
}

function fncConvBlankLevelOptions(): fldObjGeoLevelOptions {
  return { fldStrParentId: null, fldArrRows: [] };
}

export function scrLibrarySettings({
  fldObjStrings,
  fldStrLibraryId,
  fldStrLibraryName,
}: scrLibrarySettingsProps): React.JSX.Element {
  const [fldObjClient] = React.useState(srvApiGetDemoClient);
  const { fldObjSession } = useDemoSession();
  const [fldObjForm, actSetForm] = React.useState<fldObjSettingsForm>(() =>
    fncConvBlankSettingsForm(fldStrLibraryName),
  );
  const [fldObjGeoOptions, actSetGeoOptions] = React.useState<
    Record<fldStrGeoLevel, fldObjGeoLevelOptions>
  >(() => ({
    country: fncConvBlankLevelOptions(),
    state: fncConvBlankLevelOptions(),
    city: fncConvBlankLevelOptions(),
    district: fncConvBlankLevelOptions(),
    town: fncConvBlankLevelOptions(),
    neighborhood: fncConvBlankLevelOptions(),
    street: fncConvBlankLevelOptions(),
  }));
  const [fldBooDetailsLoading, actSetDetailsLoading] = React.useState(true);
  const [fldStrDetailsError, actSetDetailsError] = React.useState<
    string | null
  >(null);
  const [fldStrCodeError, actSetCodeError] = React.useState<string | undefined>(
    undefined,
  );
  const [fldStrNameError, actSetNameError] = React.useState<string | undefined>(
    undefined,
  );
  const [fldBooSaving, actSetSaving] = React.useState(false);
  const [fldStrSaveError, actSetSaveError] = React.useState<string | null>(
    null,
  );
  const [fldBooSaved, actSetSaved] = React.useState(false);

  const fldObjCopy = fldObjStrings.fldObjLibrarySettings;
  const fldObjBrandCopy = fldObjStrings.fldObjBrandHeader;
  const fldObjFooterCopy = fldObjStrings.fldObjDemoFooter;
  const fldObjShortcutCopy = fldObjStrings.fldObjLibraryShortcut;
  const fldObjGeoLabels: Record<fldStrGeoLevel, string> = {
    country: fldObjCopy.fldStrCountryLabel,
    state: fldObjCopy.fldStrStateLabel,
    city: fldObjCopy.fldStrCityLabel,
    district: fldObjCopy.fldStrDistrictLabel,
    town: fldObjCopy.fldStrTownLabel,
    neighborhood: fldObjCopy.fldStrNeighborhoodLabel,
    street: fldObjCopy.fldStrStreetLabel,
  };
  const fldObjTypeLabels: Record<fldStrLibraryShortcutType, string> = {
    Branch: fldObjShortcutCopy.fldStrTypeBranch,
    Department: fldObjShortcutCopy.fldStrTypeDepartment,
    Hall: fldObjShortcutCopy.fldStrTypeHall,
  };

  const fncRunLoadDetails = React.useCallback(() => {
    actSetDetailsLoading(true);
    actSetDetailsError(null);
    let fldBooCancelled = false;
    srvApiGetDemoLibraryDetails(fldObjClient, fldStrLibraryId).then(
      fldObjDetails => {
        if (fldBooCancelled) {
          return;
        }
        if (fldObjDetails === null) {
          actSetForm(fncConvBlankSettingsForm(fldStrLibraryName));
        } else {
          const fldObjParts = fldObjDetails.fldObjAddressParts;
          const fncConvGeoForm = (fldObjField: {
            fldStrCode: string | null;
            fldStrText: string | null;
          }): fldObjSettingsGeoField => ({
            fldStrCode: fldObjField.fldStrCode,
            fldStrText: fldObjField.fldStrText ?? '',
          });
          actSetForm({
            fldStrCode: fldObjDetails.fldStrCode ?? '',
            fldStrName: fldStrLibraryName,
            fldStrLibraryType: vldChgIsLibraryShortcutType(
              fldObjDetails.fldStrLibraryType,
            )
              ? fldObjDetails.fldStrLibraryType
              : null,
            fldStrFoundedDate: fldObjDetails.fldDatFoundedDate ?? '',
            fldObjGeo: {
              country: fncConvGeoForm(fldObjParts.fldObjCountry),
              state: fncConvGeoForm(fldObjParts.fldObjState),
              city: fncConvGeoForm(fldObjParts.fldObjCity),
              district: fncConvGeoForm(fldObjParts.fldObjDistrict),
              town: fncConvGeoForm(fldObjParts.fldObjTown),
              neighborhood: fncConvGeoForm(fldObjParts.fldObjNeighborhood),
              street: fncConvGeoForm(fldObjParts.fldObjStreet),
            },
            fldStrExtraDescription: fldObjParts.fldStrExtraDescription ?? '',
            fldStrPostalCode: fldObjParts.fldStrPostalCode ?? '',
            fldStrBuilding: fldObjParts.fldStrBuilding ?? '',
            fldStrFloor: fldObjParts.fldStrFloor ?? '',
            fldStrApartment: fldObjParts.fldStrApartment ?? '',
            fldStrWebsite: fldObjDetails.fldStrWebsite ?? '',
          });
        }
        actSetDetailsLoading(false);
      },
      (fldObjError: unknown) => {
        if (!fldBooCancelled) {
          actSetDetailsLoading(false);
          actSetDetailsError((fldObjError as Error).message);
        }
      },
    );
    return () => {
      fldBooCancelled = true;
    };
  }, [fldObjClient, fldStrLibraryId, fldStrLibraryName]);

  React.useEffect(() => fncRunLoadDetails(), [fncRunLoadDetails]);

  React.useEffect(() => {
    let fldBooCancelled = false;
    srvApiGetGeoRoots(fldObjClient).then(
      fldArrRows => {
        if (!fldBooCancelled) {
          actSetGeoOptions(fldObjPrevious => ({
            ...fldObjPrevious,
            country: { fldStrParentId: null, fldArrRows },
          }));
        }
      },
      () => {
        if (!fldBooCancelled) {
          actSetGeoOptions(fldObjPrevious => ({
            ...fldObjPrevious,
            country: fncConvBlankLevelOptions(),
          }));
        }
      },
    );
    return () => {
      fldBooCancelled = true;
    };
  }, [fldObjClient]);

  const fncRunClearFeedback = React.useCallback(() => {
    actSetSaveError(null);
    actSetSaved(false);
  }, []);

  const fncRunSetTextField =
    (fldStrField: fldStrSettingsTextField) => (fldStrValue: string) => {
      actSetForm(fldObjPrevious => ({
        ...fldObjPrevious,
        [fldStrField]: fldStrValue,
      }));
      fncRunClearFeedback();
      if (fldStrField === 'fldStrCode') {
        actSetCodeError(undefined);
      }
      if (fldStrField === 'fldStrName') {
        actSetNameError(undefined);
      }
    };

  const fncRunDescendantLevels = (fldStrLevel: fldStrGeoLevel) =>
    fldArrGeoLevels.slice(fldArrGeoLevels.indexOf(fldStrLevel) + 1);

  const fncRunSetGeoText =
    (fldStrLevel: fldStrGeoLevel) => (fldStrValue: string) => {
      const fldArrDescendants = fncRunDescendantLevels(fldStrLevel);
      fncRunClearFeedback();
      actSetForm(fldObjPrevious => {
        const fldObjGeo = { ...fldObjPrevious.fldObjGeo };
        fldObjGeo[fldStrLevel] = { fldStrCode: null, fldStrText: fldStrValue };
        for (const fldStrChild of fldArrDescendants) {
          fldObjGeo[fldStrChild] = fncConvBlankGeoField();
        }
        return { ...fldObjPrevious, fldObjGeo };
      });
      actSetGeoOptions(fldObjPrevious => {
        const fldObjNext = { ...fldObjPrevious };
        for (const fldStrChild of fldArrDescendants) {
          fldObjNext[fldStrChild] = fncConvBlankLevelOptions();
        }
        return fldObjNext;
      });
    };

  const fncRunSelectGeo =
    (fldStrLevel: fldStrGeoLevel) => (fldObjNode: fldObjGeoNode) => {
      const fldArrLevels = fldArrGeoLevels;
      const fldNumIndex = fldArrLevels.indexOf(fldStrLevel);
      const fldArrDescendants = fldArrLevels.slice(fldNumIndex + 1);
      const fldStrNext =
        fldNumIndex + 1 < fldArrLevels.length
          ? fldArrLevels[fldNumIndex + 1]
          : undefined;
      fncRunClearFeedback();
      actSetForm(fldObjPrevious => {
        const fldObjGeo = { ...fldObjPrevious.fldObjGeo };
        fldObjGeo[fldStrLevel] = {
          fldStrCode: fldObjNode.fldStrCode,
          fldStrText: fldObjNode.fldStrName,
        };
        for (const fldStrChild of fldArrDescendants) {
          fldObjGeo[fldStrChild] = fncConvBlankGeoField();
        }
        const fldStrPostal =
          fldObjPrevious.fldStrPostalCode === '' &&
          fldObjNode.fldStrPostalCode !== null &&
          fldObjNode.fldStrPostalCode.trim() !== ''
            ? fldObjNode.fldStrPostalCode
            : fldObjPrevious.fldStrPostalCode;
        return { ...fldObjPrevious, fldObjGeo, fldStrPostalCode: fldStrPostal };
      });
      actSetGeoOptions(fldObjPrevious => {
        const fldObjNext = { ...fldObjPrevious };
        for (const fldStrChild of fldArrDescendants) {
          fldObjNext[fldStrChild] = fncConvBlankLevelOptions();
        }
        if (fldStrNext !== undefined) {
          fldObjNext[fldStrNext] = {
            fldStrParentId: fldObjNode.fldStrId,
            fldArrRows: [],
          };
        }
        return fldObjNext;
      });
      if (fldStrNext === undefined) {
        return;
      }
      const fldStrParentId = fldObjNode.fldStrId;
      const fldStrChildLevel = fldStrNext;
      srvApiGetGeoChildren(fldObjClient, fldStrParentId).then(
        fldArrRows => {
          actSetGeoOptions(fldObjPrevious =>
            fldObjPrevious[fldStrChildLevel].fldStrParentId === fldStrParentId
              ? {
                  ...fldObjPrevious,
                  [fldStrChildLevel]: {
                    fldStrParentId,
                    fldArrRows,
                  },
                }
              : fldObjPrevious,
          );
        },
        () => {
          actSetGeoOptions(fldObjPrevious =>
            fldObjPrevious[fldStrChildLevel].fldStrParentId === fldStrParentId
              ? {
                  ...fldObjPrevious,
                  [fldStrChildLevel]: fncConvBlankLevelOptions(),
                }
              : fldObjPrevious,
          );
        },
      );
    };

  const fncRunSave = React.useCallback(() => {
    const fldBooCodeOk = vldChgIsTextPresent(fldObjForm.fldStrCode);
    const fldBooNameOk = vldChgIsTextPresent(fldObjForm.fldStrName);
    actSetCodeError(fldBooCodeOk ? undefined : fldObjCopy.fldStrCodeRequired);
    actSetNameError(fldBooNameOk ? undefined : fldObjCopy.fldStrNameRequired);
    actSetSaveError(null);
    actSetSaved(false);
    if (!fldBooCodeOk || !fldBooNameOk) {
      return;
    }
    actSetSaving(true);
    srvApiSaveDemoLibraryDetails(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      fldStrLibraryId,
      {
        fldStrCode: fldObjForm.fldStrCode,
        fldStrName: fldObjForm.fldStrName,
        fldStrLibraryType: fldObjForm.fldStrLibraryType,
        fldDatFoundedDate: fldObjForm.fldStrFoundedDate,
        fldStrAddress: null,
        fldObjAddressParts: {
          fldObjCountry: {
            fldStrCode: fldObjForm.fldObjGeo.country.fldStrCode,
            fldStrText: fldObjForm.fldObjGeo.country.fldStrText,
          },
          fldObjState: {
            fldStrCode: fldObjForm.fldObjGeo.state.fldStrCode,
            fldStrText: fldObjForm.fldObjGeo.state.fldStrText,
          },
          fldObjCity: {
            fldStrCode: fldObjForm.fldObjGeo.city.fldStrCode,
            fldStrText: fldObjForm.fldObjGeo.city.fldStrText,
          },
          fldObjDistrict: {
            fldStrCode: fldObjForm.fldObjGeo.district.fldStrCode,
            fldStrText: fldObjForm.fldObjGeo.district.fldStrText,
          },
          fldObjTown: {
            fldStrCode: fldObjForm.fldObjGeo.town.fldStrCode,
            fldStrText: fldObjForm.fldObjGeo.town.fldStrText,
          },
          fldObjNeighborhood: {
            fldStrCode: fldObjForm.fldObjGeo.neighborhood.fldStrCode,
            fldStrText: fldObjForm.fldObjGeo.neighborhood.fldStrText,
          },
          fldObjStreet: {
            fldStrCode: fldObjForm.fldObjGeo.street.fldStrCode,
            fldStrText: fldObjForm.fldObjGeo.street.fldStrText,
          },
          fldStrExtraDescription: fldObjForm.fldStrExtraDescription,
          fldStrPostalCode: fldObjForm.fldStrPostalCode,
          fldStrBuilding: fldObjForm.fldStrBuilding,
          fldStrFloor: fldObjForm.fldStrFloor,
          fldStrApartment: fldObjForm.fldStrApartment,
        },
        fldStrWebsite: fldObjForm.fldStrWebsite,
      },
    ).then(
      () => {
        actSetSaving(false);
        actSetSaved(true);
      },
      (fldObjError: unknown) => {
        actSetSaving(false);
        actSetSaveError((fldObjError as Error).message);
      },
    );
  }, [fldObjClient, fldObjSession, fldObjCopy, fldObjForm, fldStrLibraryId]);

  if (fldBooDetailsLoading) {
    return (
      <SafeAreaView style={scrLibrarySettingsStyles.fldObjContainer}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
        <View style={scrLibrarySettingsStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  if (fldStrDetailsError !== null) {
    return (
      <SafeAreaView style={scrLibrarySettingsStyles.fldObjContainer}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrErrorTitle}
          fldStrMessage={fldStrDetailsError}
        />
        <View style={scrLibrarySettingsStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoadDetails}
          />
        </View>
        <View style={scrLibrarySettingsStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrLibrarySettingsStyles.fldObjContainer}>
      <ScrollView style={scrLibrarySettingsStyles.fldObjScroll}>
        <View style={scrLibrarySettingsStyles.fldObjGap}>
          <VwBrandHeader
            fldStrName={fldObjBrandCopy.fldStrName}
            fldStrSuffix={fldObjBrandCopy.fldStrSuffix}
          />
        </View>
        <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
        <View style={scrLibrarySettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">{fldObjCopy.fldStrCodeLabel}</VwText>
          <View style={scrLibrarySettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrCode}
              actHandOnChange={fncRunSetTextField('fldStrCode')}
              fldStrError={fldStrCodeError}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrLibrarySettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">{fldObjCopy.fldStrNameLabel}</VwText>
          <View style={scrLibrarySettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrName}
              actHandOnChange={fncRunSetTextField('fldStrName')}
              fldStrError={fldStrNameError}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrLibrarySettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">{fldObjCopy.fldStrTypeLabel}</VwText>
          {fldArrLibraryShortcutTypes.map(fldStrType => {
            const fldStrLabel = fldObjTypeLabels[fldStrType];
            return (
              <View key={fldStrType} style={scrLibrarySettingsStyles.fldObjGap}>
                <VwButton
                  fldStrLabel={
                    fldObjForm.fldStrLibraryType === fldStrType
                      ? `${fldStrLabel} — ${fldObjShortcutCopy.fldStrSelected}`
                      : fldStrLabel
                  }
                  fldBooDisabled={fldBooSaving}
                  actHandOnPress={() => {
                    actSetForm(fldObjPrevious => ({
                      ...fldObjPrevious,
                      fldStrLibraryType: fldStrType,
                    }));
                    fncRunClearFeedback();
                  }}
                />
              </View>
            );
          })}
        </View>
        <View style={scrLibrarySettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">
            {fldObjCopy.fldStrFoundedDateLabel}
          </VwText>
          <View style={scrLibrarySettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrFoundedDate}
              actHandOnChange={fncRunSetTextField('fldStrFoundedDate')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        {fldArrGeoLevels.map(fldStrLevel => (
          <View key={fldStrLevel} style={scrLibrarySettingsStyles.fldObjField}>
            <VwGeoField
              fldStrLabel={fldObjGeoLabels[fldStrLevel]}
              fldStrText={fldObjForm.fldObjGeo[fldStrLevel].fldStrText}
              actHandOnText={fncRunSetGeoText(fldStrLevel)}
              fldStrSearchPlaceholder={fldObjCopy.fldStrSearchPlaceholder}
              fldArrOptions={fncConvFilterGeoNodesByQuery(
                fldObjGeoOptions[fldStrLevel].fldArrRows,
                fldObjForm.fldObjGeo[fldStrLevel].fldStrText,
              )}
              actHandOnSelect={fncRunSelectGeo(fldStrLevel)}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        ))}
        <View style={scrLibrarySettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">
            {fldObjCopy.fldStrExtraDescriptionLabel}
          </VwText>
          <View style={scrLibrarySettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrExtraDescription}
              actHandOnChange={fncRunSetTextField('fldStrExtraDescription')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrLibrarySettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">
            {fldObjCopy.fldStrPostalCodeLabel}
          </VwText>
          <View style={scrLibrarySettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrPostalCode}
              actHandOnChange={fncRunSetTextField('fldStrPostalCode')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrLibrarySettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">
            {fldObjCopy.fldStrBuildingLabel}
          </VwText>
          <View style={scrLibrarySettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrBuilding}
              actHandOnChange={fncRunSetTextField('fldStrBuilding')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrLibrarySettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">{fldObjCopy.fldStrFloorLabel}</VwText>
          <View style={scrLibrarySettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrFloor}
              actHandOnChange={fncRunSetTextField('fldStrFloor')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrLibrarySettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">
            {fldObjCopy.fldStrApartmentLabel}
          </VwText>
          <View style={scrLibrarySettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrApartment}
              actHandOnChange={fncRunSetTextField('fldStrApartment')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrLibrarySettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">
            {fldObjCopy.fldStrWebsiteLabel}
          </VwText>
          <View style={scrLibrarySettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrWebsite}
              actHandOnChange={fncRunSetTextField('fldStrWebsite')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        {fldStrSaveError !== null && (
          <View style={scrLibrarySettingsStyles.fldObjField}>
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrSaveErrorTitle}
              fldStrMessage={fldStrSaveError}
            />
          </View>
        )}
        {fldBooSaved && (
          <View style={scrLibrarySettingsStyles.fldObjField}>
            <VwEmptyState fldStrTitle={fldObjCopy.fldStrSavedMessage} />
          </View>
        )}
        <View style={scrLibrarySettingsStyles.fldObjField}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrSave}
            fldBooLoading={fldBooSaving}
            actHandOnPress={fncRunSave}
          />
        </View>
      </ScrollView>
      <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
    </SafeAreaView>
  );
}

const scrLibrarySettingsStyles = StyleSheet.create({
  fldObjContainer: {
    flex: 1,
    backgroundColor: colBackground,
    padding: fldNumSpacingMd,
  },
  fldObjScroll: {
    flex: 1,
  },
  fldObjFoot: {
    marginTop: 'auto',
  },
  fldObjField: {
    marginTop: fldNumSpacingLg,
  },
  fldObjGap: {
    marginTop: fldNumSpacingSm,
  },
});
