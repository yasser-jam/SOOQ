// Stub for lucide-react/dynamicIconImports (ESM-only): any icon name resolves
// to a lazy import of a null component.
module.exports = {
  __esModule: true,
  default: new Proxy(
    {},
    {
      get: () => () => Promise.resolve({ default: () => null }),
      has: () => true,
    }
  ),
};
