"use client";

import { createContext, useContext } from "react";

/**
 * True when persistent app chrome (AppBar + Sidebar + BottomNavigation) is already mounted above the
 * current tree by <AppChrome>, which lives in the ROOT layout.
 *
 * MainLayout reads this to decide whether it should render the chrome itself or just its content
 * column. That is what lets the chrome be hoisted without editing the 114 pages that call MainLayout:
 * inside AppChrome they collapse to the content wrapper, and the sidebar/app bar stop being torn down
 * and rebuilt on every navigation.
 */
const ChromeContext = createContext(false);

export const ChromeProvider = ChromeContext.Provider;

export function useInsideChrome(): boolean {
  return useContext(ChromeContext);
}
