/**
 * Logosphere BITS — HIDDEN corporate document screen.
 *
 * Org-scoped private document list with confirmed removal, over
 * the controlled corporate-docs bucket: members see and remove
 * only their own organization's rows and bytes. Removal confirms
 * first, deletes the row, then sweeps the bytes, and reloads the
 * list; failures keep the list with the error surfaced. Upload
 * entry stays out until a file picker lands — the upload service
 * call exists and is tested, but no honest byte source exists on
 * this screen yet. This module is NOT imported by the demo
 * navigator or any demo module — no demo path can show it.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrAccountDocuments); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SupabaseClient } from '@supabase/supabase-js';

import { vwButton as VwButton } from '../components/vwButton';
import { vwDeleteConfirmModal as VwDeleteConfirmModal } from '../components/vwDeleteConfirmModal';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwText as VwText } from '../components/vwText';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import { srvApiGetRealClient } from '../services/srvRealAccount';
import type { fldObjAccountDocument } from '../services/srvAccountDocuments';
import {
  srvApiGetAccountDocuments,
  srvApiRemoveAccountDocument,
} from '../services/srvAccountDocuments';
import {
  colBackground,
  fldNumSpacingMd,
  fldNumSpacingSm,
} from '../utils/utlTheme';

type scrAccountDocumentsProps = {
  fldObjStrings: fldObjAppStrings;
  fldObjClient?: SupabaseClient;
  fldStrOrganizationId: string;
  fldStrOrganizationName: string;
};

export function scrAccountDocuments({
  fldObjStrings,
  fldObjClient,
  fldStrOrganizationId,
  fldStrOrganizationName,
}: scrAccountDocumentsProps): React.JSX.Element {
  const [fldObjActiveClient] = React.useState<SupabaseClient>(
    () => fldObjClient ?? srvApiGetRealClient(),
  );
  const [fldArrDocuments, actSetDocuments] = React.useState<
    fldObjAccountDocument[] | null
  >(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);
  const [fldObjPending, actSetPending] =
    React.useState<fldObjAccountDocument | null>(null);
  const [fldBooRemoving, actSetRemoving] = React.useState(false);
  const [fldStrRemoveError, actSetRemoveError] = React.useState<string | null>(
    null,
  );

  const fldObjCopy = fldObjStrings.fldObjAccountDocuments;

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    srvApiGetAccountDocuments(fldObjActiveClient, fldStrOrganizationId).then(
      fldArrRows => {
        if (!fldBooCancelled) {
          actSetDocuments(fldArrRows);
        }
      },
      fldObjLoadError => {
        if (!fldBooCancelled) {
          actSetError((fldObjLoadError as Error).message);
        }
      },
    );
    return () => {
      fldBooCancelled = true;
    };
  }, [fldObjActiveClient, fldStrOrganizationId]);

  React.useEffect(() => fncRunLoad(), [fncRunLoad]);

  const fncRunConfirmRemove = React.useCallback(() => {
    if (fldObjPending === null || fldBooRemoving) {
      return;
    }
    actSetRemoveError(null);
    actSetRemoving(true);
    srvApiRemoveAccountDocument(fldObjActiveClient, {
      fldStrOrganizationId,
      fldStrDocumentId: fldObjPending.fldStrId,
    }).then(
      () => {
        actSetRemoving(false);
        actSetPending(null);
        fncRunLoad();
      },
      fldObjRemoveError => {
        actSetRemoving(false);
        actSetRemoveError((fldObjRemoveError as Error).message);
      },
    );
  }, [
    fldBooRemoving,
    fldObjActiveClient,
    fldObjPending,
    fldStrOrganizationId,
    fncRunLoad,
  ]);

  if (fldStrError !== null) {
    return (
      <SafeAreaView style={scrAccountDocumentsStyles.fldObjScreen}>
        <VwEmptyState
          fldStrTitle={fldObjCopy.fldStrErrorTitle}
          fldStrMessage={fldStrError}
        />
        <View style={scrAccountDocumentsStyles.fldObjGap}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrRetry}
            actHandOnPress={fncRunLoad}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (fldArrDocuments === null) {
    return (
      <SafeAreaView style={scrAccountDocumentsStyles.fldObjScreen}>
        <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={scrAccountDocumentsStyles.fldObjScreen}>
      <ScrollView>
        <View style={scrAccountDocumentsStyles.fldObjHeader}>
          <VwText fldStrVariant="header">{fldObjCopy.fldStrTitle}</VwText>
          <VwText fldStrVariant="caption">{fldStrOrganizationName}</VwText>
        </View>
        {fldArrDocuments.length === 0 ? (
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyTitle} />
        ) : (
          fldArrDocuments.map(fldObjDocument => (
            <View
              key={fldObjDocument.fldStrId}
              style={scrAccountDocumentsStyles.fldObjRow}
            >
              <VwText fldStrVariant="body">{fldObjDocument.fldStrName}</VwText>
              <VwText fldStrVariant="caption">
                {fldObjDocument.fldStrFilePath}
              </VwText>
              <View style={scrAccountDocumentsStyles.fldObjGap}>
                <VwButton
                  fldStrLabel={fldObjCopy.fldStrRemove}
                  actHandOnPress={() => {
                    actSetRemoveError(null);
                    actSetPending(fldObjDocument);
                  }}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <VwDeleteConfirmModal
        fldBooVisible={fldObjPending !== null}
        fldStrTitle={fldObjCopy.fldStrRemoveTitle}
        fldStrSummary={fldObjPending?.fldStrName ?? ''}
        fldStrBlockedReason={null}
        fldBooLoading={false}
        fldStrLoading={fldObjCopy.fldStrLoading}
        fldStrLoadErrorTitle={fldObjCopy.fldStrErrorTitle}
        fldStrLoadError={null}
        fldStrRetry={fldObjCopy.fldStrRetry}
        actHandOnRetry={() => undefined}
        fldStrConfirmLabel={fldObjCopy.fldStrRemoveConfirm}
        fldBooConfirmDisabled={false}
        fldBooWorking={fldBooRemoving}
        fldStrErrorTitle={fldObjCopy.fldStrRemoveErrorTitle}
        fldStrError={fldStrRemoveError}
        actHandOnConfirm={fncRunConfirmRemove}
        fldStrCancelLabel={fldObjCopy.fldStrRemoveCancel}
        actHandOnCancel={() => {
          if (!fldBooRemoving) {
            actSetPending(null);
          }
        }}
      />
    </SafeAreaView>
  );
}

const scrAccountDocumentsStyles = StyleSheet.create({
  fldObjScreen: {
    flex: 1,
    backgroundColor: colBackground,
    padding: fldNumSpacingMd,
  },
  fldObjHeader: {
    marginBottom: fldNumSpacingMd,
  },
  fldObjGap: {
    marginTop: fldNumSpacingSm,
  },
  fldObjRow: {
    marginBottom: fldNumSpacingMd,
  },
});
