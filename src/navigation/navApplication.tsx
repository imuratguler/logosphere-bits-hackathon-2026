/**
 * Logosphere BITS — application navigation (splash + persona selection).
 *
 * Six routes: Splash (launch/restore loading), PersonaSelection
 * (demo persona choice), Home (shared libraries; every persona
 * opens the same shared data), CollectionBrowser (one recursive
 * collections level, pushed again per sub-collection),
 * LibrarySettings (library detail editor), and CollectionSettings
 * (collection detail editor). The screen list never changes;
 * a phase effect resets the stack to the phase route — except while
 * a settings form is open, so a background phase change never
 * discards it (the browser holds no unsaved state, so it resets
 * with the phase) — and no remount ever tears down the native stack
 * (remounting wedged it on device).
 *
 * Android back is
 * the installed default (useBackButton.native: pop when possible,
 * else let the system exit); phase routes stay depth-1, so back
 * exits there and pops back to Home from settings. Screens stay
 * native-enabled by the installed default
 * (react-native-screens ENABLE_SCREENS), so no setup call is made.
 * Loading state comes from the demo context; this file fetches nothing.
 * Naming follows D6 (fld / lab / vw roots); route names are the
 * navigation API contract and stay as-is.
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component names (vwApplication, vwSplashRoute); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import {
  NavigationContainer,
  type NavigationContainerRef,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import {
  useDemoSession,
  type fldObjDemoSessionContextValue,
} from '../contexts/ctxDemoSession';
import { vwSplash as VwSplash } from '../components/vwSplash';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import { scrCollectionBrowser as ScrCollectionBrowser } from '../screens/scrCollectionBrowser';
import { scrCollectionSettings as ScrCollectionSettings } from '../screens/scrCollectionSettings';
import { scrHome as ScrHome } from '../screens/scrHome';
import { scrLibrarySettings as ScrLibrarySettings } from '../screens/scrLibrarySettings';
import { scrPersonaSelection as ScrPersonaSelection } from '../screens/scrPersonaSelection';

export type fldObjApplicationRoutes = {
  Splash: undefined;
  PersonaSelection: undefined;
  Home: undefined;
  CollectionBrowser: {
    fldStrLibraryId: string;
    fldStrLibraryName: string;
    fldStrParentId: string;
    fldStrTitle: string;
  };
  CollectionSettings: {
    fldStrCollectionId: string;
    fldStrCollectionName: string;
  };
  LibrarySettings: {
    fldStrLibraryId: string;
    fldStrLibraryName: string;
  };
};

type vwApplicationProps = {
  fldObjStrings: fldObjAppStrings;
};

type vwSplashRouteProps = {
  fldObjStrings: fldObjAppStrings;
};

const fldObjStack = createStackNavigator<fldObjApplicationRoutes>();

function vwSplashRoute({
  fldObjStrings,
}: vwSplashRouteProps): React.JSX.Element {
  const fldObjSession: fldObjDemoSessionContextValue = useDemoSession();
  return (
    <VwSplash
      fldBooLoading={fldObjSession.fldBooSessionRefreshing}
      fldObjStrings={fldObjStrings}
      fldStrError={null}
      actHandOnRetry={fldObjSession.srvApiRefreshSession}
    />
  );
}

const VwSplashRoute = vwSplashRoute;

export function vwApplication({
  fldObjStrings,
}: vwApplicationProps): React.JSX.Element {
  const { fldBooSessionRefreshing, fldObjPersona } = useDemoSession();
  const fldObjNavRef =
    React.useRef<NavigationContainerRef<fldObjApplicationRoutes>>(null);
  const fldStrPhaseRoute: 'Splash' | 'PersonaSelection' | 'Home' =
    fldBooSessionRefreshing
      ? 'Splash'
      : fldObjPersona === null
      ? 'PersonaSelection'
      : 'Home';
  React.useEffect(() => {
    const fldObjNav = fldObjNavRef.current;
    const fldStrCurrent = fldObjNav?.getCurrentRoute()?.name;
    if (
      fldObjNav !== null &&
      fldStrCurrent !== undefined &&
      fldStrCurrent !== 'LibrarySettings' &&
      fldStrCurrent !== 'CollectionSettings' &&
      fldStrCurrent !== fldStrPhaseRoute
    ) {
      fldObjNav.reset({ index: 0, routes: [{ name: fldStrPhaseRoute }] });
    }
  }, [fldStrPhaseRoute]);
  return (
    <NavigationContainer ref={fldObjNavRef}>
      <fldObjStack.Navigator
        initialRouteName="PersonaSelection"
        screenOptions={{ headerShown: false }}
      >
        <fldObjStack.Screen name="Splash">
          {() => <VwSplashRoute fldObjStrings={fldObjStrings} />}
        </fldObjStack.Screen>
        <fldObjStack.Screen name="PersonaSelection">
          {() => <ScrPersonaSelection fldObjStrings={fldObjStrings} />}
        </fldObjStack.Screen>
        <fldObjStack.Screen name="Home">
          {() => <ScrHome fldObjStrings={fldObjStrings} />}
        </fldObjStack.Screen>
        <fldObjStack.Screen name="CollectionBrowser">
          {fldObjProps => (
            <ScrCollectionBrowser
              fldObjStrings={fldObjStrings}
              fldStrLibraryId={fldObjProps.route.params.fldStrLibraryId}
              fldStrLibraryName={fldObjProps.route.params.fldStrLibraryName}
              fldStrParentId={fldObjProps.route.params.fldStrParentId}
              fldStrTitle={fldObjProps.route.params.fldStrTitle}
            />
          )}
        </fldObjStack.Screen>
        <fldObjStack.Screen name="CollectionSettings">
          {fldObjProps => (
            <ScrCollectionSettings
              fldObjStrings={fldObjStrings}
              fldStrCollectionId={fldObjProps.route.params.fldStrCollectionId}
              fldStrCollectionName={
                fldObjProps.route.params.fldStrCollectionName
              }
            />
          )}
        </fldObjStack.Screen>
        <fldObjStack.Screen name="LibrarySettings">
          {fldObjProps => (
            <ScrLibrarySettings
              fldObjStrings={fldObjStrings}
              fldStrLibraryId={fldObjProps.route.params.fldStrLibraryId}
              fldStrLibraryName={fldObjProps.route.params.fldStrLibraryName}
            />
          )}
        </fldObjStack.Screen>
      </fldObjStack.Navigator>
    </NavigationContainer>
  );
}
