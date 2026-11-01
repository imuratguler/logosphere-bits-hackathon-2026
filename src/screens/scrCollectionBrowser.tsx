/**
 * Logosphere BITS — collection browser (one recursive level).
 *
 * Shows the collections hanging under one parent: the tapped library
 * at the first level, a collection deeper down. The same route is
 * pushed again for a sub-collection, so the stack grows one entry per
 * level and the system back action walks back up; a visible Back
 * button does the same on every state (list, loading, empty, error).
 * The title is the current parent name, carried in the route params
 * from the tapped row — no extra read. At the library root a settings
 * action opens the library editor; deeper levels offer the current
 * collection's settings instead. Below the list sits the quick-create
 * shortcut: name only,
 * the formed date stamped as today in the background by the server;
 * the parent is validated on the client before the save call, and a
 * successful save clears the form and reloads this parent's list.
 * Collection levels also list the visible parent's sets with member
 * counts and product names, plus a loose products section for the
 * items no set holds (every fetched product renders somewhere),
 * each product row with its real photo count; a New-set button
 * opens a custom name modal. Library root shows neither section.
 * The brand header tops the list and the demo footer pins below.
 * Long-pressing a collection, set, or product row opens single-type
 * selection mode: same-type rows show checkboxes, Select All sits at
 * the top, and a bottom bar offers Cancel plus the type's actions.
 * Move opens the destination picker (workspace tree, current
 * location first, invalid targets unselectable, inline creation)
 * and executes through the atomic move RPCs; Merge/Delete stay
 * disabled (no server operations or rules exist yet). Cancel — or
 * the Back button while selecting — exits and restores normal
 * navigation.
 * All reads delegate to the ready services; nothing is copied here.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrCollectionBrowser); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useDemoSession } from '../contexts/ctxDemoSession';
import { vwBrandHeader as VwBrandHeader } from '../components/vwBrandHeader';
import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwListRow as VwListRow } from '../components/vwListRow';
import { vwLoading as VwLoading } from '../components/vwLoading';
import { vwMergeCollectionsModal as VwMergeCollectionsModal } from '../components/vwMergeCollectionsModal';
import { vwDeleteConfirmModal as VwDeleteConfirmModal } from '../components/vwDeleteConfirmModal';
import { vwMoveDestinationModal as VwMoveDestinationModal } from '../components/vwMoveDestinationModal';
import { vwSetBatchModal as VwSetBatchModal } from '../components/vwSetBatchModal';
import { vwSetNameModal as VwSetNameModal } from '../components/vwSetNameModal';
import { vwText as VwText } from '../components/vwText';
import { vwTextInput as VwTextInput } from '../components/vwTextInput';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjApplicationRoutes } from '../navigation/navApplication';
import { srvApiGetDemoClient } from '../services/srvDemoClient';
import {
  srvApiDeleteDemoCollections,
  srvApiDeleteDemoProducts,
  srvApiDeleteDemoSets,
  srvApiGetDemoMediaCounts,
  srvApiRetryDemoDeleteFiles,
} from '../services/srvDemoDelete';
import type {
  fldObjDeleteFileRef,
  fldObjDeletePrefixRef,
} from '../services/srvDemoDelete';
import type { fldObjDemoCollection } from '../services/srvDemoCollections';
import {
  srvApiCreateDemoCollection,
  srvApiGetDemoCollections,
} from '../services/srvDemoCollections';
import type {
  fldObjDemoSet,
  fldObjDemoSetProduct,
} from '../services/srvDemoSets';
import {
  srvApiCreateDemoSet,
  srvApiGetDemoProductPhotoCounts,
  srvApiGetDemoSetProducts,
  srvApiGetDemoSets,
} from '../services/srvDemoSets';
import type { fldObjMoveTree } from '../services/srvDemoMove';
import {
  fncConvTreeToLeafScope,
  srvApiConvertDemoLeafProducts,
  srvApiExtractDemoSetContents,
  srvApiGetDemoMoveTree,
  srvApiMergeDemoCollections,
  srvApiMergeDemoSetContents,
  srvApiMoveDemoCollections,
  srvApiMoveDemoProductsToCollection,
  srvApiMoveDemoProductsToSet,
  srvApiMoveDemoSets,
} from '../services/srvDemoMove';
import { srvApiGetDemoWorkspace } from '../services/srvDemoWorkspace';
import type { fldObjMoveTargetRow } from '../types/typModels';
import {
  colBackground,
  fldNumSpacingLg,
  fldNumSpacingMd,
} from '../utils/utlTheme';
import { vldChgIsTextPresent } from '../validation/vldDetails';
import {
  vldChgIsCollectionMergeTargetValid,
  vldChgIsCollectionMoveTargetValid,
  type fldObjHierarchyNode,
} from '../validation/vldHierarchy';

type scrCollectionBrowserProps = {
  fldObjStrings: fldObjAppStrings;
  fldStrLibraryId: string;
  fldStrLibraryName: string;
  fldStrParentId: string;
  fldStrTitle: string;
};

type fldStrSelectionType = 'collection' | 'set' | 'product';

type fldObjRowSelection = {
  fldStrType: fldStrSelectionType;
  fldArrIds: string[];
};

type fldObjSetBatchMode = 'merge' | 'extract' | 'convert';

type fldObjDeletePreview = {
  fldNumSets: number;
  fldNumProducts: number;
  fldNumPhotos: number;
  fldNumVoices: number;
  fldBooBlocked: boolean;
};

type fldObjDeletePendingFiles = {
  fldArrFiles: fldObjDeleteFileRef[];
  fldArrPrefixes: fldObjDeletePrefixRef[];
};

function fncConvMoveInitialTarget(
  fldObjSelection: fldObjRowSelection | null,
  fldArrProducts: fldObjDemoSetProduct[],
  fldStrParentId: string,
): string {
  if (fldObjSelection?.fldStrType === 'product') {
    const fldArrSets = fldObjSelection.fldArrIds.map(
      fldStrId =>
        fldArrProducts.find(
          fldObjProduct => fldObjProduct.fldStrId === fldStrId,
        )?.fldStrSetId ?? null,
    );
    const [fldStrFirst] = fldArrSets;
    if (
      fldStrFirst !== undefined &&
      fldStrFirst !== null &&
      fldArrSets.every(fldStrSet => fldStrSet === fldStrFirst)
    ) {
      return fldStrFirst;
    }
  }
  return fldStrParentId;
}

type fldObjFlatTreeEntry = {
  fldStrId: string;
  fldStrName: string;
  fldStrKind: 'library' | 'collection' | 'set';
  fldNumDepth: number;
  fldStrSetCollectionId: string | null;
};

function fncConvTreeToFlatEntries(
  fldObjTree: fldObjMoveTree,
): fldObjFlatTreeEntry[] {
  const fldObjChildren = new Map<string, string[]>();
  const fldObjNodesById = new Map<
    string,
    { fldStrName: string; fldStrKind: 'library' | 'collection' }
  >();
  for (const fldObjNode of fldObjTree.fldArrNodes) {
    fldObjNodesById.set(fldObjNode.fldStrId, {
      fldStrName: fldObjNode.fldStrName,
      fldStrKind: fldObjNode.fldStrKind,
    });
  }
  const fldArrRoots: string[] = [];
  for (const fldObjNode of fldObjTree.fldArrNodes) {
    const fldStrParent = fldObjNode.fldStrParentId;
    if (fldStrParent === null || !fldObjNodesById.has(fldStrParent)) {
      fldArrRoots.push(fldObjNode.fldStrId);
    } else {
      const fldArrSiblings = fldObjChildren.get(fldStrParent) ?? [];
      fldArrSiblings.push(fldObjNode.fldStrId);
      fldObjChildren.set(fldStrParent, fldArrSiblings);
    }
  }
  const fldArrEntries: fldObjFlatTreeEntry[] = [];
  const fldObjSeen = new Set<string>();
  const fncRunAppendNode = (fldStrId: string, fldNumDepth: number): void => {
    if (fldObjSeen.has(fldStrId)) {
      return;
    }
    fldObjSeen.add(fldStrId);
    const fldObjNode = fldObjNodesById.get(fldStrId);
    if (fldObjNode === undefined) {
      return;
    }
    fldArrEntries.push({
      fldStrId,
      fldStrName: fldObjNode.fldStrName,
      fldStrKind: fldObjNode.fldStrKind,
      fldNumDepth,
      fldStrSetCollectionId: null,
    });
    for (const fldStrChild of fldObjChildren.get(fldStrId) ?? []) {
      fncRunAppendNode(fldStrChild, fldNumDepth + 1);
    }
    if (fldObjNode.fldStrKind === 'collection') {
      for (const fldObjSet of fldObjTree.fldArrSets) {
        if (fldObjSet.fldStrCollectionId !== fldStrId) {
          continue;
        }
        fldArrEntries.push({
          fldStrId: fldObjSet.fldStrId,
          fldStrName: fldObjSet.fldStrName,
          fldStrKind: 'set',
          fldNumDepth: fldNumDepth + 1,
          fldStrSetCollectionId: fldObjSet.fldStrCollectionId,
        });
      }
    }
  };
  for (const fldStrRoot of fldArrRoots) {
    fncRunAppendNode(fldStrRoot, 0);
  }
  return fldArrEntries;
}

function fncConvTreeToHierarchy(
  fldObjTree: fldObjMoveTree,
  fldStrWorkspaceId: string,
): fldObjHierarchyNode[] {
  return fldObjTree.fldArrNodes.map(fldObjNode => ({
    fldStrId: fldObjNode.fldStrId,
    fldStrKind: fldObjNode.fldStrKind,
    fldStrWorkspaceId,
    fldStrParentId: fldObjNode.fldStrParentId,
  }));
}

function fncConvMoveTreeToRows(
  fldObjTree: fldObjMoveTree,
  fldStrMovedType: fldStrSelectionType,
  fldArrMovedIds: string[],
  fldStrTargetId: string | null,
  fldStrCurrentId: string,
  fldStrWorkspaceId: string,
  fldStrProductHomeId: string,
): fldObjMoveTargetRow[] {
  const fldArrHierarchy = fncConvTreeToHierarchy(fldObjTree, fldStrWorkspaceId);
  const fncRunIsRowValid = (
    fldStrKind: 'library' | 'collection' | 'set',
    fldStrId: string,
    fldStrSetCollectionId: string | null,
  ): boolean => {
    if (fldStrMovedType === 'collection') {
      if (fldStrKind === 'set') {
        return false;
      }
      return vldChgIsCollectionMoveTargetValid(
        fldArrHierarchy,
        fldArrMovedIds,
        fldStrId,
      );
    }
    if (fldStrMovedType === 'set') {
      return fldStrKind === 'collection';
    }
    if (fldStrKind === 'library') {
      return false;
    }
    if (fldStrKind === 'set') {
      return fldStrSetCollectionId === fldStrProductHomeId;
    }
    return true;
  };
  return fncConvTreeToFlatEntries(fldObjTree).map(fldObjEntry => ({
    fldStrId: fldObjEntry.fldStrId,
    fldStrName: fldObjEntry.fldStrName,
    fldStrKind: fldObjEntry.fldStrKind,
    fldNumDepth: fldObjEntry.fldNumDepth,
    fldBooSelected: fldObjEntry.fldStrId === fldStrTargetId,
    fldBooInvalid: !fncRunIsRowValid(
      fldObjEntry.fldStrKind,
      fldObjEntry.fldStrId,
      fldObjEntry.fldStrSetCollectionId,
    ),
    fldBooIsCurrent: fldObjEntry.fldStrId === fldStrCurrentId,
    fldBooCanCreateCollection: fldObjEntry.fldStrKind !== 'set',
    fldBooCanCreateSet: fldObjEntry.fldStrKind === 'collection',
  }));
}

function fncConvMergeTreeToRows(
  fldObjTree: fldObjMoveTree,
  fldArrMovedIds: string[],
  fldStrTargetId: string | null,
  fldStrWorkspaceId: string,
): fldObjMoveTargetRow[] {
  const fldArrHierarchy = fncConvTreeToHierarchy(fldObjTree, fldStrWorkspaceId);
  const fldBooSourcesHaveSubs = fldObjTree.fldArrNodes.some(
    fldObjNode =>
      fldObjNode.fldStrKind === 'collection' &&
      fldObjNode.fldStrParentId !== null &&
      fldArrMovedIds.includes(fldObjNode.fldStrParentId),
  );
  const fncRunTargetHasItems = (fldStrId: string): boolean =>
    fldObjTree.fldArrSets.some(
      fldObjSet => fldObjSet.fldStrCollectionId === fldStrId,
    ) ||
    fldObjTree.fldArrProducts.some(
      fldObjProduct => fldObjProduct.fldStrCollectionId === fldStrId,
    );
  return fncConvTreeToFlatEntries(fldObjTree)
    .filter(fldObjEntry => fldObjEntry.fldStrKind === 'collection')
    .map(fldObjEntry => ({
      fldStrId: fldObjEntry.fldStrId,
      fldStrName: fldObjEntry.fldStrName,
      fldStrKind: fldObjEntry.fldStrKind,
      fldNumDepth: fldObjEntry.fldNumDepth,
      fldBooSelected: fldObjEntry.fldStrId === fldStrTargetId,
      fldBooInvalid:
        !vldChgIsCollectionMergeTargetValid(
          fldArrHierarchy,
          fldArrMovedIds,
          fldObjEntry.fldStrId,
        ) ||
        (fldBooSourcesHaveSubs && fncRunTargetHasItems(fldObjEntry.fldStrId)),
      fldBooIsCurrent: false,
      fldBooCanCreateCollection: false,
      fldBooCanCreateSet: false,
    }));
}

export function scrCollectionBrowser({
  fldObjStrings,
  fldStrLibraryId,
  fldStrLibraryName,
  fldStrParentId,
  fldStrTitle,
}: scrCollectionBrowserProps): React.JSX.Element {
  const [fldObjClient] = React.useState(srvApiGetDemoClient);
  const fldObjNavigation =
    useNavigation<StackNavigationProp<fldObjApplicationRoutes>>();
  const { fldObjSession } = useDemoSession();
  const [fldArrCollections, actSetCollections] = React.useState<
    fldObjDemoCollection[] | null
  >(null);
  const [fldStrError, actSetError] = React.useState<string | null>(null);
  const [fldStrWorkspaceId, actSetWorkspaceId] = React.useState<string | null>(
    null,
  );
  const [fldStrShortcutName, actSetShortcutName] = React.useState('');
  const [fldStrShortcutNameError, actSetShortcutNameError] = React.useState<
    string | undefined
  >(undefined);
  const [fldBooShortcutSaving, actSetShortcutSaving] = React.useState(false);
  const [fldStrShortcutSaveError, actSetShortcutSaveError] = React.useState<
    string | null
  >(null);
  const [fldArrSets, actSetSets] = React.useState<fldObjDemoSet[]>([]);
  const [fldArrSetProducts, actSetSetProducts] = React.useState<
    fldObjDemoSetProduct[]
  >([]);
  const [fldObjPhotoCounts, actSetPhotoCounts] = React.useState<Record<
    string,
    number
  > | null>(null);
  const [fldBooSetModalVisible, actSetSetModalVisible] = React.useState(false);
  const [fldStrSetName, actSetSetName] = React.useState('');
  const [fldStrSetNameError, actSetSetNameError] = React.useState<
    string | undefined
  >(undefined);
  const [fldBooSetSaving, actSetSetSaving] = React.useState(false);
  const [fldStrSetSaveError, actSetSetSaveError] = React.useState<
    string | null
  >(null);
  const [fldObjSelection, actSetSelection] =
    React.useState<fldObjRowSelection | null>(null);
  const fldObjLongPressGuard = React.useRef(false);
  const [fldBooMoveVisible, actSetMoveVisible] = React.useState(false);
  const [fldObjMoveTree, actSetMoveTree] =
    React.useState<fldObjMoveTree | null>(null);
  const [fldBooMoveTreeLoading, actSetMoveTreeLoading] = React.useState(false);
  const [fldStrMoveTreeError, actSetMoveTreeError] = React.useState<
    string | null
  >(null);
  const [fldStrMoveTargetId, actSetMoveTargetId] = React.useState<
    string | null
  >(null);
  const [fldStrMoveDraftName, actSetMoveDraftName] = React.useState('');
  const [fldStrMoveCreatingKind, actSetMoveCreatingKind] = React.useState<
    'collection' | 'set' | null
  >(null);
  const [fldStrMoveCreateError, actSetMoveCreateError] = React.useState<
    string | null
  >(null);
  const [fldBooMoving, actSetMoving] = React.useState(false);
  const [fldStrMoveError, actSetMoveError] = React.useState<string | null>(
    null,
  );
  const [fldBooMergeVisible, actSetMergeVisible] = React.useState(false);
  const [fldObjMergeTree, actSetMergeTree] =
    React.useState<fldObjMoveTree | null>(null);
  const [fldBooMergeTreeLoading, actSetMergeTreeLoading] =
    React.useState(false);
  const [fldStrMergeTreeError, actSetMergeTreeError] = React.useState<
    string | null
  >(null);
  const [fldStrMergeTargetId, actSetMergeTargetId] = React.useState<
    string | null
  >(null);
  const [fldStrMergeDraftName, actSetMergeDraftName] = React.useState('');
  const [fldBooMerging, actSetMerging] = React.useState(false);
  const [fldStrMergeError, actSetMergeError] = React.useState<string | null>(
    null,
  );
  const [fldObjBatchMode, actSetBatchMode] =
    React.useState<fldObjSetBatchMode | null>(null);
  const [fldObjBatchTree, actSetBatchTree] =
    React.useState<fldObjMoveTree | null>(null);
  const [fldBooBatchLoading, actSetBatchLoading] = React.useState(false);
  const [fldStrBatchLoadError, actSetBatchLoadError] = React.useState<
    string | null
  >(null);
  const [fldStrBatchDraftName, actSetBatchDraftName] = React.useState('');
  const [fldBooBatchWorking, actSetBatchWorking] = React.useState(false);
  const [fldStrBatchError, actSetBatchError] = React.useState<string | null>(
    null,
  );
  const [fldBooDeleteVisible, actSetDeleteVisible] = React.useState(false);
  const [fldObjDeletePreview, actSetDeletePreview] =
    React.useState<fldObjDeletePreview | null>(null);
  const [fldBooDeleteLoading, actSetDeleteLoading] = React.useState(false);
  const [fldStrDeleteLoadError, actSetDeleteLoadError] = React.useState<
    string | null
  >(null);
  const [fldBooDeleting, actSetDeleting] = React.useState(false);
  const [fldStrDeleteError, actSetDeleteError] = React.useState<string | null>(
    null,
  );
  const [fldObjDeletePending, actSetDeletePending] =
    React.useState<fldObjDeletePendingFiles | null>(null);

  const fldBooIsLibraryRoot = fldStrParentId === fldStrLibraryId;
  const fldBooSelecting = fldObjSelection !== null;
  const fldBooCollectionMode = fldObjSelection?.fldStrType === 'collection';
  const fldBooSetMode = fldObjSelection?.fldStrType === 'set';
  const fldBooProductMode = fldObjSelection?.fldStrType === 'product';
  const fldArrSelectedIds = fldObjSelection?.fldArrIds ?? [];
  const fldArrVisibleCollectionIds = (fldArrCollections ?? []).map(
    fldObjItem => fldObjItem.fldStrId,
  );
  const fldArrVisibleSetIds = fldArrSets.map(fldObjSet => fldObjSet.fldStrId);
  const fldArrLooseProducts = fldArrSetProducts.filter(
    fldObjProduct =>
      !fldArrSets.some(
        fldObjSet => fldObjSet.fldStrId === fldObjProduct.fldStrSetId,
      ),
  );
  // Every fetched product renders somewhere (set member or loose
  // row), so the whole list is selectable in product mode.
  const fldArrVisibleProductIds = fldArrSetProducts.map(
    fldObjProduct => fldObjProduct.fldStrId,
  );

  const fncRunLoad = React.useCallback(() => {
    actSetError(null);
    let fldBooCancelled = false;
    srvApiGetDemoWorkspace(fldObjClient)
      .then(fldObjWorkspace => {
        if (!fldBooCancelled) {
          actSetWorkspaceId(fldObjWorkspace.fldStrId);
        }
        return srvApiGetDemoCollections(
          fldObjClient,
          fldObjWorkspace.fldStrId,
          fldStrParentId,
        ).then(fldArrLoadedCollections => {
          if (fldBooIsLibraryRoot) {
            return {
              fldArrCollections: fldArrLoadedCollections,
              fldArrSets: [],
              fldArrProducts: [],
            };
          }
          return Promise.all([
            srvApiGetDemoSets(fldObjClient, fldStrParentId),
            srvApiGetDemoSetProducts(fldObjClient, fldStrParentId),
          ]).then(([fldArrLoadedSets, fldArrLoadedProducts]) => ({
            fldArrCollections: fldArrLoadedCollections,
            fldArrSets: fldArrLoadedSets,
            fldArrProducts: fldArrLoadedProducts,
          }));
        });
      })
      .then(
        fldObjLoaded => {
          if (fldBooCancelled) {
            return;
          }
          actSetCollections(fldObjLoaded.fldArrCollections);
          actSetSets(fldObjLoaded.fldArrSets);
          actSetSetProducts(fldObjLoaded.fldArrProducts);
          // Photo counts ride a side chain: rows render with or
          // without them, and a counts failure never fails the list.
          const fldArrProductIds = fldObjLoaded.fldArrProducts.map(
            fldObjProduct => fldObjProduct.fldStrId,
          );
          srvApiGetDemoProductPhotoCounts(fldObjClient, fldArrProductIds).then(
            fldObjCounts => {
              if (!fldBooCancelled) {
                actSetPhotoCounts(fldObjCounts);
              }
            },
            () => {
              if (!fldBooCancelled) {
                actSetPhotoCounts(null);
              }
            },
          );
        },
        fldObjError => {
          if (!fldBooCancelled) {
            actSetError((fldObjError as Error).message);
          }
        },
      );
    return () => {
      fldBooCancelled = true;
    };
  }, [fldObjClient, fldStrParentId, fldBooIsLibraryRoot]);

  React.useEffect(() => fncRunLoad(), [fncRunLoad]);

  const fldObjCopy = fldObjStrings.fldObjCollectionBrowser;
  const fldObjBrandCopy = fldObjStrings.fldObjBrandHeader;
  const fldObjFooterCopy = fldObjStrings.fldObjDemoFooter;
  const fncConvPhotoSubtitle = (fldStrProductId: string): string | null => {
    if (fldObjPhotoCounts === null) {
      return null;
    }
    return `${fldObjCopy.fldStrPhotosLabel}: ${
      fldObjPhotoCounts[fldStrProductId] ?? 0
    }`;
  };
  const fldObjShortcutCopy = fldObjStrings.fldObjCollectionShortcut;
  const fldObjSetShortcutCopy = fldObjStrings.fldObjSetShortcut;
  const fldObjMultiSelectCopy = fldObjStrings.fldObjMultiSelect;
  const fldObjMovePickerCopy = fldObjStrings.fldObjMovePicker;
  const fldObjMergeCopy = fldObjStrings.fldObjCollectionMerge;
  const fldObjSetBatchCopy = fldObjStrings.fldObjSetBatch;
  const fldObjDeleteCopy = fldObjStrings.fldObjDelete;

  const fncRunEnterSelection = React.useCallback(
    (fldStrType: fldStrSelectionType, fldStrId: string) => {
      // Pressable also fires onPress on release after a long-press; the
      // guard swallows that release press so the row stays selected.
      fldObjLongPressGuard.current = true;
      actSetSelection({ fldStrType, fldArrIds: [fldStrId] });
    },
    [],
  );

  const fncRunToggleSelectedId = React.useCallback(
    (fldStrId: string) => {
      if (fldObjLongPressGuard.current) {
        fldObjLongPressGuard.current = false;
        return;
      }
      if (fldObjSelection === null) {
        return;
      }
      const fldBooSelected = fldObjSelection.fldArrIds.includes(fldStrId);
      actSetSelection({
        fldStrType: fldObjSelection.fldStrType,
        fldArrIds: fldBooSelected
          ? fldObjSelection.fldArrIds.filter(
              fldStrKept => fldStrKept !== fldStrId,
            )
          : [...fldObjSelection.fldArrIds, fldStrId],
      });
    },
    [fldObjSelection],
  );

  const fncRunToggleSelectAll = React.useCallback(() => {
    if (fldObjSelection === null) {
      return;
    }
    const fldArrVisibleIds =
      fldObjSelection.fldStrType === 'collection'
        ? fldArrVisibleCollectionIds
        : fldObjSelection.fldStrType === 'set'
        ? fldArrVisibleSetIds
        : fldArrVisibleProductIds;
    const fldBooAllSelected =
      fldArrVisibleIds.length > 0 &&
      fldArrVisibleIds.every(fldStrId =>
        fldObjSelection.fldArrIds.includes(fldStrId),
      );
    actSetSelection({
      fldStrType: fldObjSelection.fldStrType,
      fldArrIds: fldBooAllSelected ? [] : [...fldArrVisibleIds],
    });
  }, [
    fldObjSelection,
    fldArrVisibleCollectionIds,
    fldArrVisibleSetIds,
    fldArrVisibleProductIds,
  ]);

  const fncRunCancelSelection = React.useCallback(() => {
    actSetSelection(null);
  }, []);

  const fldStrMoveCurrentId = fncConvMoveInitialTarget(
    fldObjSelection,
    fldArrSetProducts,
    fldStrParentId,
  );
  const fldArrMoveRows = React.useMemo(
    () =>
      fldObjMoveTree === null || fldObjSelection === null
        ? []
        : fncConvMoveTreeToRows(
            fldObjMoveTree,
            fldObjSelection.fldStrType,
            fldObjSelection.fldArrIds,
            fldStrMoveTargetId,
            fldStrMoveCurrentId,
            fldStrWorkspaceId ?? '',
            fldStrParentId,
          ),
    [
      fldObjMoveTree,
      fldObjSelection,
      fldStrMoveTargetId,
      fldStrMoveCurrentId,
      fldStrWorkspaceId,
      fldStrParentId,
    ],
  );
  const fldObjMoveTargetRow = fldArrMoveRows.find(
    fldObjRow => fldObjRow.fldStrId === fldStrMoveTargetId,
  );
  let fldBooMoveConfirmDisabled = true;
  if (
    fldObjSelection !== null &&
    fldObjMoveTargetRow !== undefined &&
    !fldObjMoveTargetRow.fldBooInvalid
  ) {
    if (
      fldObjSelection.fldStrType === 'product' &&
      fldObjMoveTargetRow.fldStrKind === 'set'
    ) {
      fldBooMoveConfirmDisabled = fldObjSelection.fldArrIds.every(
        fldStrId =>
          fldArrSetProducts.find(
            fldObjProduct => fldObjProduct.fldStrId === fldStrId,
          )?.fldStrSetId === fldStrMoveTargetId,
      );
    } else {
      fldBooMoveConfirmDisabled = fldStrMoveTargetId === fldStrParentId;
    }
  }

  const fncRunLoadMoveTree = React.useCallback(
    (fldStrSelectAfter: string | null) => {
      actSetMoveTreeLoading(true);
      actSetMoveTreeError(null);
      let fldBooCancelled = false;
      srvApiGetDemoMoveTree(fldObjClient, fldStrWorkspaceId ?? '').then(
        fldObjTree => {
          if (fldBooCancelled) {
            return;
          }
          actSetMoveTree(fldObjTree);
          actSetMoveTreeLoading(false);
          if (fldStrSelectAfter !== null) {
            actSetMoveTargetId(fldStrSelectAfter);
          }
        },
        (fldObjError: unknown) => {
          if (!fldBooCancelled) {
            actSetMoveTreeLoading(false);
            actSetMoveTreeError((fldObjError as Error).message);
          }
        },
      );
      return () => {
        fldBooCancelled = true;
      };
    },
    [fldObjClient, fldStrWorkspaceId],
  );

  const fncRunOpenMovePicker = React.useCallback(() => {
    if (fldObjSelection === null || fldObjSelection.fldArrIds.length === 0) {
      return;
    }
    actSetMoveTargetId(
      fncConvMoveInitialTarget(
        fldObjSelection,
        fldArrSetProducts,
        fldStrParentId,
      ),
    );
    actSetMoveDraftName('');
    actSetMoveCreateError(null);
    actSetMoveError(null);
    actSetMoving(false);
    actSetMoveCreatingKind(null);
    actSetMoveTree(null);
    actSetMoveVisible(true);
    fncRunLoadMoveTree(null);
  }, [fldObjSelection, fldArrSetProducts, fldStrParentId, fncRunLoadMoveTree]);

  const fncRunCreateMoveCollection = React.useCallback(() => {
    if (!vldChgIsTextPresent(fldStrMoveDraftName)) {
      actSetMoveCreateError(fldObjMovePickerCopy.fldStrNameRequired);
      return;
    }
    if (fldStrMoveTargetId === null) {
      return;
    }
    actSetMoveCreatingKind('collection');
    actSetMoveCreateError(null);
    srvApiCreateDemoCollection(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      fldStrWorkspaceId ?? '',
      fldStrMoveTargetId,
      fldStrMoveDraftName,
    ).then(
      fldStrNewId => {
        actSetMoveDraftName('');
        actSetMoveCreatingKind(null);
        fncRunLoadMoveTree(fldStrNewId);
      },
      (fldObjError: unknown) => {
        actSetMoveCreatingKind(null);
        actSetMoveCreateError((fldObjError as Error).message);
      },
    );
  }, [
    fldObjClient,
    fldObjSession,
    fldObjMovePickerCopy,
    fldStrMoveDraftName,
    fldStrMoveTargetId,
    fldStrWorkspaceId,
    fncRunLoadMoveTree,
  ]);

  const fncRunCreateMoveSet = React.useCallback(() => {
    if (!vldChgIsTextPresent(fldStrMoveDraftName)) {
      actSetMoveCreateError(fldObjMovePickerCopy.fldStrNameRequired);
      return;
    }
    if (fldStrMoveTargetId === null) {
      return;
    }
    actSetMoveCreatingKind('set');
    actSetMoveCreateError(null);
    srvApiCreateDemoSet(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      fldStrMoveTargetId,
      fldStrMoveDraftName,
    ).then(
      fldStrNewId => {
        actSetMoveDraftName('');
        actSetMoveCreatingKind(null);
        fncRunLoadMoveTree(fldStrNewId);
      },
      (fldObjError: unknown) => {
        actSetMoveCreatingKind(null);
        actSetMoveCreateError((fldObjError as Error).message);
      },
    );
  }, [
    fldObjClient,
    fldObjSession,
    fldObjMovePickerCopy,
    fldStrMoveDraftName,
    fldStrMoveTargetId,
    fncRunLoadMoveTree,
  ]);

  const fncRunConfirmMove = React.useCallback(() => {
    if (fldObjSelection === null || fldStrMoveTargetId === null) {
      return;
    }
    const fldStrTargetId = fldStrMoveTargetId;
    const fldObjMoving = fldObjSelection;
    const fldStrTargetKind = fldArrMoveRows.find(
      fldObjRow => fldObjRow.fldStrId === fldStrTargetId,
    )?.fldStrKind;
    actSetMoving(true);
    actSetMoveError(null);
    let fldObjMoveCall: Promise<unknown>;
    if (fldObjMoving.fldStrType === 'collection') {
      fldObjMoveCall = srvApiMoveDemoCollections(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        fldObjMoving.fldArrIds,
        fldStrTargetId,
      );
    } else if (fldObjMoving.fldStrType === 'set') {
      fldObjMoveCall = srvApiMoveDemoSets(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        fldObjMoving.fldArrIds,
        fldStrTargetId,
      );
    } else if (fldStrTargetKind === 'set') {
      fldObjMoveCall = srvApiMoveDemoProductsToSet(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        fldObjMoving.fldArrIds,
        fldStrTargetId,
      );
    } else {
      fldObjMoveCall = srvApiMoveDemoProductsToCollection(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        fldObjMoving.fldArrIds,
        fldStrTargetId,
      );
    }
    fldObjMoveCall.then(
      () => {
        actSetMoving(false);
        actSetMoveVisible(false);
        actSetSelection(null);
        fncRunLoad();
      },
      (fldObjError: unknown) => {
        actSetMoving(false);
        actSetMoveError((fldObjError as Error).message);
      },
    );
  }, [
    fldObjClient,
    fldObjSession,
    fldObjSelection,
    fldStrMoveTargetId,
    fldArrMoveRows,
    fncRunLoad,
  ]);

  const fldArrMergeRows = React.useMemo(
    () =>
      fldObjMergeTree === null || fldObjSelection === null
        ? []
        : fncConvMergeTreeToRows(
            fldObjMergeTree,
            fldObjSelection.fldArrIds,
            fldStrMergeTargetId,
            fldStrWorkspaceId ?? '',
          ),
    [fldObjMergeTree, fldObjSelection, fldStrMergeTargetId, fldStrWorkspaceId],
  );
  const fldObjMergeTargetRow = fldArrMergeRows.find(
    fldObjRow => fldObjRow.fldStrId === fldStrMergeTargetId,
  );
  const fldBooMergeDraftActive = vldChgIsTextPresent(fldStrMergeDraftName);
  const fldStrMergeIntoName = fldBooMergeDraftActive
    ? fldStrMergeDraftName.trim()
    : fldObjMergeTargetRow?.fldStrName ?? '';
  const fldBooMergeConfirmDisabled =
    fldObjSelection === null ||
    fldObjSelection.fldArrIds.length < 2 ||
    (!fldBooMergeDraftActive &&
      (fldObjMergeTargetRow === undefined ||
        fldObjMergeTargetRow.fldBooInvalid));

  const fncRunLoadMergeTree = React.useCallback(() => {
    actSetMergeTreeLoading(true);
    actSetMergeTreeError(null);
    let fldBooCancelled = false;
    srvApiGetDemoMoveTree(fldObjClient, fldStrWorkspaceId ?? '').then(
      fldObjTree => {
        if (fldBooCancelled) {
          return;
        }
        actSetMergeTree(fldObjTree);
        actSetMergeTreeLoading(false);
      },
      (fldObjError: unknown) => {
        if (!fldBooCancelled) {
          actSetMergeTreeLoading(false);
          actSetMergeTreeError((fldObjError as Error).message);
        }
      },
    );
    return () => {
      fldBooCancelled = true;
    };
  }, [fldObjClient, fldStrWorkspaceId]);

  const fncRunOpenMergePicker = React.useCallback(() => {
    if (fldObjSelection === null || fldObjSelection.fldArrIds.length < 2) {
      return;
    }
    actSetMergeTargetId(null);
    actSetMergeDraftName('');
    actSetMergeError(null);
    actSetMerging(false);
    actSetMergeTree(null);
    actSetMergeVisible(true);
    fncRunLoadMergeTree();
  }, [fldObjSelection, fncRunLoadMergeTree]);

  const fncRunConfirmMerge = React.useCallback(() => {
    if (fldObjSelection === null || fldObjSelection.fldArrIds.length < 2) {
      return;
    }
    const fldBooDraftActive = vldChgIsTextPresent(fldStrMergeDraftName);
    if (
      !fldBooDraftActive &&
      (fldObjMergeTargetRow === undefined || fldObjMergeTargetRow.fldBooInvalid)
    ) {
      return;
    }
    actSetMerging(true);
    actSetMergeError(null);
    srvApiMergeDemoCollections(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      fldObjSelection.fldArrIds,
      fldBooDraftActive
        ? {
            fldStrKind: 'new',
            fldStrName: fldStrMergeDraftName.trim(),
            fldStrParentId: fldStrParentId,
          }
        : {
            fldStrKind: 'existing',
            fldStrCollectionId: fldStrMergeTargetId ?? '',
          },
    ).then(
      () => {
        actSetMerging(false);
        actSetMergeVisible(false);
        actSetSelection(null);
        fncRunLoad();
      },
      (fldObjError: unknown) => {
        actSetMerging(false);
        actSetMergeError((fldObjError as Error).message);
      },
    );
  }, [
    fldObjClient,
    fldObjSession,
    fldObjSelection,
    fldStrMergeDraftName,
    fldStrMergeTargetId,
    fldObjMergeTargetRow,
    fldStrParentId,
    fncRunLoad,
  ]);

  const fldObjBatchScope = React.useMemo(
    () =>
      fldObjBatchTree === null
        ? null
        : fncConvTreeToLeafScope(fldObjBatchTree, fldStrParentId),
    [fldObjBatchTree, fldStrParentId],
  );
  const fldNumBatchSelectedSets =
    fldObjSelection?.fldStrType === 'set'
      ? fldArrSelectedIds.length
      : new Set(
          fldArrSelectedIds
            .map(
              fldStrId =>
                fldArrSetProducts.find(
                  fldObjProduct => fldObjProduct.fldStrId === fldStrId,
                )?.fldStrSetId ?? null,
            )
            .filter(
              (fldStrSetId): fldStrSetId is string => fldStrSetId !== null,
            ),
        ).size;
  const fldNumBatchSelectedProducts =
    fldObjSelection?.fldStrType === 'product'
      ? fldArrSelectedIds.length
      : fldArrSetProducts.filter(fldObjProduct =>
          fldArrSelectedIds.includes(fldObjProduct.fldStrSetId ?? ''),
        ).length;
  const fldStrBatchSummary = (() => {
    if (fldObjBatchMode === 'convert') {
      const fldNumLeaves = fldObjBatchScope?.fldArrLeafIds.length ?? 0;
      const fldNumProducts = fldObjBatchScope?.fldArrProductIds.length ?? 0;
      return (
        `${fldNumLeaves} ${fldObjSetBatchCopy.fldStrLeavesLabel} · ` +
        `${fldNumProducts} ${fldObjSetBatchCopy.fldStrProductsLabel}`
      );
    }
    return (
      `${fldNumBatchSelectedSets} ${fldObjSetBatchCopy.fldStrSetsLabel} · ` +
      `${fldNumBatchSelectedProducts} ${fldObjSetBatchCopy.fldStrProductsLabel}`
    );
  })();
  const fldBooBatchNameVisible = fldObjBatchMode !== 'extract';
  const fldStrBatchIntoName =
    fldObjBatchMode === 'extract' ? '' : fldStrBatchDraftName.trim();
  const fldBooBatchConfirmDisabled =
    fldObjBatchMode === null ||
    fldBooBatchLoading ||
    fldStrBatchLoadError !== null ||
    (fldObjBatchMode === 'convert' &&
      (fldObjBatchScope === null ||
        fldObjBatchScope.fldArrProductIds.length === 0)) ||
    (fldBooBatchNameVisible && !vldChgIsTextPresent(fldStrBatchDraftName));

  const fncRunLoadBatchTree = React.useCallback(() => {
    actSetBatchLoading(true);
    actSetBatchLoadError(null);
    let fldBooCancelled = false;
    srvApiGetDemoMoveTree(fldObjClient, fldStrWorkspaceId ?? '').then(
      fldObjTree => {
        if (fldBooCancelled) {
          return;
        }
        actSetBatchTree(fldObjTree);
        actSetBatchLoading(false);
      },
      (fldObjError: unknown) => {
        if (!fldBooCancelled) {
          actSetBatchLoading(false);
          actSetBatchLoadError((fldObjError as Error).message);
        }
      },
    );
    return () => {
      fldBooCancelled = true;
    };
  }, [fldObjClient, fldStrWorkspaceId]);

  const fncRunOpenSetMerge = React.useCallback(() => {
    if (fldObjSelection === null || fldObjSelection.fldArrIds.length < 2) {
      return;
    }
    if (
      fldObjSelection.fldStrType !== 'set' &&
      fldObjSelection.fldStrType !== 'product'
    ) {
      return;
    }
    actSetBatchDraftName('');
    actSetBatchError(null);
    actSetBatchWorking(false);
    actSetBatchTree(null);
    actSetBatchLoadError(null);
    actSetBatchLoading(false);
    actSetBatchMode('merge');
  }, [fldObjSelection]);

  const fncRunOpenSetExtract = React.useCallback(() => {
    if (fldObjSelection === null || fldObjSelection.fldArrIds.length === 0) {
      return;
    }
    if (
      fldObjSelection.fldStrType !== 'set' &&
      fldObjSelection.fldStrType !== 'product'
    ) {
      return;
    }
    actSetBatchDraftName('');
    actSetBatchError(null);
    actSetBatchWorking(false);
    actSetBatchTree(null);
    actSetBatchLoadError(null);
    actSetBatchLoading(false);
    actSetBatchMode('extract');
  }, [fldObjSelection]);

  const fncRunOpenConvert = React.useCallback(() => {
    actSetBatchDraftName('');
    actSetBatchError(null);
    actSetBatchWorking(false);
    actSetBatchTree(null);
    actSetBatchMode('convert');
    fncRunLoadBatchTree();
  }, [fncRunLoadBatchTree]);

  const fncRunConfirmBatch = React.useCallback(() => {
    if (fldObjBatchMode === null) {
      return;
    }
    if (fldObjBatchMode === 'convert') {
      if (
        fldObjBatchScope === null ||
        fldObjBatchScope.fldArrProductIds.length === 0 ||
        !vldChgIsTextPresent(fldStrBatchDraftName)
      ) {
        return;
      }
      actSetBatchWorking(true);
      actSetBatchError(null);
      srvApiConvertDemoLeafProducts(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        fldStrWorkspaceId ?? '',
        fldStrParentId,
        fldStrBatchDraftName.trim(),
      ).then(
        () => {
          actSetBatchWorking(false);
          actSetBatchMode(null);
          fncRunLoad();
        },
        (fldObjError: unknown) => {
          actSetBatchWorking(false);
          actSetBatchError((fldObjError as Error).message);
        },
      );
      return;
    }
    if (fldObjSelection === null || fldObjSelection.fldArrIds.length === 0) {
      return;
    }
    const fldObjSource =
      fldObjSelection.fldStrType === 'set'
        ? {
            fldStrKind: 'sets' as const,
            fldArrIds: fldObjSelection.fldArrIds,
          }
        : {
            fldStrKind: 'products' as const,
            fldArrIds: fldObjSelection.fldArrIds,
          };
    if (
      fldObjSelection.fldStrType !== 'set' &&
      fldObjSelection.fldStrType !== 'product'
    ) {
      return;
    }
    if (
      fldObjBatchMode === 'merge' &&
      (fldObjSelection.fldArrIds.length < 2 ||
        !vldChgIsTextPresent(fldStrBatchDraftName))
    ) {
      return;
    }
    actSetBatchWorking(true);
    actSetBatchError(null);
    const fldObjDone = () => {
      actSetBatchWorking(false);
      actSetBatchMode(null);
      actSetSelection(null);
      fncRunLoad();
    };
    const fldObjFailed = (fldObjError: unknown) => {
      actSetBatchWorking(false);
      actSetBatchError((fldObjError as Error).message);
    };
    if (fldObjBatchMode === 'merge') {
      srvApiMergeDemoSetContents(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        fldObjSource,
        fldStrBatchDraftName.trim(),
        fldStrParentId,
      ).then(fldObjDone, fldObjFailed);
    } else {
      srvApiExtractDemoSetContents(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        fldObjSource,
      ).then(fldObjDone, fldObjFailed);
    }
  }, [
    fldObjBatchMode,
    fldObjBatchScope,
    fldObjClient,
    fldObjSession,
    fldStrWorkspaceId,
    fldStrParentId,
    fldStrBatchDraftName,
    fldObjSelection,
    fncRunLoad,
  ]);

  const fldStrDeleteSummary = (() => {
    if (fldObjSelection === null || fldObjDeletePreview === null) {
      return '';
    }
    const fldStrMedia =
      `${fldObjDeletePreview.fldNumPhotos} ` +
      `${fldObjDeleteCopy.fldStrPhotosLabel} · ` +
      `${fldObjDeletePreview.fldNumVoices} ` +
      `${fldObjDeleteCopy.fldStrVoicesLabel}`;
    if (fldObjSelection.fldStrType === 'collection') {
      return (
        `${fldArrSelectedIds.length} ` +
        `${fldObjDeleteCopy.fldStrCollectionsLabel} · ` +
        `${fldObjDeletePreview.fldNumSets} ` +
        `${fldObjDeleteCopy.fldStrSetsLabel} · ` +
        `${fldObjDeletePreview.fldNumProducts} ` +
        `${fldObjDeleteCopy.fldStrProductsLabel} · ${fldStrMedia}`
      );
    }
    if (fldObjSelection.fldStrType === 'set') {
      return (
        `${fldArrSelectedIds.length} ${fldObjDeleteCopy.fldStrSetsLabel} · ` +
        `${fldObjDeletePreview.fldNumProducts} ` +
        `${fldObjDeleteCopy.fldStrProductsLabel} · ${fldStrMedia}`
      );
    }
    return (
      `${fldArrSelectedIds.length} ` +
      `${fldObjDeleteCopy.fldStrProductsLabel} · ${fldStrMedia}`
    );
  })();
  const fldBooDeleteConfirmDisabled =
    fldObjSelection === null ||
    fldObjDeletePreview === null ||
    fldBooDeleteLoading ||
    fldStrDeleteLoadError !== null ||
    fldObjDeletePreview.fldBooBlocked;

  const fncRunLoadDeletePreview = React.useCallback(() => {
    if (fldObjSelection === null || fldObjSelection.fldArrIds.length === 0) {
      return () => undefined;
    }
    const fldObjActiveSelection = fldObjSelection;
    actSetDeleteLoading(true);
    actSetDeleteLoadError(null);
    actSetDeletePreview(null);
    let fldBooCancelled = false;
    const fncRunFinish = (fldObjPreview: fldObjDeletePreview): void => {
      if (!fldBooCancelled) {
        actSetDeletePreview(fldObjPreview);
        actSetDeleteLoading(false);
      }
    };
    const fncRunFail = (fldObjError: unknown): void => {
      if (!fldBooCancelled) {
        actSetDeleteLoading(false);
        actSetDeleteLoadError((fldObjError as Error).message);
      }
    };
    if (fldObjActiveSelection.fldStrType === 'collection') {
      srvApiGetDemoMoveTree(fldObjClient, fldStrWorkspaceId ?? '').then(
        fldObjTree => {
          if (fldBooCancelled) {
            return;
          }
          const fldObjSelected = new Set(fldObjActiveSelection.fldArrIds);
          const fldBooBlocked = fldObjTree.fldArrNodes.some(
            fldObjNode =>
              fldObjNode.fldStrKind === 'collection' &&
              fldObjNode.fldStrParentId !== null &&
              fldObjSelected.has(fldObjNode.fldStrParentId),
          );
          const fldArrSetIds = fldObjTree.fldArrSets
            .filter(fldObjSet =>
              fldObjSelected.has(fldObjSet.fldStrCollectionId),
            )
            .map(fldObjSet => fldObjSet.fldStrId);
          const fldArrProductIds = fldObjTree.fldArrProducts
            .filter(fldObjProduct =>
              fldObjSelected.has(fldObjProduct.fldStrCollectionId),
            )
            .map(fldObjProduct => fldObjProduct.fldStrId);
          if (fldBooBlocked) {
            fncRunFinish({
              fldNumSets: fldArrSetIds.length,
              fldNumProducts: fldArrProductIds.length,
              fldNumPhotos: 0,
              fldNumVoices: 0,
              fldBooBlocked: true,
            });
            return;
          }
          srvApiGetDemoMediaCounts(fldObjClient, fldArrProductIds).then(
            fldObjCounts => {
              fncRunFinish({
                fldNumSets: fldArrSetIds.length,
                fldNumProducts: fldArrProductIds.length,
                fldNumPhotos: fldObjCounts.fldNumPhotos,
                fldNumVoices: fldObjCounts.fldNumVoices,
                fldBooBlocked: false,
              });
            },
            fncRunFail,
          );
        },
        fncRunFail,
      );
    } else {
      const fldArrProductIds =
        fldObjActiveSelection.fldStrType === 'product'
          ? [...fldObjActiveSelection.fldArrIds]
          : fldArrSetProducts
              .filter(fldObjProduct =>
                fldObjActiveSelection.fldArrIds.includes(
                  fldObjProduct.fldStrSetId ?? '',
                ),
              )
              .map(fldObjProduct => fldObjProduct.fldStrId);
      const fldNumSets =
        fldObjActiveSelection.fldStrType === 'set'
          ? fldObjActiveSelection.fldArrIds.length
          : 0;
      srvApiGetDemoMediaCounts(fldObjClient, fldArrProductIds).then(
        fldObjCounts => {
          fncRunFinish({
            fldNumSets,
            fldNumProducts: fldArrProductIds.length,
            fldNumPhotos: fldObjCounts.fldNumPhotos,
            fldNumVoices: fldObjCounts.fldNumVoices,
            fldBooBlocked: false,
          });
        },
        fncRunFail,
      );
    }
    return () => {
      fldBooCancelled = true;
    };
  }, [fldObjClient, fldStrWorkspaceId, fldObjSelection, fldArrSetProducts]);

  const fncRunOpenDelete = React.useCallback(() => {
    if (fldObjSelection === null || fldObjSelection.fldArrIds.length === 0) {
      return;
    }
    actSetDeleteError(null);
    actSetDeleting(false);
    actSetDeletePreview(null);
    actSetDeleteLoadError(null);
    actSetDeletePending(null);
    actSetDeleteVisible(true);
    fncRunLoadDeletePreview();
  }, [fldObjSelection, fncRunLoadDeletePreview]);

  const fncRunConfirmDelete = React.useCallback(() => {
    if (
      fldObjSelection === null ||
      fldObjSelection.fldArrIds.length === 0 ||
      fldObjDeletePreview === null ||
      fldObjDeletePreview.fldBooBlocked
    ) {
      return;
    }
    actSetDeleting(true);
    actSetDeleteError(null);
    const fldObjDone = () => {
      actSetDeleting(false);
      actSetDeleteVisible(false);
      actSetDeletePending(null);
      actSetSelection(null);
      fncRunLoad();
    };
    const fldObjFailed = (fldObjError: unknown) => {
      actSetDeleting(false);
      actSetDeleteError((fldObjError as Error).message);
    };
    const fldObjSettled = (fldObjSummary: {
      fldArrFailedFiles: fldObjDeleteFileRef[];
      fldArrFailedPrefixes: fldObjDeletePrefixRef[];
    }) => {
      if (
        fldObjSummary.fldArrFailedFiles.length === 0 &&
        fldObjSummary.fldArrFailedPrefixes.length === 0
      ) {
        fldObjDone();
        return;
      }
      actSetDeleting(false);
      actSetDeletePending({
        fldArrFiles: fldObjSummary.fldArrFailedFiles,
        fldArrPrefixes: fldObjSummary.fldArrFailedPrefixes,
      });
      actSetDeleteError(fldObjDeleteCopy.fldStrFilesLeft);
    };
    if (fldObjDeletePending !== null) {
      srvApiRetryDemoDeleteFiles(
        fldObjClient,
        fldObjDeletePending.fldArrFiles,
        fldObjDeletePending.fldArrPrefixes,
      ).then(fldObjSettled, fldObjFailed);
      return;
    }
    if (fldObjSelection.fldStrType === 'collection') {
      srvApiDeleteDemoCollections(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        fldStrWorkspaceId ?? '',
        fldObjSelection.fldArrIds,
      ).then(fldObjSettled, fldObjFailed);
    } else if (fldObjSelection.fldStrType === 'set') {
      srvApiDeleteDemoSets(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        fldObjSelection.fldArrIds,
      ).then(fldObjSettled, fldObjFailed);
    } else {
      srvApiDeleteDemoProducts(
        fldObjClient,
        fldObjSession?.fldStrSessionId ?? '',
        fldObjSelection.fldArrIds,
      ).then(fldObjSettled, fldObjFailed);
    }
  }, [
    fldObjClient,
    fldObjSession,
    fldStrWorkspaceId,
    fldObjSelection,
    fldObjDeletePreview,
    fldObjDeletePending,
    fldObjDeleteCopy,
    fncRunLoad,
  ]);

  const fncRunSaveShortcut = React.useCallback(() => {
    const fldBooNameOk = vldChgIsTextPresent(fldStrShortcutName);
    actSetShortcutNameError(
      fldBooNameOk ? undefined : fldObjShortcutCopy.fldStrNameRequired,
    );
    if (!fldBooNameOk) {
      return;
    }
    actSetShortcutSaving(true);
    actSetShortcutSaveError(null);
    srvApiCreateDemoCollection(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      fldStrWorkspaceId ?? '',
      fldStrParentId,
      fldStrShortcutName,
    ).then(
      () => {
        actSetShortcutName('');
        actSetShortcutSaving(false);
        fncRunLoad();
      },
      (fldObjError: unknown) => {
        actSetShortcutSaving(false);
        actSetShortcutSaveError((fldObjError as Error).message);
      },
    );
  }, [
    fldObjClient,
    fldObjSession,
    fldObjShortcutCopy,
    fldStrParentId,
    fldStrShortcutName,
    fldStrWorkspaceId,
    fncRunLoad,
  ]);

  const fncRunSaveSet = React.useCallback(() => {
    const fldBooNameOk = vldChgIsTextPresent(fldStrSetName);
    actSetSetNameError(
      fldBooNameOk ? undefined : fldObjSetShortcutCopy.fldStrNameRequired,
    );
    if (!fldBooNameOk) {
      return;
    }
    actSetSetSaving(true);
    actSetSetSaveError(null);
    srvApiCreateDemoSet(
      fldObjClient,
      fldObjSession?.fldStrSessionId ?? '',
      fldStrParentId,
      fldStrSetName,
    ).then(
      () => {
        actSetSetName('');
        actSetSetSaving(false);
        actSetSetModalVisible(false);
        fncRunLoad();
      },
      (fldObjError: unknown) => {
        actSetSetSaving(false);
        actSetSetSaveError((fldObjError as Error).message);
      },
    );
  }, [
    fldObjClient,
    fldObjSession,
    fldObjSetShortcutCopy,
    fldStrParentId,
    fldStrSetName,
    fncRunLoad,
  ]);

  return (
    <SafeAreaView style={scrCollectionBrowserStyles.fldObjScreen}>
      <ScrollView style={scrCollectionBrowserStyles.fldObjScroll}>
        <View style={scrCollectionBrowserStyles.fldObjGap}>
          <VwBrandHeader
            fldStrName={fldObjBrandCopy.fldStrName}
            fldStrSuffix={fldObjBrandCopy.fldStrSuffix}
          />
        </View>
        {fldBooSelecting && (
          <View style={scrCollectionBrowserStyles.fldObjGap}>
            <VwButton
              fldStrLabel={fldObjMultiSelectCopy.fldStrSelectAll}
              actHandOnPress={fncRunToggleSelectAll}
            />
          </View>
        )}
        <View style={scrCollectionBrowserStyles.fldObjHeader}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrBack}
            actHandOnPress={() => {
              if (fldBooSelecting) {
                fncRunCancelSelection();
              } else {
                fldObjNavigation.goBack();
              }
            }}
          />
          <VwText fldStrVariant="header">{fldStrTitle}</VwText>
          {fldBooIsLibraryRoot ? (
            <VwButton
              fldStrLabel={fldObjCopy.fldStrLibrarySettings}
              actHandOnPress={() => {
                fldObjNavigation.navigate('LibrarySettings', {
                  fldStrLibraryId,
                  fldStrLibraryName,
                });
              }}
            />
          ) : (
            <VwButton
              fldStrLabel={fldObjCopy.fldStrCollectionSettings}
              actHandOnPress={() => {
                fldObjNavigation.navigate('CollectionSettings', {
                  fldStrCollectionId: fldStrParentId,
                  fldStrCollectionName: fldStrTitle,
                });
              }}
            />
          )}
        </View>
        <VwText fldStrVariant="header">
          {fldObjCopy.fldStrCollectionsTitle}
        </VwText>
        {fldStrError !== null ? (
          <View style={scrCollectionBrowserStyles.fldObjGap}>
            <VwEmptyState
              fldStrTitle={fldObjCopy.fldStrErrorTitle}
              fldStrMessage={fldStrError}
            />
            <VwButton
              fldStrLabel={fldObjCopy.fldStrRetry}
              actHandOnPress={fncRunLoad}
            />
          </View>
        ) : fldArrCollections === null ? (
          <VwLoading fldStrMessage={fldObjCopy.fldStrLoading} />
        ) : fldArrCollections.length === 0 ? (
          <VwEmptyState fldStrTitle={fldObjCopy.fldStrEmptyTitle} />
        ) : (
          fldArrCollections.map(fldObjItem => (
            <VwListRow
              key={fldObjItem.fldStrId}
              fldStrTitle={fldObjItem.fldStrName}
              fldBooChecked={
                fldBooCollectionMode
                  ? fldArrSelectedIds.includes(fldObjItem.fldStrId)
                  : null
              }
              fldBooChevron
              actHandOnPress={
                fldBooCollectionMode
                  ? () => {
                      fncRunToggleSelectedId(fldObjItem.fldStrId);
                    }
                  : fldBooSelecting
                  ? undefined
                  : () => {
                      fldObjNavigation.push('CollectionBrowser', {
                        fldStrLibraryId,
                        fldStrLibraryName,
                        fldStrParentId: fldObjItem.fldStrId,
                        fldStrTitle: fldObjItem.fldStrName,
                      });
                    }
              }
              actHandOnLongPress={
                fldBooSelecting
                  ? undefined
                  : () => {
                      fncRunEnterSelection('collection', fldObjItem.fldStrId);
                    }
              }
            />
          ))
        )}
        {fldStrError === null &&
          fldArrCollections !== null &&
          !fldBooIsLibraryRoot && (
            <View style={scrCollectionBrowserStyles.fldObjSets}>
              <VwText fldStrVariant="header">
                {fldObjCopy.fldStrSetsTitle}
              </VwText>
              {fldArrSets.length === 0 ? (
                <VwEmptyState fldStrTitle={fldObjCopy.fldStrNoSetsTitle} />
              ) : (
                fldArrSets.map(fldObjSet => {
                  const fldArrMembers = fldArrSetProducts.filter(
                    fldObjProduct =>
                      fldObjProduct.fldStrSetId === fldObjSet.fldStrId,
                  );
                  return (
                    <View
                      key={fldObjSet.fldStrId}
                      style={scrCollectionBrowserStyles.fldObjSetRow}
                    >
                      <VwListRow
                        fldStrTitle={fldObjSet.fldStrName}
                        fldStrSubtitle={`${fldObjCopy.fldStrMembersLabel}: ${fldArrMembers.length}`}
                        fldBooChecked={
                          fldBooSetMode
                            ? fldArrSelectedIds.includes(fldObjSet.fldStrId)
                            : null
                        }
                        actHandOnPress={
                          fldBooSetMode
                            ? () => {
                                fncRunToggleSelectedId(fldObjSet.fldStrId);
                              }
                            : undefined
                        }
                        actHandOnLongPress={
                          fldBooSelecting
                            ? undefined
                            : () => {
                                fncRunEnterSelection('set', fldObjSet.fldStrId);
                              }
                        }
                      />
                      {fldArrMembers.map(fldObjProduct => (
                        <View
                          key={fldObjProduct.fldStrId}
                          style={scrCollectionBrowserStyles.fldObjSetProduct}
                        >
                          <VwListRow
                            fldStrTitle={fldObjProduct.fldStrName}
                            fldStrSubtitle={fncConvPhotoSubtitle(
                              fldObjProduct.fldStrId,
                            )}
                            fldBooChecked={
                              fldBooProductMode
                                ? fldArrSelectedIds.includes(
                                    fldObjProduct.fldStrId,
                                  )
                                : null
                            }
                            actHandOnPress={
                              fldBooProductMode
                                ? () => {
                                    fncRunToggleSelectedId(
                                      fldObjProduct.fldStrId,
                                    );
                                  }
                                : undefined
                            }
                            actHandOnLongPress={
                              fldBooSelecting
                                ? undefined
                                : () => {
                                    fncRunEnterSelection(
                                      'product',
                                      fldObjProduct.fldStrId,
                                    );
                                  }
                            }
                          />
                        </View>
                      ))}
                    </View>
                  );
                })
              )}
              <View style={scrCollectionBrowserStyles.fldObjSets}>
                <VwText fldStrVariant="header">
                  {fldObjCopy.fldStrProductsTitle}
                </VwText>
                {fldArrLooseProducts.length === 0 ? (
                  <VwEmptyState
                    fldStrTitle={fldObjCopy.fldStrNoProductsTitle}
                  />
                ) : (
                  fldArrLooseProducts.map(fldObjProduct => (
                    <VwListRow
                      key={fldObjProduct.fldStrId}
                      fldStrTitle={fldObjProduct.fldStrName}
                      fldStrSubtitle={fncConvPhotoSubtitle(
                        fldObjProduct.fldStrId,
                      )}
                      fldBooChecked={
                        fldBooProductMode
                          ? fldArrSelectedIds.includes(fldObjProduct.fldStrId)
                          : null
                      }
                      actHandOnPress={
                        fldBooProductMode
                          ? () => {
                              fncRunToggleSelectedId(fldObjProduct.fldStrId);
                            }
                          : undefined
                      }
                      actHandOnLongPress={
                        fldBooSelecting
                          ? undefined
                          : () => {
                              fncRunEnterSelection(
                                'product',
                                fldObjProduct.fldStrId,
                              );
                            }
                      }
                    />
                  ))
                )}
              </View>
              {!fldBooSelecting && (
                <View style={scrCollectionBrowserStyles.fldObjGap}>
                  <VwButton
                    fldStrLabel={fldObjCopy.fldStrNewSet}
                    actHandOnPress={() => {
                      actSetSetName('');
                      actSetSetNameError(undefined);
                      actSetSetSaveError(null);
                      actSetSetModalVisible(true);
                    }}
                  />
                </View>
              )}
              {!fldBooSelecting && (fldArrCollections ?? []).length > 0 && (
                <View style={scrCollectionBrowserStyles.fldObjGap}>
                  <VwButton
                    fldStrLabel={fldObjCopy.fldStrConvertAll}
                    actHandOnPress={fncRunOpenConvert}
                  />
                </View>
              )}
              {!fldBooSelecting &&
                fldArrCollections !== null &&
                fldArrCollections.length === 0 && (
                  <>
                    <View style={scrCollectionBrowserStyles.fldObjGap}>
                      <VwButton
                        fldStrLabel={fldObjCopy.fldStrSingleItem}
                        actHandOnPress={() => {
                          fldObjNavigation.navigate('CameraCapture', {
                            fldStrMode: 'single',
                            fldObjTarget: {
                              fldStrLibraryId,
                              fldStrLibraryName,
                              fldStrCollectionId: fldStrParentId,
                              fldStrCollectionName: fldStrTitle,
                            },
                          });
                        }}
                      />
                    </View>
                    <View style={scrCollectionBrowserStyles.fldObjGap}>
                      <VwButton
                        fldStrLabel={fldObjCopy.fldStrBulkItems}
                        actHandOnPress={() => {
                          fldObjNavigation.navigate('CameraCapture', {
                            fldStrMode: 'bulk',
                            fldObjTarget: {
                              fldStrLibraryId,
                              fldStrLibraryName,
                              fldStrCollectionId: fldStrParentId,
                              fldStrCollectionName: fldStrTitle,
                            },
                          });
                        }}
                      />
                    </View>
                  </>
                )}
            </View>
          )}
        {fldBooSelecting && (
          <View style={scrCollectionBrowserStyles.fldObjShortcut}>
            <View style={scrCollectionBrowserStyles.fldObjGap}>
              <VwButton
                fldStrLabel={fldObjMultiSelectCopy.fldStrCancel}
                actHandOnPress={fncRunCancelSelection}
              />
            </View>
            {fldArrSelectedIds.length > 0 && (
              <View style={scrCollectionBrowserStyles.fldObjGap}>
                <VwButton
                  fldStrLabel={fldObjMultiSelectCopy.fldStrMove}
                  actHandOnPress={fncRunOpenMovePicker}
                />
              </View>
            )}
            {fldArrSelectedIds.length >= 2 && (
              <View style={scrCollectionBrowserStyles.fldObjGap}>
                <VwButton
                  fldStrLabel={fldObjMultiSelectCopy.fldStrMerge}
                  actHandOnPress={
                    fldBooCollectionMode
                      ? fncRunOpenMergePicker
                      : fncRunOpenSetMerge
                  }
                />
              </View>
            )}
            {(fldBooSetMode || fldBooProductMode) &&
              fldArrSelectedIds.length > 0 && (
                <View style={scrCollectionBrowserStyles.fldObjGap}>
                  <VwButton
                    fldStrLabel={fldObjMultiSelectCopy.fldStrExtract}
                    actHandOnPress={fncRunOpenSetExtract}
                  />
                </View>
              )}
            {fldArrSelectedIds.length > 0 && (
              <View style={scrCollectionBrowserStyles.fldObjGap}>
                <VwButton
                  fldStrLabel={fldObjMultiSelectCopy.fldStrDelete}
                  actHandOnPress={fncRunOpenDelete}
                />
              </View>
            )}
          </View>
        )}
        {!fldBooSelecting &&
          fldStrError === null &&
          fldArrCollections !== null && (
            <View style={scrCollectionBrowserStyles.fldObjShortcut}>
              <VwText fldStrVariant="header">
                {fldObjShortcutCopy.fldStrTitle}
              </VwText>
              <View style={scrCollectionBrowserStyles.fldObjGap}>
                <VwTextInput
                  fldStrValue={fldStrShortcutName}
                  actHandOnChange={fldStrText => {
                    actSetShortcutName(fldStrText);
                    actSetShortcutNameError(undefined);
                  }}
                  fldStrPlaceholder={fldObjShortcutCopy.fldStrNamePlaceholder}
                  fldStrError={fldStrShortcutNameError}
                  fldBooDisabled={fldBooShortcutSaving}
                />
              </View>
              {fldStrShortcutSaveError !== null && (
                <View style={scrCollectionBrowserStyles.fldObjGap}>
                  <VwEmptyState
                    fldStrTitle={fldObjShortcutCopy.fldStrSaveErrorTitle}
                    fldStrMessage={fldStrShortcutSaveError}
                  />
                </View>
              )}
              <VwButton
                fldStrLabel={fldObjShortcutCopy.fldStrSave}
                fldBooLoading={fldBooShortcutSaving}
                actHandOnPress={fncRunSaveShortcut}
              />
            </View>
          )}
      </ScrollView>
      <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
      <VwSetNameModal
        fldBooVisible={fldBooSetModalVisible}
        fldStrTitle={fldObjCopy.fldStrNewSet}
        fldStrValue={fldStrSetName}
        actHandOnChange={fldStrText => {
          actSetSetName(fldStrText);
          actSetSetNameError(undefined);
        }}
        fldStrPlaceholder={fldObjSetShortcutCopy.fldStrNamePlaceholder}
        fldStrError={fldStrSetNameError}
        fldStrSaveLabel={fldObjSetShortcutCopy.fldStrSave}
        fldStrCancelLabel={fldObjSetShortcutCopy.fldStrCancel}
        fldBooSaving={fldBooSetSaving}
        fldStrSaveErrorTitle={fldObjSetShortcutCopy.fldStrSaveErrorTitle}
        fldStrSaveError={fldStrSetSaveError}
        actHandOnSave={fncRunSaveSet}
        actHandOnCancel={() => {
          actSetSetModalVisible(false);
        }}
      />
      <VwMoveDestinationModal
        fldBooVisible={fldBooMoveVisible}
        fldStrTitle={fldObjMovePickerCopy.fldStrTitle}
        fldArrRows={fldArrMoveRows}
        fldBooLoading={fldBooMoveTreeLoading}
        fldStrLoading={fldObjMovePickerCopy.fldStrLoading}
        fldStrErrorTitle={fldObjMovePickerCopy.fldStrErrorTitle}
        fldStrError={fldStrMoveTreeError}
        fldStrRetry={fldObjMovePickerCopy.fldStrRetry}
        actHandOnRetry={() => {
          fncRunLoadMoveTree(null);
        }}
        fldStrCurrent={fldObjMovePickerCopy.fldStrCurrent}
        actHandOnSelectTarget={actSetMoveTargetId}
        fldStrNamePlaceholder={fldObjMovePickerCopy.fldStrNamePlaceholder}
        fldStrDraftName={fldStrMoveDraftName}
        actHandOnDraftChange={fldStrText => {
          actSetMoveDraftName(fldStrText);
          actSetMoveCreateError(null);
        }}
        fldStrNewCollection={fldObjMovePickerCopy.fldStrNewCollection}
        fldStrNewSet={fldObjMovePickerCopy.fldStrNewSet}
        fldStrCreatingKind={fldStrMoveCreatingKind}
        actHandOnCreateCollection={fncRunCreateMoveCollection}
        actHandOnCreateSet={fncRunCreateMoveSet}
        fldStrSaveErrorTitle={fldObjMovePickerCopy.fldStrSaveErrorTitle}
        fldStrSaveError={fldStrMoveCreateError}
        fldStrMoveLabel={fldObjMovePickerCopy.fldStrMove}
        fldBooMoveDisabled={fldBooMoveConfirmDisabled}
        fldBooMoving={fldBooMoving}
        fldStrMoveErrorTitle={fldObjMovePickerCopy.fldStrMoveErrorTitle}
        fldStrMoveError={fldStrMoveError}
        actHandOnConfirmMove={fncRunConfirmMove}
        fldStrCancelLabel={fldObjMovePickerCopy.fldStrCancel}
        actHandOnCancel={() => {
          actSetMoveVisible(false);
        }}
      />
      <VwMergeCollectionsModal
        fldBooVisible={fldBooMergeVisible}
        fldStrTitle={fldObjMergeCopy.fldStrTitle}
        fldStrSources={fldObjMergeCopy.fldStrSources}
        fldNumSources={fldObjSelection?.fldArrIds.length ?? 0}
        fldStrInto={fldObjMergeCopy.fldStrInto}
        fldStrIntoName={fldStrMergeIntoName}
        fldStrNewCollection={fldObjMergeCopy.fldStrNewCollection}
        fldArrRows={fldArrMergeRows}
        fldBooLoading={fldBooMergeTreeLoading}
        fldStrLoading={fldObjMergeCopy.fldStrLoading}
        fldStrErrorTitle={fldObjMergeCopy.fldStrErrorTitle}
        fldStrError={fldStrMergeTreeError}
        fldStrRetry={fldObjMergeCopy.fldStrRetry}
        actHandOnRetry={fncRunLoadMergeTree}
        actHandOnSelectTarget={actSetMergeTargetId}
        fldStrNamePlaceholder={fldObjMergeCopy.fldStrNamePlaceholder}
        fldStrDraftName={fldStrMergeDraftName}
        actHandOnDraftChange={fldStrText => {
          actSetMergeDraftName(fldStrText);
        }}
        fldStrExisting={fldObjMergeCopy.fldStrExisting}
        fldStrMergeLabel={fldObjMergeCopy.fldStrMerge}
        fldBooMergeDisabled={fldBooMergeConfirmDisabled}
        fldBooMerging={fldBooMerging}
        fldStrMergeErrorTitle={fldObjMergeCopy.fldStrMergeErrorTitle}
        fldStrMergeError={fldStrMergeError}
        actHandOnConfirmMerge={fncRunConfirmMerge}
        fldStrCancelLabel={fldObjMergeCopy.fldStrCancel}
        actHandOnCancel={() => {
          actSetMergeVisible(false);
        }}
      />
      <VwSetBatchModal
        fldBooVisible={fldObjBatchMode !== null}
        fldStrTitle={
          fldObjBatchMode === 'extract'
            ? fldObjSetBatchCopy.fldStrExtractTitle
            : fldObjBatchMode === 'convert'
            ? fldObjSetBatchCopy.fldStrConvertTitle
            : fldObjSetBatchCopy.fldStrMergeTitle
        }
        fldStrSummary={fldStrBatchSummary}
        fldStrInto={fldObjSetBatchCopy.fldStrInto}
        fldStrIntoName={fldStrBatchIntoName}
        fldBooNameVisible={fldBooBatchNameVisible}
        fldStrNamePlaceholder={fldObjSetBatchCopy.fldStrNamePlaceholder}
        fldStrDraftName={fldStrBatchDraftName}
        actHandOnDraftChange={fldStrText => {
          actSetBatchDraftName(fldStrText);
        }}
        fldBooLoading={fldBooBatchLoading}
        fldStrLoading={fldObjSetBatchCopy.fldStrLoading}
        fldStrLoadErrorTitle={fldObjSetBatchCopy.fldStrLoadErrorTitle}
        fldStrLoadError={fldStrBatchLoadError}
        fldStrRetry={fldObjSetBatchCopy.fldStrRetry}
        actHandOnRetry={fncRunLoadBatchTree}
        fldStrConfirmLabel={
          fldObjBatchMode === 'extract'
            ? fldObjSetBatchCopy.fldStrExtract
            : fldObjBatchMode === 'convert'
            ? fldObjSetBatchCopy.fldStrConvert
            : fldObjSetBatchCopy.fldStrMerge
        }
        fldBooConfirmDisabled={fldBooBatchConfirmDisabled}
        fldBooWorking={fldBooBatchWorking}
        fldStrErrorTitle={fldObjSetBatchCopy.fldStrErrorTitle}
        fldStrError={fldStrBatchError}
        actHandOnConfirm={fncRunConfirmBatch}
        fldStrCancelLabel={fldObjSetBatchCopy.fldStrCancel}
        actHandOnCancel={() => {
          actSetBatchMode(null);
        }}
      />
      <VwDeleteConfirmModal
        fldBooVisible={fldBooDeleteVisible}
        fldStrTitle={fldObjDeleteCopy.fldStrTitle}
        fldStrSummary={fldStrDeleteSummary}
        fldStrBlockedReason={
          fldObjDeletePreview?.fldBooBlocked === true
            ? fldObjDeleteCopy.fldStrBlockedChildren
            : null
        }
        fldBooLoading={fldBooDeleteLoading}
        fldStrLoading={fldObjDeleteCopy.fldStrLoading}
        fldStrLoadErrorTitle={fldObjDeleteCopy.fldStrLoadErrorTitle}
        fldStrLoadError={fldStrDeleteLoadError}
        fldStrRetry={fldObjDeleteCopy.fldStrRetry}
        actHandOnRetry={fncRunLoadDeletePreview}
        fldStrConfirmLabel={fldObjDeleteCopy.fldStrDelete}
        fldBooConfirmDisabled={fldBooDeleteConfirmDisabled}
        fldBooWorking={fldBooDeleting}
        fldStrErrorTitle={fldObjDeleteCopy.fldStrErrorTitle}
        fldStrError={fldStrDeleteError}
        actHandOnConfirm={fncRunConfirmDelete}
        fldStrCancelLabel={fldObjDeleteCopy.fldStrCancel}
        actHandOnCancel={() => {
          actSetDeleteVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const scrCollectionBrowserStyles = StyleSheet.create({
  fldObjScreen: {
    flex: 1,
    backgroundColor: colBackground,
    padding: fldNumSpacingMd,
  },
  fldObjScroll: {
    flex: 1,
  },
  fldObjHeader: {
    marginBottom: fldNumSpacingMd,
  },
  fldObjGap: {
    marginBottom: fldNumSpacingMd,
  },
  fldObjShortcut: {
    marginTop: fldNumSpacingLg,
  },
  fldObjSets: {
    marginTop: fldNumSpacingLg,
  },
  fldObjSetRow: {
    marginTop: fldNumSpacingMd,
  },
  fldObjSetProduct: {
    marginLeft: fldNumSpacingMd,
  },
});
