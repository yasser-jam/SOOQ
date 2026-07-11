/**
 * Version tag for the localStorage payload key (`puck-demo:<componentKey>:site`).
 * Bump manually when a registry change must invalidate saved sites.
 *
 * Lives in its own module (not config/index.tsx) so consumers that only need
 * the key — site-data, the Template block — don't import the whole block
 * registry (Template importing config/index was a circular import).
 */
export const componentKey = "v1";
