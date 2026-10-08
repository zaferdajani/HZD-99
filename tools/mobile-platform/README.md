# mobile-platform — the master

`src/*.ts` is the source of record for `js/mobile-platform.js`, which is
generated and must not be edited. Change the TypeScript, then:

```sh
sh tools/mobile-platform/derive.sh     # type-checks, then overwrites js/mobile-platform.js
node build.cjs
node tests/run.cjs mobile-platform
```

`derive.sh` installs TypeScript and esbuild into a throwaway directory. They are
deliberately absent from `package.json`: nothing a player loads and nothing in
`tests/` needs them, and a game that ships vanilla ES6 should not carry a
compiler in its dependency tree. The type-check runs first and a failure leaves
the shipped file untouched.

The whole story — why it is an IIFE, what it does, the three defects fixed
before it was committed, and what wiring it into the game would cost — is in
`docs/MOBILE_PLATFORM.md`.
