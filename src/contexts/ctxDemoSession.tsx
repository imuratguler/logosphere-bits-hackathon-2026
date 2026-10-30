/**
 * Logosphere BITS — demo persona + session state (provider + hook).
 *
 * Small state layer over the ready services: persona preference plus
 * the valid RPC demo session for the selected persona. All network
 * and storage work delegates to srvDemoSession and the shared
 * AsyncStorage adapter; no RPC or query is copied here. Reads need no
 * persona and no session; writes use only the selected persona's own
 * session id (persona change overwrites through a request guard, so a
 * late answer can never rebind the previous session). Reopen restores
 * the stored persona and revalidates its session through the service
 * (expired is reminted); an invalid session keeps reads alive and
 * exposes refresh/retry state for writes. Clearing drops the persona
 * preference and resets state (stored sessions stay namespaced for
 * later reuse). Nothing here signs out of Supabase Auth, opens an
 * Auth account, or creates a real membership.
 *
 * Naming: VwDemoSessionProvider is PascalCase and useDemoSession keeps
 * the use prefix by framework necessity — the react-hooks lint rules
 * analyze definitions, so the alias-at-use pattern cannot apply.
 * Identifiers otherwise follow D6 (fld / srv / vw roots).
 */

import React from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { fldObjDemoPersona } from '../services/srvDemoPersonas';
import type { fldObjDemoSession } from '../services/srvDemoSession';
import {
  srvApiGetDemoSession,
  srvApiRefreshDemoSession,
} from '../services/srvDemoSession';
import { srvStorSupabaseAuthStorage } from '../services/srvSupabase';

const fldStrDemoPersonaKey = 'demo-persona';

export type fldObjDemoSessionState = {
  fldObjPersona: fldObjDemoPersona | null;
  fldObjSession: fldObjDemoSession | null;
  fldBooSessionReady: boolean;
  fldBooSessionRefreshing: boolean;
  fldStrSessionError: string | null;
};

export type fldObjDemoSessionContextValue = fldObjDemoSessionState & {
  srvApiSelectPersona: (fldObjPersona: fldObjDemoPersona) => Promise<void>;
  srvApiRefreshSession: () => Promise<void>;
  srvApiClearPersona: () => Promise<void>;
};

type vwDemoSessionProviderProps = {
  fldObjClient: SupabaseClient;
  children: React.ReactNode;
};

const fldObjInitialState: fldObjDemoSessionState = {
  fldObjPersona: null,
  fldObjSession: null,
  fldBooSessionReady: false,
  fldBooSessionRefreshing: false,
  fldStrSessionError: null,
};

const fldObjDemoSessionContext =
  React.createContext<fldObjDemoSessionContextValue | null>(null);

function fncRunIsStoredPersona(
  fldObjValue: unknown,
): fldObjValue is fldObjDemoPersona {
  if (typeof fldObjValue !== 'object' || fldObjValue === null) {
    return false;
  }
  const fldObjCandidate = fldObjValue as Partial<fldObjDemoPersona>;
  return (
    typeof fldObjCandidate.fldStrId === 'string' &&
    fldObjCandidate.fldStrId.trim() !== '' &&
    typeof fldObjCandidate.fldStrDisplayName === 'string' &&
    typeof fldObjCandidate.fldNumSortOrder === 'number'
  );
}

export function VwDemoSessionProvider({
  fldObjClient,
  children,
}: vwDemoSessionProviderProps): React.JSX.Element {
  const [fldObjState, actSetDemoSessionState] =
    React.useState<fldObjDemoSessionState>(fldObjInitialState);
  const fldObjRequestRef = React.useRef(0);

  const srvApiSelectPersona = React.useCallback(
    async (fldObjPersona: fldObjDemoPersona): Promise<void> => {
      if (fldObjPersona.fldStrId.trim() === '') {
        actSetDemoSessionState(fldObjPrevious => ({
          ...fldObjPrevious,
          fldBooSessionRefreshing: false,
          fldStrSessionError:
            'Logosphere BITS: demo persona ID is missing or blank.',
        }));
        return;
      }
      fldObjRequestRef.current += 1;
      const fldNumRequest = fldObjRequestRef.current;
      actSetDemoSessionState(fldObjPrevious => ({
        ...fldObjPrevious,
        fldBooSessionRefreshing: true,
        fldStrSessionError: null,
      }));
      try {
        await srvStorSupabaseAuthStorage.setItem(
          fldStrDemoPersonaKey,
          JSON.stringify(fldObjPersona),
        );
        const fldObjSession = await srvApiGetDemoSession(
          fldObjClient,
          fldObjPersona.fldStrId,
        );
        if (fldObjRequestRef.current !== fldNumRequest) {
          return;
        }
        actSetDemoSessionState({
          fldObjPersona,
          fldObjSession,
          fldBooSessionReady: true,
          fldBooSessionRefreshing: false,
          fldStrSessionError: null,
        });
      } catch (fldObjError) {
        if (fldObjRequestRef.current !== fldNumRequest) {
          return;
        }
        actSetDemoSessionState({
          fldObjPersona,
          fldObjSession: null,
          fldBooSessionReady: false,
          fldBooSessionRefreshing: false,
          fldStrSessionError: (fldObjError as Error).message,
        });
      }
    },
    [fldObjClient],
  );

  const srvApiRefreshSession = React.useCallback(async (): Promise<void> => {
    const fldObjPersona = fldObjState.fldObjPersona;
    if (fldObjPersona === null) {
      return;
    }
    fldObjRequestRef.current += 1;
    const fldNumRequest = fldObjRequestRef.current;
    actSetDemoSessionState(fldObjPrevious => ({
      ...fldObjPrevious,
      fldBooSessionRefreshing: true,
      fldStrSessionError: null,
    }));
    try {
      const fldObjSession = await srvApiRefreshDemoSession(
        fldObjClient,
        fldObjPersona.fldStrId,
      );
      if (fldObjRequestRef.current !== fldNumRequest) {
        return;
      }
      actSetDemoSessionState({
        fldObjPersona,
        fldObjSession,
        fldBooSessionReady: true,
        fldBooSessionRefreshing: false,
        fldStrSessionError: null,
      });
    } catch (fldObjError) {
      if (fldObjRequestRef.current !== fldNumRequest) {
        return;
      }
      actSetDemoSessionState({
        fldObjPersona,
        fldObjSession: null,
        fldBooSessionReady: false,
        fldBooSessionRefreshing: false,
        fldStrSessionError: (fldObjError as Error).message,
      });
    }
  }, [fldObjClient, fldObjState.fldObjPersona]);

  const srvApiClearPersona = React.useCallback(async (): Promise<void> => {
    fldObjRequestRef.current += 1;
    try {
      await srvStorSupabaseAuthStorage.removeItem(fldStrDemoPersonaKey);
    } catch {
      // Best effort: the state reset below is what the UI needs.
    }
    actSetDemoSessionState({ ...fldObjInitialState });
  }, []);

  React.useEffect(() => {
    let fldBooCancelled = false;
    fldObjRequestRef.current += 1;
    const fldNumRequest = fldObjRequestRef.current;
    const fncRunRestore = async (): Promise<void> => {
      let fldStrStored: string | null;
      try {
        fldStrStored = await srvStorSupabaseAuthStorage.getItem(
          fldStrDemoPersonaKey,
        );
      } catch (fldObjError) {
        if (!fldBooCancelled && fldObjRequestRef.current === fldNumRequest) {
          actSetDemoSessionState({
            ...fldObjInitialState,
            fldStrSessionError: (fldObjError as Error).message,
          });
        }
        return;
      }
      if (fldStrStored === null) {
        return;
      }
      let fldObjParsed: unknown;
      try {
        fldObjParsed = JSON.parse(fldStrStored);
      } catch {
        try {
          await srvStorSupabaseAuthStorage.removeItem(fldStrDemoPersonaKey);
        } catch {
          // Best effort: corrupt preference stays unreadable either way.
        }
        return;
      }
      if (!fncRunIsStoredPersona(fldObjParsed)) {
        try {
          await srvStorSupabaseAuthStorage.removeItem(fldStrDemoPersonaKey);
        } catch {
          // Best effort: invalid preference stays unreadable either way.
        }
        return;
      }
      if (fldBooCancelled || fldObjRequestRef.current !== fldNumRequest) {
        return;
      }
      actSetDemoSessionState(fldObjPrevious => ({
        ...fldObjPrevious,
        fldObjPersona: fldObjParsed,
        fldBooSessionRefreshing: true,
      }));
      try {
        const fldObjSession = await srvApiGetDemoSession(
          fldObjClient,
          fldObjParsed.fldStrId,
        );
        if (fldBooCancelled || fldObjRequestRef.current !== fldNumRequest) {
          return;
        }
        actSetDemoSessionState({
          fldObjPersona: fldObjParsed,
          fldObjSession,
          fldBooSessionReady: true,
          fldBooSessionRefreshing: false,
          fldStrSessionError: null,
        });
      } catch (fldObjError) {
        if (fldBooCancelled || fldObjRequestRef.current !== fldNumRequest) {
          return;
        }
        actSetDemoSessionState({
          fldObjPersona: fldObjParsed,
          fldObjSession: null,
          fldBooSessionReady: false,
          fldBooSessionRefreshing: false,
          fldStrSessionError: (fldObjError as Error).message,
        });
      }
    };
    fncRunRestore();
    return () => {
      fldBooCancelled = true;
    };
  }, [fldObjClient]);

  const fldObjValue = React.useMemo(
    () => ({
      ...fldObjState,
      srvApiSelectPersona,
      srvApiRefreshSession,
      srvApiClearPersona,
    }),
    [
      fldObjState,
      srvApiSelectPersona,
      srvApiRefreshSession,
      srvApiClearPersona,
    ],
  );

  return React.createElement(
    fldObjDemoSessionContext.Provider,
    { value: fldObjValue },
    children,
  );
}

export function useDemoSession(): fldObjDemoSessionContextValue {
  const fldObjValue = React.useContext(fldObjDemoSessionContext);
  if (fldObjValue === null) {
    throw new Error(
      'Logosphere BITS: useDemoSession must be used within VwDemoSessionProvider.',
    );
  }
  return fldObjValue;
}
