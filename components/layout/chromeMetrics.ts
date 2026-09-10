/**
 * Chrome geometry constants, in their own module so importing a width does not import a sidebar.
 *
 * These lived in Sidebar.tsx (1,460 lines). AppChrome needs only the number — to size the
 * content column around the drawer — but importing it dragged the entire sidebar, and through it
 * the whole navigation tree, onto routes that render no chrome at all: /login, /signup, the
 * public credential pages, the assessment runner. Splitting the constant out is what lets the
 * leaves below be loaded on demand.
 */
export const DRAWER_WIDTH = 264;
export const DRAWER_WIDTH_COLLAPSED = 64;
