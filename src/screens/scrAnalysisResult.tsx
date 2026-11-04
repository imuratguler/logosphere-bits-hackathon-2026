/**
 * Logosphere BITS - analysis result route (review dispatcher).
 *
 * Analysis payloads render through the rebuilt single card
 * or multi list by run mode; a saved-product id renders the
 * read-only view below. Saving is idempotent and navigates
 * to the target folder on success; without a target the
 * legacy saved list stays on screen. Errors keep the draft
 * with a retry, and Back creates no rows.
 * Naming follows D6 (scr / fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrAnalysisResult); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { scrResultMulti as ScrResultMulti } from './scrResultMulti';
import { scrResultSingle as ScrResultSingle } from './scrResultSingle';
import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwProductDetails as VwProductDetails } from '../components/vwProductDetails';
import { vwText as VwText } from '../components/vwText';
import { vwTopBar as VwTopBar } from '../components/vwTopBar';
import { useDemoSession } from '../contexts/ctxDemoSession';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjApplicationRoutes } from '../navigation/navApplication';
import { srvApiSaveAnalysisRun } from '../services/srvAnalysis';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import { srvApiGetDemoProductDetails } from '../services/srvDemoProductDetails';
import {
  fldStrDefaultCurrency,
  type fldObjAnalysisPayload,
  type fldObjDraftTarget,
  type fldObjProductDetails,
} from '../types/typModels';
import {
  colBackground,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';
import { utlNumFormatMinorPrice } from '../utils/utlPrice';

type scrAnalysisResultProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrProductId?: string;
  fldObjAnalysis?: fldObjAnalysisPayload;
  fldArrLocalPhotos?: { fldStrId: string; fldStrLocalPath: string }[];
  fldObjTarget?: fldObjDraftTarget;
  actHandOnClose: () => void;
  actHandOnOpenFolder?: (fldObjTarget: fldObjDraftTarget) => void;
};

export function scrAnalysisResult({
  fldObjStrings,
  fldStrProductId,
  fldObjAnalysis,
  fldArrLocalPhotos,
  fldObjTarget,
  actHandOnClose,
  actHandOnOpenFolder,
}: scrAnalysisResultProps): React.JSX.Element {
  const fldObjCopy = fldObjStrings.fldObjAnalysisResult;
  const fldObjDetailCopy = fldObjStrings.fldObjProductDetails;
  const fldObjFooterCopy = fldObjStrings.fldObjDemoFooter;
  const fldObjNavigation =
    useNavigation<StackNavigationProp<fldObjApplicationRoutes>>();
  const fldObjClient = srvApiGetDemoClient();
  const { fldObjSession } = useDemoSession();
  const [fldObjDetails, actSetDetails] =
    React.useState<fldObjProductDetails | null>(null);
  const [fldBooLoading, actSetLoading] = React.useState(
    fldObjAnalysis === undefined,
  );
  const [fldStrLoadError, actSetLoadError] = React.useState<string | null>(
    null,
  );
  const [fldBooSaving, actSetSaving] = React.useState(false);
  const [fldStrSaveError, actSetSaveError] = React.useState<string | null>(
    null,
  );
  const [fldArrSavedIds, actSetSavedIds] = React.useState<string[]>([]);

  const fncRunLoad = React.useCallback(() => {
    if (fldStrProductId === undefined) {
      return;
    }
    actSetLoading(true);
    actSetLoadError(null);
    srvApiGetDemoProductDetails(fldObjClient, fldStrProductId).then(
      fldObjDone => {
        actSetDetails(fldObjDone);
        actSetLoading(false);
      },
      (fldObjError: unknown) => {
        actSetLoading(false);
        actSetLoadError((fldObjError as Error).message);
      },
    );
  }, [fldObjClient, fldStrProductId]);

  React.useEffect(() => {
    fncRunLoad();
  }, [fncRunLoad]);

  const fncRunSave = React.useCallback(
    (fldStrSetName: string | null) => {
      if (fldObjAnalysis === undefined || fldBooSaving) {
        return;
      }
      actSetSaving(true);
      actSetSaveError(null);
      srvApiSaveAnalysisRun(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        fldObjAnalysis.fldStrRunId,
        fldStrSetName,
      ).then(
        fldObjDone => {
          actSetSaving(false);
          actSetSavedIds(fldObjDone.fldArrProductIds);
          if (fldObjTarget !== undefined && actHandOnOpenFolder !== undefined) {
            actHandOnOpenFolder(fldObjTarget);
          }
        },
        (fldObjError: unknown) => {
          actSetSaving(false);
          actSetSaveError((fldObjError as Error).message);
        },
      );
    },
    [
      fldObjAnalysis,
      fldBooSaving,
      fldObjClient,
      fldObjSession,
      fldObjTarget,
      actHandOnOpenFolder,
    ],
  );

  if (fldObjAnalysis === undefined && fldStrProductId === undefined) {
    return (
      <SafeAreaView style={scrAnalysisResultStyles.fldObjContainer}>
        <VwTopBar
          fldStrTitle={fldObjCopy.fldStrTitle}
          fldStrBackLabel={fldObjCopy.fldStrBack}
          actHandOnBack={actHandOnClose}
        />
        <VwEmptyState fldStrTitle={fldObjCopy.fldStrLoadError} />
        <View style={scrAnalysisResultStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  if (fldObjAnalysis !== undefined) {
    const fldObjFirst = fldObjAnalysis.fldArrResults[0];
    if (fldObjFirst === undefined) {
      return (
        <SafeAreaView style={scrAnalysisResultStyles.fldObjContainer}>
          <VwTopBar
            fldStrTitle={fldObjCopy.fldStrTitle}
            fldStrBackLabel={fldObjCopy.fldStrBack}
            actHandOnBack={actHandOnClose}
          />
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrLoadError} />
          <View style={scrAnalysisResultStyles.fldObjFoot}>
            <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
          </View>
        </SafeAreaView>
      );
    }
    if (fldArrSavedIds.length > 0 && fldObjTarget === undefined) {
      return (
        <SafeAreaView style={scrAnalysisResultStyles.fldObjContainer}>
          <VwTopBar
            fldStrTitle={fldObjCopy.fldStrTitle}
            fldStrBackLabel={fldObjCopy.fldStrBack}
            actHandOnBack={actHandOnClose}
          />
          <View style={scrAnalysisResultStyles.fldObjGap}>
            <VwText fldStrVariant="body">
              {`${fldArrSavedIds.length} ${fldObjCopy.fldStrSavedProducts}`}
            </VwText>
            <VwButton
              fldStrLabel={fldObjCopy.fldStrOpenSaved}
              actHandOnPress={() => {
                const fldStrFirstId = fldArrSavedIds[0];
                if (fldStrFirstId !== undefined) {
                  fldObjNavigation.replace('AnalysisResult', {
                    fldStrProductId: fldStrFirstId,
                  });
                }
              }}
            />
          </View>
          <View style={scrAnalysisResultStyles.fldObjFoot}>
            <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
          </View>
        </SafeAreaView>
      );
    }
    if (fldObjAnalysis.fldStrMode === 'multiProduct') {
      return (
        <ScrResultMulti
          fldObjStrings={fldObjStrings}
          fldObjAnalysis={fldObjAnalysis}
          fldArrLocalPhotos={fldArrLocalPhotos ?? []}
          fldBooSaving={fldBooSaving}
          fldStrSaveError={fldStrSaveError}
          actHandOnBack={actHandOnClose}
          actHandOnSave={fncRunSave}
        />
      );
    }
    const fldArrStripPhotos = (fldArrLocalPhotos ?? [])
      .filter(fldObjPhoto =>
        fldObjFirst.fldArrPhotoIds.includes(fldObjPhoto.fldStrId),
      )
      .map(fldObjPhoto => ({
        fldStrId: fldObjPhoto.fldStrId,
        fldStrUri: `file://${fldObjPhoto.fldStrLocalPath}`,
      }));
    return (
      <ScrResultSingle
        fldObjStrings={fldObjStrings}
        fldObjAnalysis={fldObjAnalysis}
        fldObjItem={fldObjFirst}
        fldArrStripPhotos={fldArrStripPhotos}
        fldBooSaving={fldBooSaving}
        fldStrSaveError={fldStrSaveError}
        actHandOnBack={actHandOnClose}
        actHandOnSave={() => {
          fncRunSave(null);
        }}
      />
    );
  }

  if (fldBooLoading) {
    return (
      <SafeAreaView style={scrAnalysisResultStyles.fldObjContainer}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrTitle} />
        <View style={scrAnalysisResultStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  if (fldStrLoadError !== null || fldObjDetails === null) {
    return (
      <SafeAreaView style={scrAnalysisResultStyles.fldObjContainer}>
        <VwTopBar
          fldStrTitle={fldObjCopy.fldStrTitle}
          fldStrBackLabel={fldObjCopy.fldStrBack}
          actHandOnBack={actHandOnClose}
        />
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrLoadError}
          fldStrMessage={fldStrLoadError ?? undefined}
        />
        <View style={scrAnalysisResultStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
        <View style={scrAnalysisResultStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </SafeAreaView>
    );
  }

  const fldObjProduct = fldObjDetails.fldObjProduct;
  const fldObjSale = fldObjProduct.fldObjSaleStatus;
  // Tag prices carry no currency column; they render in the
  // estimate currency when one exists, else the pricing
  // default (USD). Currency rules stay an open SCOPE item.
  const fldStrTagPrice =
    fldObjSale?.fldNumTagPrice === null ||
    fldObjSale?.fldNumTagPrice === undefined
      ? null
      : utlNumFormatMinorPrice(
          fldObjSale.fldNumTagPrice,
          fldObjProduct.fldObjPricing?.fldStrCurrency ?? fldStrDefaultCurrency,
        );

  return (
    <SafeAreaView style={scrAnalysisResultStyles.fldObjContainer}>
      <VwTopBar
        fldStrTitle={fldObjCopy.fldStrTitle}
        fldStrBackLabel={fldObjCopy.fldStrBack}
        actHandOnBack={actHandOnClose}
      />
      <ScrollView style={scrAnalysisResultStyles.fldObjScroll}>
        <View style={scrAnalysisResultStyles.fldObjGap}>
          <VwText fldStrVariant="body">{fldObjProduct.fldStrName}</VwText>
        </View>
        {fldObjDetails.fldArrImages.length === 0 ? (
          <View style={scrAnalysisResultStyles.fldObjGap}>
            <VwEmptyState fldStrTitle={fldObjCopy.fldStrNoPhotos} />
          </View>
        ) : (
          <ScrollView
            horizontal
            style={scrAnalysisResultStyles.fldObjGap}
            showsHorizontalScrollIndicator={false}
          >
            {fldObjDetails.fldArrImages.map(fldObjImage => (
              <Image
                key={fldObjImage.fldStrId}
                source={{ uri: fldObjImage.fldStrUrl }}
                style={[
                  scrAnalysisResultStyles.fldObjThumb,
                  {
                    transform: [
                      { rotate: `${fldObjImage.fldNumRotationDegrees}deg` },
                    ],
                  },
                ]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}
        <View style={scrAnalysisResultStyles.fldObjGap}>
          <VwProductDetails
            fldObjProduct={fldObjProduct}
            fldArrSources={[]}
            fldObjStrings={fldObjDetailCopy}
            fldObjCodeLabels={fldObjStrings.fldObjCodeLabels}
          />
        </View>
        {fldObjSale !== null && (
          <View style={scrAnalysisResultStyles.fldObjGap}>
            <VwText fldStrVariant="caption">
              {fldObjSale.fldBooIsActive
                ? fldObjCopy.fldStrListed
                : fldObjCopy.fldStrNotListed}
            </VwText>
            {fldStrTagPrice !== null && (
              <VwText fldStrVariant="body">
                {`${fldObjCopy.fldStrTagPrice}: ${fldStrTagPrice}`}
              </VwText>
            )}
          </View>
        )}
        <View style={scrAnalysisResultStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrPriceButton}
            actHandOnPress={() => {
              fldObjNavigation.navigate('MarketPrice', {
                fldStrProductId: fldObjProduct.fldStrId,
              });
            }}
          />
        </View>
        <View style={scrAnalysisResultStyles.fldObjFoot}>
          <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const scrAnalysisResultStyles = StyleSheet.create({
  fldObjContainer: {
    flex: 1,
    backgroundColor: colBackground,
  },
  fldObjScroll: {
    flex: 1,
  },
  fldObjGap: {
    marginTop: fldNumSpacingMd,
    paddingHorizontal: fldNumSpacingMd,
  },
  fldObjThumb: {
    width: 120,
    height: 120,
    marginRight: fldNumSpacingSm,
  },
  fldObjFoot: {
    marginTop: fldNumSpacingLg,
    marginBottom: fldNumSpacingSm,
  },
});
