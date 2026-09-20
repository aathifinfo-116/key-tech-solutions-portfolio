/**
 * CSS modules, for TypeScript.
 *
 * The bundler turns a `*.module.css` import into a map of class names.
 * Next.js declares this for an application through `next-env.d.ts`; a
 * package compiled on its own has no such file, so `pnpm typecheck` needs
 * the declaration here.
 */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

/** A plain stylesheet is imported for its side effect and exports nothing. */
declare module '*.css';
