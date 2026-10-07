# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
## Android release size

The local `plugins/with-android-size.js` config plugin enables R8 code shrinking
and resource shrinking on release builds. Preview APKs target ARM64 phones only;
the production AAB retains all four architectures so Google Play can deliver the
appropriate native libraries for each device. Unused Skia and Device are removed.
Unused direct declarations for Expo UI and Glass Effect are also removed, but
Expo Router still requires those packages transitively.

Build a sideloadable APK:

```bash
pnpm dlx eas-cli@latest build --platform android --profile preview
```

Build a Play Store AAB:

```bash
pnpm dlx eas-cli@latest build --platform android --profile production
```

An AAB is uploaded to Play and cannot be installed directly like an APK. These
commands build artifacts; they do not submit or publish the app.

Native directories are generated and ignored by Git. EAS applies the plugin
during prebuild. For an existing local Android project, run
`pnpm expo prebuild --platform android --no-install` before a release build to
apply the current settings. To generate all architectures locally for a bundle
or emulator, run prebuild with `EAS_BUILD_PROFILE=production`.

Measure the rebuilt artifact to verify the reduction and smoke-test sign-in,
photo capture/upload, SQLite draft restoration, navigation, and chat in release
mode after enabling shrinking.

# API integration

Phases 1–9 connect member registration, sign-in, guest creation/conversion,
bearer session restoration, onboarding with wake/sleep times, API-backed Home,
Entry CRUD, food-reference lookup/portion calculation, daily totals, AI synopsis display,
and API-backed chat.
Set `EXPO_PUBLIC_API_URL` to override the default `https://kimbo-backend.fly.dev`.
Use a device-accessible hostname when running a local backend on a physical phone.

All auth API operations use TanStack Query and the shared Axios client with
request/response interceptors. Native tokens use SecureStore; web tokens stay in
memory. Passwords are never persisted. Run `pnpm check:auth` for session race,
interceptor, form validation, and signup-draft checks.

The backend must include `GET /v1/accounts/me` before native session restoration
can work. Web integration also requires its origin in backend `CORS_ORIGINS`.
Server-confirmed onboarding controls member Home access. Onboarding submits via
`POST /v1/accounts/onboarding`; run `pnpm check:onboarding` for validation,
measurement conversion, draft persistence, and retry checks.
Continue as guest creates a real backend identity and reuses a saved guest on
native relaunch. Repeated taps share one creation/save operation. Registration
converts the same guest using its preserved token; registration conflicts retain
the guest session. If token storage fails, retry saving without creating another
account. Run `pnpm check:guest` for guest lifecycle checks using isolated fixtures.
Guest onboarding uses the same authenticated endpoint as member onboarding;
neither flow completes locally. Home and daily history use `/v1/home?date=...`
through account-scoped TanStack queries, with account-timezone calendar dates,
ordered timeline boundaries, and refresh/error/empty states. Unqueried days have
unknown recording status. Run `pnpm check:home` for the isolated guest onboarding
and Home workflow, date/DST, media, validation, cancellation, and cache checks.
Phase 9 below connects thread history and chat messaging.

Phase 5 replaces capture/review and manual meal/exercise placeholders and adds a
note form. React Hook Form and Zod validate confirmed facts; photo picking uses
Expo ImagePicker and normalizes images to JPEG (longest edge at most 2048 px).
Drafts include reporting date, occurrence timestamp, return origin, and up to ten
photos (20 MB decoded total). Account-scoped drafts persist in native SQLite or
web local storage, including image bytes, and remain until explicit discard or
successful server saving in Phase 6. Storage failures retain the in-memory draft
and offer retry. Browser storage capacity may limit photo-heavy drafts.
Phase 6 enables server saving from the review screen.
Run `pnpm check:upload` for validation, media limits, persistence, isolation, retry,
and discard checks. Camera/gallery permissions and selection require device QA;
image-picker permission text requires a rebuilt native binary to take effect.

Phase 6 connects Entry CRUD through the shared Axios bearer client and TanStack
Query. Review saves meal, exercise, and note facts with Base64 attachments;
Home/history cards open actual entry details with edit and confirmed delete.
Edits send the loaded revision, preserve food IDs and unchanged nutrition sources,
and refresh account-scoped Home/day/list/detail caches. Revision conflicts keep
local edits and offer viewing the latest entry or explicitly discarding old edits.
Existing PNG/WebP and audio attachments are preserved during edits; new capture
continues to accept photos only.

Save taps share one in-flight operation, drafts are locked during saving, and
errors retain the draft. Confirmed server saves clear drafts; if local deletion
fails, a persisted save receipt supports cleanup without creating another entry.
The backend does not provide create idempotency keys, so an unconfirmed network
save explicitly asks the user to check the originating day before retrying.
No save mutation is automatically retried. Reads use cancellation and response
validation; session changes cannot populate a new account's caches or clear its
drafts. Run `pnpm check:entries` for isolated Axios/TanStack CRUD, Base64, revision,
provenance, duplicate-tap, receipt/restart, cache, and session-race checks using the
member test email `test@email.com`. Live deployment/device checks remain separate.
Phase 7 below adds nutrition lookup/calculation; Phase 8 adds AI synopsis display.

Phase 7 adds USDA/Open Food Facts search, food details, pagination, and server
portion calculation inside meal drafts. Every request uses the Axios identity
binding and TanStack Query; search is explicitly submitted, cached for five
minutes, and does not automatically retry provider errors. Food selection loads
its full reference before enabling a portion. Only mass units (g/kg/oz) or volume
units (ml/l) matching the food reference are offered. No density is assumed.
Missing calories require manual nutrition; unknown macros remain null and explicit
zeros are preserved. Calculated foods keep their provider reference through draft
restarts, Entry POST/PATCH, and unchanged edits. Changing values manually switches
that food to user-entered nutrition; recalculation preserves its existing ID.
Failed/stale calculations keep meal data and cannot replace newer manual edits.
Review and saved entry details show the effective nutrition source.
USDA requires the backend's `USDA_FDC_API_KEY`; Open Food Facts is independently
selectable. Provider keys are never exposed to the app. Run `pnpm check:nutrition`
for isolated search/detail/calculation, provenance, units, null nutrients, errors,
cancellation, restart, and session/draft checks using `test@email.com` fixtures.

Phase 8 displays the server's daily nutrition and exercise totals on Home and daily
history. Consumed and burned calories remain separate; null burned calories display
as unknown, and explicit zeros are preserved. AI summaries appear separately from
saved notes on photo, audio, and text cards and in full on entry details. Queued,
processing, completed (including an empty synopsis), failed, and not-requested
states have distinct messages. AI text never changes confirmed meal facts or totals.

Pending analysis uses the existing account-scoped Home/Entry reads every five
seconds, for at most two minutes per visit/foreground activation. Polling pauses
when the route loses focus or the app backgrounds and stops on terminal analysis
states or HTTP/validation errors. Pull to refresh Home/history or use Check for
updates on entry details for a manual read. These actions do not restart failed
analysis: the backend has no dedicated analysis-retry endpoint. Previous data stays
visible on refresh failure, with an error notice; edits replace the previous AI
summary with the new server state. Run `pnpm check:summary` for isolated state,
polling-window, server-total, retry-read, revision, and cache-isolation checks using
`test@email.com` fixtures. Live analysis timing and route/background transitions
still require device QA.

Phase 9 replaces demo chat history and model choices with account-scoped APIs.
Members create a thread with an optional title and server-default or returned model,
then send text messages. The model endpoint is a limited catalog; existing thread
models missing from it remain selected. History supports cursor pagination and
archived conversations; messages load the latest page and allow older pages.
Conversation options rename, archive/unarchive, and confirm deletion. Thread/model
changes and new sends are blocked during known generation, and server 409 conflicts
offer checking saved messages rather than automatic retries.

Chat uses the shared Axios bearer client and TanStack Query for authenticated
reads/writes. An Axios text/XHR request parses cumulative NDJSON download progress,
retains partial lines and Unicode, and flushes buffered transports at completion.
The client deadline is 200 seconds to accommodate the backend's three-minute run.
Replies show thinking/generating state, tool activity, persisted sources with
expandable snapshots, and actual model attribution when the catalog provides it.
HTTP errors and streamed failure/cancellation events are handled separately.
Attachments are hidden because the chat contract currently accepts text only.

Each send gets one UUID; repeated taps share the in-flight send. Interrupted retries
keep that UUID and original text, replacing the transient preview on server replay.
Leaving the conversation, backgrounding, stopping, or changing account aborts the
connection. Retry state remains in account-scoped memory while navigating within a
session and clears on session changes. After restart, processing saved message pairs
can recover their original request UUID via Retry saved request. Never assume a
disconnection means the server did not save a message. Completed/failed/cancelled
requests replay their saved result; another message gets a new UUID for a new run.
Thread creation has no server idempotency key and is never automatically retried;
unconfirmed creation errors ask the user to check History before creating again.

Run `pnpm check:chat` for isolated thread CRUD, model defaults/catalog gaps,
pagination, persisted messages/sources, split NDJSON/Unicode, replay, failure,
duplicate taps, buffering, cancellation, conflicts, authentication, and account
isolation using `test@email.com` fixtures. Typecheck, lint, all integration checks,
and a web export passed. In-app browser QA was unavailable due to its tool
configuration; live provider streaming, mobile keyboard behavior, drawer navigation,
and real-device background/cancellation still need QA.
