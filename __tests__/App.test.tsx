/**
 * @format
 */

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import vwAppRoot from '../App';
import { vwSplash } from '../src/components/vwSplash';
import { fncRunReadDeviceTag } from '../src/i18n/intLocale';
import { scrPersonaSelection } from '../src/screens/scrPersonaSelection';

jest.mock('react-native-safe-area-context', () => {
  const fldObjMockModule = jest.requireActual<{
    default: Record<string, unknown>;
  }>('react-native-safe-area-context/jest/mock');
  return fldObjMockModule.default;
});

jest.mock('react-native-url-polyfill/auto', () => ({}));

// Navigation and gesture-handler ship untranspiled ESM; jest (CJS,
// committed config untouched) stubs them. The stack stub renders the
// first declared screen like an initial route.
jest.mock('@react-navigation/native', () => {
  const fldObjReact = jest.requireActual('react');
  return {
    NavigationContainer: ({ children }: { children: unknown }) =>
      fldObjReact.createElement(fldObjReact.Fragment, null, children),
  };
});

jest.mock('@react-navigation/stack', () => {
  const fldObjReact = jest.requireActual('react');
  return {
    createStackNavigator: () => ({
      Navigator: ({ children }: { children: unknown }) => {
        const fldArrScreens: unknown[] = [];
        fldObjReact.Children.forEach(children, (fldObjChild: unknown) => {
          const fldObjElement = fldObjChild as {
            type?: unknown;
            props?: { children?: unknown };
          } | null;
          if (
            fldObjElement !== null &&
            typeof fldObjElement === 'object' &&
            fldObjElement.type === fldObjReact.Fragment
          ) {
            fldObjReact.Children.forEach(
              fldObjElement.props?.children,
              (fldObjNested: unknown) => {
                fldArrScreens.push(fldObjNested);
              },
            );
          } else {
            fldArrScreens.push(fldObjChild);
          }
        });
        return fldArrScreens[0] ?? null;
      },
      Screen: ({
        component,
        children,
      }: {
        component?: (fldObjProps: object) => unknown;
        children?: (fldObjProps: object) => unknown;
      }) =>
        component !== undefined
          ? fldObjReact.createElement(component)
          : typeof children === 'function'
          ? children({})
          : children ?? null,
    }),
  };
});

jest.mock('react-native-gesture-handler', () => {
  const fldObjReact = jest.requireActual('react');
  const fldObjNative = jest.requireActual('react-native');
  return {
    GestureHandlerRootView: ({ children }: { children: unknown }) =>
      fldObjReact.createElement(fldObjNative.View, null, children),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => {
  const fldObjStore = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((fldStrKey: string) =>
        Promise.resolve(fldObjStore.get(fldStrKey) ?? null),
      ),
      setItem: jest.fn((fldStrKey: string, fldStrValue: string) => {
        fldObjStore.set(fldStrKey, fldStrValue);
        return Promise.resolve();
      }),
      removeItem: jest.fn((fldStrKey: string) => {
        fldObjStore.delete(fldStrKey);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        fldObjStore.clear();
        return Promise.resolve();
      }),
    },
  };
});

jest.mock('../src/services/srvDemoClient', () => ({
  srvApiGetDemoClient: jest.fn(() => ({
    rpc: jest.fn(),
    from: jest.fn(),
    auth: {},
  })),
}));

jest.mock('../src/i18n/intLocale', () => {
  const fldObjActual = jest.requireActual('../src/i18n/intLocale');
  return {
    ...fldObjActual,
    fncRunReadDeviceTag: jest.fn(fldObjActual.fncRunReadDeviceTag),
  };
});

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('shows the splash inside providers while starting', async () => {
  let fldObjTree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjTree = ReactTestRenderer.create(React.createElement(vwAppRoot));
  });
  const fldObjRoot = fldObjTree?.root;
  expect(fldObjRoot?.findAllByType(GestureHandlerRootView).length).toBe(1);
  expect(fldObjRoot?.findAllByType(SafeAreaProvider).length).toBe(1);
  expect(fldObjRoot?.findByType(vwSplash).props.fldBooLoading).toBe(true);
});

test('mounts navigation after the startup delay', async () => {
  let fldObjTree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjTree = ReactTestRenderer.create(React.createElement(vwAppRoot));
  });
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(800);
  });
  expect(fldObjTree?.root.findAllByType(scrPersonaSelection).length).toBe(1);
  expect(fldObjTree?.root.findAllByType(vwSplash).length).toBe(0);
});

test('shows a retryable error instead of loading forever', async () => {
  jest.mocked(fncRunReadDeviceTag).mockImplementationOnce(() => {
    throw new Error('k46-startup');
  });
  let fldObjTree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjTree = ReactTestRenderer.create(React.createElement(vwAppRoot));
  });
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(800);
  });
  const fldObjSplash = fldObjTree?.root.findByType(vwSplash);
  expect(fldObjSplash?.props.fldBooLoading).toBe(false);
  expect(fldObjSplash?.props.fldStrError).toBe('Please try again.');
});

test('retries startup into navigation after an error', async () => {
  jest.mocked(fncRunReadDeviceTag).mockImplementationOnce(() => {
    throw new Error('k46-retry');
  });
  let fldObjTree: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    fldObjTree = ReactTestRenderer.create(React.createElement(vwAppRoot));
  });
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(800);
  });
  expect(
    fldObjTree?.root.findByType(vwSplash).props.fldStrError,
  ).not.toBeNull();
  await ReactTestRenderer.act(async () => {
    fldObjTree?.root.findByType(vwSplash).props.actHandOnRetry();
  });
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(800);
  });
  expect(fldObjTree?.root.findAllByType(scrPersonaSelection).length).toBe(1);
  expect(fldObjTree?.root.findAllByType(vwSplash).length).toBe(0);
});
