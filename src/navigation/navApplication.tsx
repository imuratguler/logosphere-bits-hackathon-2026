/**
 * Logosphere BITS — application navigation (splash + persona selection).
 *
 * Three routes: Splash (launch/restore loading), PersonaSelection
 * (demo persona choice), and Home (shared libraries; every persona
 * opens the same shared data). The screen list never changes;
 * a phase effect resets the stack to the phase route, so no
 * remount ever tears down the native stack (remounting wedged
 * it on device).
 *
 * Android back is
 * the installed default (useBackButton.native: pop when possible,
 * else let the system exit); the stack stays depth-1, so back
 * exits. Screens stay native-enabled by the installed default
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
import { scrHome as ScrHome } from '../screens/scrHome';
import { scrPersonaSelection as ScrPersonaSelection } from '../screens/scrPersonaSelection';

export type fldObjApplicationRoutes = {
  Splash: undefined;
  PersonaSelection: undefined;
  Home: undefined;
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
  const fldStrPhaseRoute: keyof fldObjApplicationRoutes =
    fldBooSessionRefreshing
      ? 'Splash'
      : fldObjPersona === null
      ? 'PersonaSelection'
      : 'Home';
  React.useEffect(() => {
    const fldObjNav = fldObjNavRef.current;
    if (
      fldObjNav !== null &&
      fldObjNav.getCurrentRoute()?.name !== fldStrPhaseRoute
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
      </fldObjStack.Navigator>
    </NavigationContainer>
  );
}
