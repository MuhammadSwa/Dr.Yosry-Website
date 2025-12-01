/**
 * URL State Management for SolidJS in Astro SSG
 * 
 * This module provides a reusable pattern for syncing component state with URL query parameters.
 * It handles the SSG hydration challenge by:
 * 1. Initializing with default values (for consistent SSR/SSG)
 * 2. Reading URL params only on client-side mount
 * 3. Coordinating with Astro skeleton to prevent flash of wrong content
 * 
 * Usage:
 * 1. In your Astro page, add the skeleton pattern (see createSkeletonScript)
 * 2. In your SolidJS component, use createUrlState for each stateful value
 * 3. Call initializeFromUrl() in onMount to apply URL state and reveal content
 */

import { createSignal, batch } from "solid-js";
import type { Accessor, Setter } from "solid-js";

// ============================================================================
// Types
// ============================================================================

export interface UrlStateConfig<T> {
  /** The URL parameter key */
  key: string;
  /** Default value (used for SSG and when param is missing) */
  defaultValue: T;
  /** Parse string from URL to your type */
  parse?: (value: string) => T;
  /** Serialize your type to string for URL */
  serialize?: (value: T) => string;
  /** Values that should be omitted from URL (defaults to just defaultValue) */
  omitValues?: T[];
}

export interface UrlState<T> {
  value: Accessor<T>;
  setValue: Setter<T>;
  /** The key used in URL */
  key: string;
  /** Default value for resetting */
  defaultValue: T;
}

export interface UrlStateManager {
  /** Call in onMount to read URL params and reveal content */
  initializeFromUrl: () => void;
  /** Manually sync current state to URL */
  syncToUrl: () => void;
  /** Check if state has been initialized from URL */
  isInitialized: Accessor<boolean>;
  /** Reset all state to defaults and clear URL */
  resetAll: () => void;
}

// ============================================================================
// URL Utilities
// ============================================================================

/**
 * Get URL search params (safe for SSR)
 */
export function getUrlParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

/**
 * Check if URL has any query parameters
 */
export function hasUrlParams(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.search.length > 0;
}

/**
 * Update URL without page reload
 */
export function updateUrl(params: Record<string, string | null>): void {
  if (typeof window === "undefined") return;
  
  const url = new URL(window.location.href);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === "") {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  
  window.history.replaceState({}, "", url.toString());
}

// ============================================================================
// Skeleton Coordination
// ============================================================================

/** Default IDs for skeleton coordination */
export const SKELETON_ID = "url-state-skeleton";
export const CONTENT_ID = "url-state-content";

/**
 * Reveal content and hide skeleton (call after state is initialized)
 */
export function revealContent(
  skeletonId: string = SKELETON_ID,
  contentId: string = CONTENT_ID
): void {
  if (typeof window === "undefined") return;
  
  const skeleton = document.getElementById(skeletonId);
  const content = document.getElementById(contentId);
  
  if (skeleton) skeleton.style.display = "none";
  if (content) content.style.display = "block";
}

/**
 * Generate inline script for Astro page
 * This script runs before any framework JS to prevent flash
 * 
 * Usage in Astro:
 * <script is:inline set:html={createSkeletonScript()} />
 */
export function createSkeletonScript(
  skeletonId: string = SKELETON_ID,
  contentId: string = CONTENT_ID
): string {
  return `
(function() {
  if (window.location.search.length > 0) {
    var skeleton = document.getElementById('${skeletonId}');
    var content = document.getElementById('${contentId}');
    if (skeleton) skeleton.style.display = 'block';
    if (content) content.style.display = 'none';
  }
})();
`.trim();
}

// ============================================================================
// State Factory
// ============================================================================

/**
 * Create a URL-synced state manager
 * 
 * Example:
 * ```tsx
 * const urlState = createUrlStateManager();
 * 
 * const [category, setCategory] = urlState.create({
 *   key: "category",
 *   defaultValue: "all",
 * });
 * 
 * const [page, setPage] = urlState.create({
 *   key: "page", 
 *   defaultValue: 1,
 *   parse: (v) => parseInt(v),
 *   serialize: (v) => v.toString(),
 *   omitValues: [1], // Don't show page=1 in URL
 * });
 * 
 * onMount(() => {
 *   urlState.initializeFromUrl();
 * });
 * ```
 */
export function createUrlStateManager(options?: {
  skeletonId?: string;
  contentId?: string;
  /** Called after URL state is initialized */
  onInitialized?: () => void;
}): UrlStateManager & {
  create: <T>(config: UrlStateConfig<T>) => [Accessor<T>, Setter<T>];
} {
  const skeletonId = options?.skeletonId ?? SKELETON_ID;
  const contentId = options?.contentId ?? CONTENT_ID;
  
  const [isInitialized, setIsInitialized] = createSignal(false);
  const states: Array<{
    key: string;
    getValue: () => unknown;
    setValue: (v: unknown) => void;
    parse: (s: string) => unknown;
    serialize: (v: unknown) => string;
    defaultValue: unknown;
    omitValues: unknown[];
  }> = [];

  function create<T>(config: UrlStateConfig<T>): [Accessor<T>, Setter<T>] {
    const {
      key,
      defaultValue,
      parse = (v: string) => v as unknown as T,
      serialize = (v: T) => String(v),
      omitValues = [defaultValue],
    } = config;

    const [value, setValue] = createSignal<T>(defaultValue);

    states.push({
      key,
      getValue: value,
      setValue: setValue as (v: unknown) => void,
      parse: parse as (s: string) => unknown,
      serialize: serialize as (v: unknown) => string,
      defaultValue,
      omitValues,
    });

    return [value, setValue];
  }

  function initializeFromUrl(): void {
    const params = getUrlParams();
    
    batch(() => {
      states.forEach((state) => {
        const urlValue = params.get(state.key);
        if (urlValue !== null) {
          try {
            state.setValue(state.parse(urlValue));
          } catch (e) {
            console.warn(`Failed to parse URL param "${state.key}":`, e);
          }
        }
      });
    });

    // Reveal content after state is applied
    revealContent(skeletonId, contentId);
    
    // Mark as initialized after a tick
    setTimeout(() => {
      setIsInitialized(true);
      options?.onInitialized?.();
    }, 0);
  }

  function syncToUrl(): void {
    if (!isInitialized()) return;
    
    const params: Record<string, string | null> = {};
    
    states.forEach((state) => {
      const value = state.getValue();
      const shouldOmit = state.omitValues.some(
        (omit) => JSON.stringify(omit) === JSON.stringify(value)
      );
      
      params[state.key] = shouldOmit ? null : state.serialize(value);
    });
    
    updateUrl(params);
  }

  function resetAll(): void {
    batch(() => {
      states.forEach((state) => {
        state.setValue(state.defaultValue);
      });
    });
    
    if (isInitialized()) {
      // Clear all URL params
      const params: Record<string, string | null> = {};
      states.forEach((state) => {
        params[state.key] = null;
      });
      updateUrl(params);
    }
  }

  return {
    create,
    initializeFromUrl,
    syncToUrl,
    isInitialized,
    resetAll,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Create a simple string URL state
 */
export function createUrlString(
  manager: ReturnType<typeof createUrlStateManager>,
  key: string,
  defaultValue: string = ""
): [Accessor<string>, Setter<string>] {
  return manager.create({ key, defaultValue });
}

/**
 * Create a number URL state
 */
export function createUrlNumber(
  manager: ReturnType<typeof createUrlStateManager>,
  key: string,
  defaultValue: number = 0
): [Accessor<number>, Setter<number>] {
  return manager.create({
    key,
    defaultValue,
    parse: (v) => parseInt(v, 10) || defaultValue,
    serialize: (v) => v.toString(),
  });
}

/**
 * Create a boolean URL state
 */
export function createUrlBoolean(
  manager: ReturnType<typeof createUrlStateManager>,
  key: string,
  defaultValue: boolean = false
): [Accessor<boolean>, Setter<boolean>] {
  return manager.create({
    key,
    defaultValue,
    parse: (v) => v === "true" || v === "1",
    serialize: (v) => (v ? "true" : "false"),
  });
}

/**
 * Create a string array URL state (comma-separated)
 */
export function createUrlArray(
  manager: ReturnType<typeof createUrlStateManager>,
  key: string,
  defaultValue: string[] = []
): [Accessor<string[]>, Setter<string[]>] {
  return manager.create({
    key,
    defaultValue,
    parse: (v) => v.split(",").filter(Boolean),
    serialize: (v) => v.join(","),
    omitValues: [defaultValue, []],
  });
}
