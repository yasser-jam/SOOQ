# APP Module — Merchant App Build (admin home section)

**Goal.** On the merchant dashboard home page, show a section that answers "do I have a mobile
app?", offers a button to build one, shows live build status, and — when the build succeeds —
gives a download link for the APK.

Scope for this pass: **builds + configurations only** (endpoints 01–05, 07). Branding (08/09),
templates (10) and notifications (11/12) are deliberately out of scope.

Sources: `APP_Module_Requests (1).md` (endpoint reference) and `MOBILE_TEAM_GUIDE.md`
(call order + the real-world failures of 16 Aug 2026).

---

## 0. Facts established from the codebase (do not re-derive)

| Fact | Where | Consequence |
|---|---|---|
| `NEXT_PUBLIC_API_URL` = `https://shopengine-production-9b4c.up.railway.app/api/v1` | `apps/web/.env` | Module paths are `/app-builds`, `/app-configurations` — **never** `/api/v1/app-builds`, that would double the prefix. |
| `api()` auto-attaches `Authorization` + `X-Tenant-Slug` | `apps/web/lib/api.ts:56-70` | Bearer auth is free. But the APP docs specify `X-Tenant-ID` — see §2. |
| `getEditorTenantId()` reads the tenant UUID out of the admin JWT | `apps/web/lib/tenant-context.ts:23` | This is how we get the `X-Tenant-ID` value client-side. |
| `getApiBaseUrl()` returns the env value verbatim, i.e. **with** `/api/v1` | `apps/web/lib/api.ts:163` | `configJson.apiBaseUrl` must be the bare origin. Strip the suffix — see §2. |
| Mock API is off (`NEXT_PUBLIC_USE_MOCK_API=false`) | `apps/web/.env` | All calls hit the live backend. No mock handler needed. |
| Home page is `apps/web/app/(dashboard)/page.tsx` (43 lines, client component, renders `<SeedButtons/>` + `<HomeMockDashboard/>`) | — | The new section slots in as one more child of the existing `container space-y-6` div. |
| Module pattern: `modules/<domain>/<sub>/{actions,queryKeys,types,schema}.ts` + `components/` | `modules/payment/provider/*` | New code lives at `apps/web/modules/app/build/`. |
| `queryOptions()` from TanStack with a `staleTime` is the house style | `modules/store/settings/actions.ts:30` | Follow it; add `refetchInterval` for polling (no existing precedent in repo — this is the first poller). |
| UI kit has `card`, `button`, `badge`, `alert`, `skeleton` | `packages/ui/src/components/` | No new primitives needed. |

Decisions already taken by the user:
- **bundleId**: send it, derived per tenant → `com.sooq.<sanitized-slug>.client`.
- **Config handling**: reuse the latest published config; create + publish a new version only
  when none exists or when the derived values changed.
- **Scope**: builds + config only.
- **Builds do reach SUCCESS** in practice once the callback fix lands — don't design the UI
  around "this will hang forever," just don't hammer the API indefinitely (§4).
- **Download link**: render it unconditionally when the backend supplies `downloadUrl`. Whether
  it resolves to an actual file is the backend/mobile team's problem, not this module's.
- **Correction (verified against the live backend 2026-08-18):** APP endpoints DO use the
  standard `ApiResponse<T>` envelope (`{success, message, data, timestamp}`) — the initial
  assumption of "no envelope" was wrong and caused `configVersionId` to resolve to `undefined`
  (silently dropped by `JSON.stringify`, producing the "empty" `POST /app-builds` /
  `.../undefined/publish` bugs). `actions.ts` now unwraps `.data` via a shared `unwrap()` helper
  for every call. Confirmed real shape for `POST /app-configurations`:
  `{success, message, data: {appConfigurationId, versionNumber, schemaVersion, configJson,
  isPublished, publishedAt, createdAt, updatedAt, createdByUserId}, timestamp}`.
- **Publish-step failure handling (2026-08-18):** `ensurePublishedConfig` used to create a brand
  new config version every time it didn't find a *published* match, even if an unpublished draft
  from a prior failed `/publish` call already existed with the right values — silently piling up
  versions on every retry. Fixed to reuse that draft (`getRelevantConfig` now returns
  `{desired, published, draft}` split by publish state) and retry publishing it instead of
  minting a new one. There is no `unpublish`/`revoke` endpoint in the API — the UI addition is a
  manual **"نشر الإعدادات" (Publish config)** button that appears whenever an unpublished draft
  matching the tenant's current values exists, independent of build status, so a failed publish
  can be retried without triggering a whole new build attempt.

---

## 1. ⚠️ Blockers to resolve before/while building

These are real, and two of them mean the happy path **cannot be verified end-to-end today**.

1. **The build callback is broken on the mobile team's side.** `MOBILE_TEAM_GUIDE.md` §4 and §5
   state the APK builds fine but the final "report result" step hits a dead Railway domain and
   returns `{"status":"error","code":404,"message":"Application not found"}`. Until `erteqaapk`
   reads `client_payload.api_base_url`, **no build will ever transition to SUCCESS** — the job
   stays `BUILDING` forever. The UI must therefore handle a long-running/stuck build gracefully
   (see §4, state 3) and must not be judged broken when it never reaches the download state.
2. **The APK URL may not be directly downloadable.** The webhook contract sends `artifactUrl` as
   a *GitHub Actions run* URL (`.../actions/runs/1234567890`), and GitHub artifact downloads
   require authentication. Endpoint 02 promises `artifacts[].downloadUrl`, which may or may not
   be a resolved direct link. **Probe this before designing the download button** — if it is a
   run URL, the button opens a GitHub page the merchant cannot use, and the backend needs to
   proxy the artifact instead.
3. **Response shapes are only partially documented.** The docs give field names for the happy
   path (`appBuildJobId`, `ciRunId`, `buildStatus`, `queuedAt`, `completedAt`, `errorMessage`,
   `artifacts[]`, `appConfigurationId`, `versionNumber`, `isPublished`) but not the full DTOs,
   nor whether list endpoints return `ApiResponse<Page<T>>` or `PagedApiResponse<T>` — the repo
   has both shapes in use (`modules/shipping/cod/actions.ts:29` handles both defensively).

**Step 0 of implementation is a live API probe** with a real merchant token: call
`GET /app-builds?page=0&size=20`, `GET /app-configurations`, and `POST /app-configurations`
against the `-9b4c` backend and record the actual envelopes. Types get written from that
recording, not from the docs. If no token is available, mirror `modules/shipping/cod/actions.ts`
and accept both envelope shapes.

---

## 2. Shared plumbing

**Tenant header.** `api()` sends `X-Tenant-Slug`; the APP docs ask for `X-Tenant-ID`. It is
unknown whether the APP controllers accept the slug. Send the UUID explicitly on every APP call
and let the interceptor's slug header ride along — both present is harmless:

```ts
const appHeaders = () => {
  const tenantId = getEditorTenantId()
  return tenantId ? { "X-Tenant-ID": tenantId } : undefined
}
```

**API base URL for `configJson.apiBaseUrl`.** The mobile app needs the bare origin, and it is
what the mobile workflow uses for its callback — getting this wrong reproduces the exact bug in
guide §5. Derive it by stripping the versioned suffix:

```ts
// "https://host/api/v1" -> "https://host"
const mobileApiBaseUrl = () => getApiBaseUrl().replace(/\/api\/v\d+$/, "")
```

**Bundle id.** Android package segments must be lowercase alphanumeric, dot-separated, and no
segment may start with a digit. Sanitize the slug (`-` → `_`, drop anything else, prefix a digit-
leading segment with `s`) and fall back to `merchant` when the slug is empty:

```ts
const bundleIdFor = (slug: string) => `com.sooq.${sanitize(slug)}.client`
```

---

## 3. New files

```
apps/web/modules/app/build/
├── types.ts        # BuildStatus, AppBuildJob, AppConfiguration, artifacts
├── queryKeys.ts    # appBuildKeys.{all, list, detail(id), configs}
├── actions.ts      # endpoints 01,02,03,04,05,07 + queryOptions factories
├── config.ts       # bundleIdFor / mobileApiBaseUrl / buildConfigJson helpers
└── components/
    ├── app-build-card.tsx     # the home-page section (state machine)
    └── build-status-badge.tsx # QUEUED/BUILDING/SUCCESS/FAILED badge
```

**`types.ts`**

```ts
export type BuildStatus = "QUEUED" | "BUILDING" | "SUCCESS" | "FAILED"
                        | "CANCELLED" | "TIMEOUT"   // guide §4 adds these two
export type BuildChannel = "INTERNAL" | "BETA" | "PRODUCTION"
```

`CANCELLED`/`TIMEOUT` appear in the mobile guide's webhook contract but not in the endpoint
reference — treat any unrecognized status as terminal-failed rather than crashing.

**`actions.ts`** — one function per endpoint, all normalizing into domain types:

| Fn | Endpoint |
|---|---|
| `listBuilds({status?, page, size})` | `GET /app-builds` |
| `getBuild(id)` | `GET /app-builds/{id}` |
| `initiateBuild({buildChannel, configVersionId})` | `POST /app-builds` |
| `retryBuild(id)` | `POST /app-builds/{id}/retry` |
| `listConfigurations()` | `GET /app-configurations` |
| `createConfiguration(configJson)` | `POST /app-configurations` |
| `publishConfiguration(id)` | `POST /app-configurations/{id}/publish` |

Plus the orchestrator the button calls:

```ts
ensurePublishedConfig(): Promise<string>   // returns configVersionId
```
Logic: list configs → find the newest published one whose `configJson` matches the currently
derived `{appName, apiBaseUrl, bundleId}` → return its id. Otherwise create a new version, publish
it (endpoint 07), and return the new id. This is the user's "reuse latest, create only if missing"
decision, and the publish step follows the guide's §1 order (create → publish → build), which
overrides the endpoint reference's numbering.

`appName` comes from store settings (`storeName ?? profileNameAr`), read via the already-cached
`getStoreSettingsQueryOptions()` — the home page mounts that query anyway, so it is free.

---

## 4. The home-page section — state machine

`<AppBuildCard/>` renders one of five states, driven by `listBuilds({size:1})` for "latest build"
plus a detail poll while in flight. Arabic-first copy, RTL, per repo convention.

| # | Condition | UI |
|---|---|---|
| 1 | query pending | `<Skeleton/>` |
| 2 | no builds at all | "لا يوجد تطبيق بعد" + **إنشاء التطبيق** button |
| 3 | latest is `QUEUED`/`BUILDING` | status badge + indeterminate progress + elapsed time + disabled button. Poll `getBuild(id)` with `refetchInterval: 10_000`. **Stop polling after ~20 min** and show "تأخر البناء — راجع الفريق التقني" (this is the guide §4 stuck-callback case, and an unbounded poller would hammer the API forever). |
| 4 | latest is `SUCCESS` | "التطبيق جاهز" + version/date + **تحميل APK** link (`artifacts[0].downloadUrl`, `target="_blank" rel="noreferrer"`) + secondary **إعادة البناء**. If `artifacts` is empty, show the ready state without a download link rather than rendering a dead button. |
| 5 | latest is `FAILED`/`CANCELLED`/`TIMEOUT` | `<Alert variant="destructive">` with `errorMessage` + **إعادة المحاولة** → `retryBuild(id)` (endpoint 04) |

Build channel: hardcode `BETA` for now (the reference's own example uses it). Not worth a picker
until the merchant has a reason to choose.

Mutation flow behind the button: `ensurePublishedConfig()` → `initiateBuild()` → invalidate
`appBuildKeys.all` → polling picks it up. Errors surface via `sonner` toast, matching the repo's
convention.

---

## 5. Wiring

`apps/web/app/(dashboard)/page.tsx` — add one line inside the existing container, above
`<HomeMockDashboard/>`:

```tsx
<AppBuildCard />
```

No routing, no sidebar entry, no layout change. That is the whole integration surface.

---

## 6. Verification

Per the repo's testing memory, the browser preview has been unreliable on this branch, and
blocker §1 means a green end-to-end run is not achievable regardless. Realistic ladder:

1. `pnpm typecheck` + `pnpm lint` — must pass.
2. Live probe (step 0) confirms envelopes and that `POST /app-configurations` returns 201.
3. Manually drive the home page: confirm state 2 → click → state 3 with a real `appBuildJobId`
   and a real `ciRunId`. **This is the furthest the flow can currently go.**
4. States 4 and 5 verified by temporarily stubbing the query data (or via the mock layer), since
   no build can legitimately reach SUCCESS until `erteqaapk` fixes the callback domain.

Report state 3 as the honest stopping point rather than claiming a working download.

---

## 7. Open questions for the backend/mobile team

1. Is `artifacts[].downloadUrl` a direct APK link or a GitHub Actions run URL? (§1.2)
2. Do the APP controllers accept `X-Tenant-Slug`, or is `X-Tenant-ID` mandatory? (§2)
3. Does the backend validate `bundleId` against a whitelist, or accept any valid package name?
   The per-tenant scheme depends on the latter.
4. Is `bundleId` in `configJson` actually required? The two documents contradict each other.
5. Has the `erteqaapk` callback fix shipped? Everything downstream of state 3 is blocked on it.
