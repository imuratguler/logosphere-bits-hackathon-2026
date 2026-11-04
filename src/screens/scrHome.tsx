/**
 * Logosphere BITS — demo account home (one persona card).
 *
 * Brand strip on top (large blue Logosphere plus a white small-caps
 * BITS, no square logo) with a refresh icon that revalidates the
 * demo session; below it a single card carries the selected demo
 * persona's name with a Corporate/Individual presentation tag.
 * Tapping the card opens the shared library list titled with the
 * persona name — every persona opens the same shared catalog, and
 * the tag grants no authority, membership, or data split. A compact
 * switch action returns to the demo entry; the demo footer pins
 * below. Renders no tabs, no message or settings icons, and no
 * corporate create button. All reads delegate to the ready
 * services; nothing is copied here.
 * Naming follows D6 (fld / vw / fnc roots).
 */

/* eslint-disable react-hooks/rules-of-hooks -- D6-pure component name (scrHome); hooks stay top-level and unconditional; re-check this file if hooks are edited. */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useDemoSession } from '../contexts/ctxDemoSession';
import { vwButton as VwButton } from '../components/vwButton';
import { vwDemoFooter as VwDemoFooter } from '../components/vwDemoFooter';
import type { fldObjAppStrings } from '../i18n/intTranslations';
import type { fldObjApplicationRoutes } from '../navigation/navApplication';
import {
  colAccentBlue,
  colBackground,
  colDanger,
  colSurface,
  colTextPrimary,
  colTextSecondary,
  fldNumRadiusLg,
  fldNumSpacingLg,
  fldNumSpacingMd,
  fldNumSpacingSm,
  fldNumTouchTarget,
  fldStrFontFamilyBrand,
  fldStrFontFamilyUi,
} from '../utils/utlTheme';

type scrHomeProps = {
  fldObjStrings: fldObjAppStrings;
};

type fldStrPersonaKind = 'corporate' | 'individual';

const fldArrIndividualPersonaNames = [
  'Book Collector',
  'Senior Citizen',
  'Any Student',
];

const fldStrKindGlyphCorporate = '🏢';
const fldStrKindGlyphIndividual = '👤';

function fncConvPersonaKind(fldStrDisplayName: string): fldStrPersonaKind {
  return fldArrIndividualPersonaNames.includes(fldStrDisplayName)
    ? 'individual'
    : 'corporate';
}

export function scrHome({ fldObjStrings }: scrHomeProps): React.JSX.Element {
  const {
    fldObjPersona,
    fldBooSessionRefreshing,
    fldStrSessionError,
    srvApiRefreshSession,
    srvApiClearPersona,
  } = useDemoSession();
  const fldObjNavigation =
    useNavigation<StackNavigationProp<fldObjApplicationRoutes>>();

  const fldObjCopy = fldObjStrings.fldObjHome;
  const fldObjBrandCopy = fldObjStrings.fldObjBrandHeader;
  const fldObjFooterCopy = fldObjStrings.fldObjDemoFooter;
  const fldStrKind: fldStrPersonaKind =
    fldObjPersona === null
      ? 'corporate'
      : fncConvPersonaKind(fldObjPersona.fldStrDisplayName);

  return (
    <SafeAreaView style={scrHomeStyles.fldObjScreen}>
      <View style={scrHomeStyles.fldObjStrip}>
        <Text
          style={scrHomeStyles.fldObjBrand}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {fldObjBrandCopy.fldStrName}{' '}
          <Text style={scrHomeStyles.fldObjBrandSuffix}>
            {fldObjBrandCopy.fldStrSuffix}
          </Text>
        </Text>
        <Pressable
          testID="home-refresh"
          onPress={() => {
            // Fire-and-forget: context operations never reject;
            // failures land in the session error state.
            srvApiRefreshSession();
          }}
          disabled={fldBooSessionRefreshing}
          accessibilityRole="button"
          accessibilityLabel={fldObjCopy.fldStrRefresh}
          style={[
            scrHomeStyles.fldObjRefresh,
            fldBooSessionRefreshing && scrHomeStyles.fldObjInactive,
          ]}
        >
          <Text style={scrHomeStyles.fldObjRefreshGlyph}>↻</Text>
        </Pressable>
      </View>
      <ScrollView style={scrHomeStyles.fldObjScroll}>
        {fldStrSessionError !== null && (
          <Text style={scrHomeStyles.fldObjError}>{fldStrSessionError}</Text>
        )}
        {fldObjPersona !== null && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fldObjPersona.fldStrDisplayName}
            onPress={() => {
              fldObjNavigation.navigate('LibraryList', {
                fldStrPersonaName: fldObjPersona.fldStrDisplayName,
              });
            }}
            style={scrHomeStyles.fldObjCard}
          >
            <Text style={scrHomeStyles.fldObjKindGlyph}>
              {fldStrKind === 'corporate'
                ? fldStrKindGlyphCorporate
                : fldStrKindGlyphIndividual}
            </Text>
            <View style={scrHomeStyles.fldObjCardText}>
              <Text
                style={scrHomeStyles.fldObjCardName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {fldObjPersona.fldStrDisplayName}
              </Text>
              <Text style={scrHomeStyles.fldObjCardKind}>
                {fldStrKind === 'corporate'
                  ? fldObjCopy.fldStrTypeCorporate
                  : fldObjCopy.fldStrTypeIndividual}
              </Text>
            </View>
            <Text style={scrHomeStyles.fldObjChevron}>›</Text>
          </Pressable>
        )}
        <View style={scrHomeStyles.fldObjSwitch}>
          <VwButton
            fldStrLabel={fldObjCopy.fldStrChangeProfile}
            fldStrVariant="text"
            actHandOnPress={() => {
              // Fire-and-forget: clearing never rejects by design.
              srvApiClearPersona();
            }}
          />
        </View>
      </ScrollView>
      <VwDemoFooter fldStrText={fldObjFooterCopy.fldStrText} />
    </SafeAreaView>
  );
}

// Home layout scale: x1.25 over base tokens (Tur 1); sizes rounded to whole dp.
const scrHomeStyles = StyleSheet.create({
  fldObjScreen: {
    flex: 1,
    backgroundColor: colBackground,
  },
  fldObjStrip: {
    height: 90,
    backgroundColor: colSurface,
    paddingHorizontal: fldNumSpacingMd * 1.25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fldObjBrand: {
    flex: 1,
    fontFamily: fldStrFontFamilyBrand,
    fontSize: 38,
    lineHeight: 48,
    color: colAccentBlue,
    marginRight: fldNumSpacingSm * 1.25,
  },
  fldObjBrandSuffix: {
    fontFamily: fldStrFontFamilyBrand,
    fontSize: 24,
    letterSpacing: 2.5,
    color: colTextPrimary,
  },
  fldObjRefresh: {
    width: fldNumTouchTarget,
    height: fldNumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fldObjInactive: {
    opacity: 0.5,
  },
  fldObjRefreshGlyph: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 30,
    lineHeight: 35,
    color: colAccentBlue,
  },
  fldObjScroll: {
    flex: 1,
    padding: fldNumSpacingMd * 1.25,
  },
  fldObjError: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 16,
    lineHeight: 25,
    color: colDanger,
    marginBottom: fldNumSpacingSm * 1.25,
  },
  fldObjCard: {
    backgroundColor: colSurface,
    borderRadius: fldNumRadiusLg * 1.25,
    padding: fldNumSpacingMd * 1.25,
    minHeight: 71,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fldObjKindGlyph: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 35,
    lineHeight: 40,
    color: colAccentBlue,
    marginRight: fldNumSpacingMd * 1.25,
  },
  fldObjCardText: {
    flex: 1,
    marginRight: fldNumSpacingSm * 1.25,
  },
  fldObjCardName: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 23,
    lineHeight: 33,
    fontWeight: 'bold',
    color: colTextPrimary,
  },
  fldObjCardKind: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 18,
    lineHeight: 25,
    color: colAccentBlue,
  },
  fldObjChevron: {
    fontFamily: fldStrFontFamilyUi,
    fontSize: 23,
    lineHeight: 28,
    color: colTextSecondary,
  },
  fldObjSwitch: {
    alignItems: 'center',
    marginTop: fldNumSpacingLg * 1.25,
  },
});
