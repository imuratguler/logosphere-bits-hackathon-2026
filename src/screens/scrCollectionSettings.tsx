/**
 * Logosphere BITS — collection settings screen (detail editor).
 *
 * Edits one shared collection: name, formed date, hall/room,
 * cabinet face, block, row, shelf, and website. Only the name is
 * required; the formed date accepts blank or a real YYYY-MM-DD day
 * and every other field stays free text. Saving needs a demo session
 * and goes through the ready collections service. Success shows only
 * after the server confirms; failures keep every input for retry.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrCollectionSettings); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDemoSession } from '../contexts/ctxDemoSession';
import { vwBrandHeader as VwBrandHeader } from '../components/vwBrandHeader';
import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwText as VwText } from '../components/vwText';
import { vwTextInput as VwTextInput } from '../components/vwTextInput';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import {
  srvApiGetDemoCollectionDetails,
  srvApiSaveDemoCollectionDetails,
} from '../services/srvDemoCollections';
import {
  colBackground,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import {
  vldChgIsIsoDateOrBlank,
  vldChgIsTextPresent,
} from '../validation/vldDetails';

type scrCollectionSettingsProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrCollectionId: string;
  fldStrCollectionName: string;
};

type fldObjSettingsForm = {
  fldStrName: string;
  fldStrFormedDate: string;
  fldStrHallRoom: string;
  fldStrCabinetFace: string;
  fldStrBlock: string;
  fldStrRow: string;
  fldStrShelf: string;
  fldStrWebsite: string;
};

type fldStrSettingsTextField =
  | 'fldStrName'
  | 'fldStrFormedDate'
  | 'fldStrHallRoom'
  | 'fldStrCabinetFace'
  | 'fldStrBlock'
  | 'fldStrRow'
  | 'fldStrShelf'
  | 'fldStrWebsite';

function fncConvBlankSettingsForm(
  fldStrCollectionName: string,
): fldObjSettingsForm {
  return {
    fldStrName: fldStrCollectionName,
    fldStrFormedDate: '',
    fldStrHallRoom: '',
    fldStrCabinetFace: '',
    fldStrBlock: '',
    fldStrRow: '',
    fldStrShelf: '',
    fldStrWebsite: '',
  };
}

export function scrCollectionSettings({
  fldObjStrings,
  fldStrCollectionId,
  fldStrCollectionName,
}: scrCollectionSettingsProps): React.JSX.Element {
  const [fldObjClient] = React.useState(srvApiGetDemoClient);
  const { fldObjSession } = useDemoSession();
  const [fldObjForm, actSetForm] = React.useState<fldObjSettingsForm>(() =>
    fncConvBlankSettingsForm(fldStrCollectionName),
  );
  const [fldBooDetailsLoading, actSetDetailsLoading] = React.useState(true);
  const [fldStrDetailsError, actSetDetailsError] = React.useState<
    string | null
  >(null);
  const [fldStrNameError, actSetNameError] = React.useState<string | undefined>(
    undefined,
  );
  const [fldStrDateError, actSetDateError] = React.useState<string | undefined>(
    undefined,
  );
  const [fldBooSaving, actSetSaving] = React.useState(false);
  const [fldStrSaveError, actSetSaveError] = React.useState<string | null>(
    null,
  );
  const [fldBooSaved, actSetSaved] = React.useState(false);

  const fldObjCopy = fldObjStrings.fldObjCollectionSettings;
  const fldObjBrandCopy = fldObjStrings.fldObjBrandHeader;
  const fldObjFooterCopy = fldObjStrings.fldObjDemoFooter;

  const fncRunLoadDetails = React.useCallback(() => {
    actSetDetailsLoading(true);
    actSetDetailsError(null);
    let fldBooCancelled = false;
    srvApiGetDemoCollectionDetails(fldObjClient, fldStrCollectionId).then(
      fldObjDetails => {
        if (fldBooCancelled) {
          return;
        }
        if (fldObjDetails === null) {
          actSetForm(fncConvBlankSettingsForm(fldStrCollectionName));
        } else {
          actSetForm({
            fldStrName: fldStrCollectionName,
            fldStrFormedDate: fldObjDetails.fldDatFormedDate ?? '',
            fldStrHallRoom: fldObjDetails.fldStrHallRoom ?? '',
            fldStrCabinetFace: fldObjDetails.fldStrCabinetFace ?? '',
            fldStrBlock: fldObjDetails.fldStrBlock ?? '',
            fldStrRow: fldObjDetails.fldStrRow ?? '',
            fldStrShelf: fldObjDetails.fldStrShelf ?? '',
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
  }, [fldObjClient, fldStrCollectionId, fldStrCollectionName]);

  React.useEffect(() => fncRunLoadDetails(), [fncRunLoadDetails]);

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
      if (fldStrField === 'fldStrName') {
        actSetNameError(undefined);
      }
      if (fldStrField === 'fldStrFormedDate') {
        actSetDateError(undefined);
      }
    };

  const fncRunSave = React.useCallback(() => {
    const fldBooNameOk = vldChgIsTextPresent(fldObjForm.fldStrName);
    const fldBooDateOk = vldChgIsIsoDateOrBlank(fldObjForm.fldStrFormedDate);
    actSetNameError(fldBooNameOk ? undefined : fldObjCopy.fldStrNameRequired);
    actSetDateError(fldBooDateOk ? undefined : fldObjCopy.fldStrDateInvalid);
    actSetSaveError(null);
    actSetSaved(false);
    if (!fldBooNameOk || !fldBooDateOk) {
      return;
    }
    actSetSaving(true);
    srvApiSaveDemoCollectionDetails(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      fldStrCollectionId,
      {
        fldStrName: fldObjForm.fldStrName,
        fldDatFormedDate: fldObjForm.fldStrFormedDate,
        fldStrHallRoom: fldObjForm.fldStrHallRoom,
        fldStrCabinetFace: fldObjForm.fldStrCabinetFace,
        fldStrBlock: fldObjForm.fldStrBlock,
        fldStrRow: fldObjForm.fldStrRow,
        fldStrShelf: fldObjForm.fldStrShelf,
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
  }, [fldObjClient, fldObjSession, fldObjCopy, fldObjForm, fldStrCollectionId]);

  if (fldBooDetailsLoading) {
    return (
      <SafeAreaView style={scrCollectionSettingsStyles.fldObjContainer}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
        <View style={scrCollectionSettingsStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  if (fldStrDetailsError !== null) {
    return (
      <SafeAreaView style={scrCollectionSettingsStyles.fldObjContainer}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrErrorTitle}
          fldStrMessage={fldStrDetailsError}
        />
        <View style={scrCollectionSettingsStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoadDetails}
          />
        </View>
        <View style={scrCollectionSettingsStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrCollectionSettingsStyles.fldObjContainer}>
      <ScrollView style={scrCollectionSettingsStyles.fldObjScroll}>
        <View style={scrCollectionSettingsStyles.fldObjGap}>
          <VwBrandHeader
            fldStrName={fldObjBrandCopy.fldStrName}
            fldStrSuffix={fldObjBrandCopy.fldStrSuffix}
          />
        </View>
        <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
        <View style={scrCollectionSettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">{fldObjCopy.fldStrNameLabel}</VwText>
          <View style={scrCollectionSettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrName}
              actHandOnChange={fncRunSetTextField('fldStrName')}
              fldStrError={fldStrNameError}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrCollectionSettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">
            {fldObjCopy.fldStrFormedDateLabel}
          </VwText>
          <View style={scrCollectionSettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrFormedDate}
              actHandOnChange={fncRunSetTextField('fldStrFormedDate')}
              fldStrError={fldStrDateError}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrCollectionSettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">
            {fldObjCopy.fldStrHallRoomLabel}
          </VwText>
          <View style={scrCollectionSettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrHallRoom}
              actHandOnChange={fncRunSetTextField('fldStrHallRoom')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrCollectionSettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">
            {fldObjCopy.fldStrCabinetFaceLabel}
          </VwText>
          <View style={scrCollectionSettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrCabinetFace}
              actHandOnChange={fncRunSetTextField('fldStrCabinetFace')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrCollectionSettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">{fldObjCopy.fldStrBlockLabel}</VwText>
          <View style={scrCollectionSettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrBlock}
              actHandOnChange={fncRunSetTextField('fldStrBlock')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrCollectionSettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">{fldObjCopy.fldStrRowLabel}</VwText>
          <View style={scrCollectionSettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrRow}
              actHandOnChange={fncRunSetTextField('fldStrRow')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrCollectionSettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">{fldObjCopy.fldStrShelfLabel}</VwText>
          <View style={scrCollectionSettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrShelf}
              actHandOnChange={fncRunSetTextField('fldStrShelf')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        <View style={scrCollectionSettingsStyles.fldObjField}>
          <VwText fldStrVariant="caption">
            {fldObjCopy.fldStrWebsiteLabel}
          </VwText>
          <View style={scrCollectionSettingsStyles.fldObjGap}>
            <VwTextInput
              fldStrValue={fldObjForm.fldStrWebsite}
              actHandOnChange={fncRunSetTextField('fldStrWebsite')}
              fldBooDisabled={fldBooSaving}
            />
          </View>
        </View>
        {fldStrSaveError !== null && (
          <View style={scrCollectionSettingsStyles.fldObjField}>
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrSaveErrorTitle}
              fldStrMessage={fldStrSaveError}
            />
          </View>
        )}
        {fldBooSaved && (
          <View style={scrCollectionSettingsStyles.fldObjField}>
            <VwEmptyState fldStrTitle={fldObjCopy.fldStrSavedMessage} />
          </View>
        )}
        <View style={scrCollectionSettingsStyles.fldObjField}>
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

const scrCollectionSettingsStyles = StyleSheet.create({
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
