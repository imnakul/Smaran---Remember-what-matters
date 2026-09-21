/**
 * The localStorage key holding the visitor's explicit theme choice.
 *
 * This lives in its own module, deliberately without a `'use client'`
 * directive, because it is read from both sides of the boundary: the client
 * hook and the server-rendered pre-paint script. Importing a value from a
 * client module into a server component yields a client-reference stub rather
 * than the value, which would silently corrupt the inlined script.
 */
export const THEME_STORAGE_KEY = 'smaran-theme';
