/**
 * Logosphere BITS — application navigation (splash + persona selection).
 *
 * Three routes: Splash (launch/restore loading), PersonaSelection
 * (demo persona choice), and Home (shared libraries; every persona
 * opens the same shared data). While the demo session
 * restores, the stack holds Splash alone; once settled, the stack
 * opens on PersonaSelection with Splash still bound. The stack keeps
 * a still-registered route focused when the screen list changes, so
 * the navigator carries a phase key and remounts onto the correct
 * initial route at each phase change. Android back is
 * the installed default (useBackButton.native: pop when possible,
 * else let the system exit); both stacks here are depth-1, so back
 * exits. Screens stay native-enabled by the installed default
 * (react-native-screens ENABLE_SCREENS), so no setup call is made.
 * Loading state comes from the demo context; this file fetches nothing.
 * Naming follows D6 (fld / lab / vw roots); route names are the
 * navigation API contract and stay as-is.
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component names (vwApplication, vwSplashRoute); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import { NavigationContainer } from '@react-navigation/native';
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
  const fldStrNavPhase = fldBooSessionRefreshing
    ? 'splash'
    : fldObjPersona === null
    ? 'select'
    : 'home';
  return (
    <NavigationContainer>
      <fldObjStack.Navigator
        key={fldStrNavPhase}
        screenOptions={{ headerShown: false }}
      >
        {fldBooSessionRefreshing ? (
          <fldObjStack.Screen name="Splash">
            {() => <VwSplashRoute fldObjStrings={fldObjStrings} />}
          </fldObjStack.Screen>
        ) : fldObjPersona === null ? (
          <React.Fragment>
            <fldObjStack.Screen name="PersonaSelection">
              {() => <ScrPersonaSelection fldObjStrings={fldObjStrings} />}
            </fldObjStack.Screen>
            <fldObjStack.Screen name="Splash">
              {() => <VwSplashRoute fldObjStrings={fldObjStrings} />}
            </fldObjStack.Screen>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <fldObjStack.Screen name="Home">
              {() => <ScrHome fldObjStrings={fldObjStrings} />}
            </fldObjStack.Screen>
            <fldObjStack.Screen name="PersonaSelection">
              {() => <ScrPersonaSelection fldObjStrings={fldObjStrings} />}
            </fldObjStack.Screen>
            <fldObjStack.Screen name="Splash">
              {() => <VwSplashRoute fldObjStrings={fldObjStrings} />}
            </fldObjStack.Screen>
          </React.Fragment>
        )}
      </fldObjStack.Navigator>
    </NavigationContainer>
  );
}
