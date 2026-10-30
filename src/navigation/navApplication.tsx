/**
 * Logosphere BITS — application navigation (splash + persona selection).
 *
 * Two routes only: Splash (launch/restore loading) and PersonaSelection
 * (temporary placeholder until the persona screen step lands — no
 * not-yet-created screen file is imported). While the demo session
 * restores, the stack holds Splash alone; once settled, the stack
 * opens on PersonaSelection with Splash still bound. Android back is
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
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useDemoSession,
  type fldObjDemoSessionContextValue,
} from '../contexts/ctxDemoSession';
import { vwEmptyState as VwEmptyState } from '../components/vwEmptyState';
import { vwSplash as VwSplash } from '../components/vwSplash';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import { colBackground } from '../utils/utlTheme';

export type fldObjApplicationRoutes = {
  Splash: undefined;
  PersonaSelection: undefined;
};

type vwApplicationProps = {
  fldObjStrings: fldObjAppStrings;
};

type vwSplashRouteProps = {
  fldObjStrings: fldObjAppStrings;
};

const labPersonaSelectionTitle = 'Demo profiles';
const labPersonaSelectionMessage =
  'Persona selection arrives in the next step.';

const fldObjStack = createStackNavigator<fldObjApplicationRoutes>();

export function vwPersonaSelectionPlaceholder(): React.JSX.Element {
  return (
    <SafeAreaView style={vwApplicationStyles.fldObjScreen}>
      <VwEmptyState
        fldStrTitle={labPersonaSelectionTitle}
        fldStrMessage={labPersonaSelectionMessage}
      />
    </SafeAreaView>
  );
}

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
  const { fldBooSessionRefreshing } = useDemoSession();
  return (
    <NavigationContainer>
      <fldObjStack.Navigator screenOptions={{ headerShown: false }}>
        {fldBooSessionRefreshing ? (
          <fldObjStack.Screen name="Splash">
            {() => <VwSplashRoute fldObjStrings={fldObjStrings} />}
          </fldObjStack.Screen>
        ) : (
          <React.Fragment>
            <fldObjStack.Screen
              name="PersonaSelection"
              component={vwPersonaSelectionPlaceholder}
            />
            <fldObjStack.Screen name="Splash">
              {() => <VwSplashRoute fldObjStrings={fldObjStrings} />}
            </fldObjStack.Screen>
          </React.Fragment>
        )}
      </fldObjStack.Navigator>
    </NavigationContainer>
  );
}

const vwApplicationStyles = StyleSheet.create({
  fldObjScreen: {
    flex: 1,
    backgroundColor: colBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
