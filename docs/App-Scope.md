# Kimbo — App Product and Navigation Specification

Status: agreed product direction translated into an implementation specification.
Prepared: 3 October 2026.
Scope: app behavior, navigation, data, states, mock execution, and later integration. This document deliberately contains no visual design or styling specifications.

## 1. Product objective

Kimbo helps a person record meals and activity, understand their daily habits against a monthly goal, and ask an assistant questions grounded in their recorded history. The core cycle is: establish a goal, log something, confirm it, observe progress, and ask what that progress means.

The assignment allows scope reduction and requests 3–4 complete flows rather than an entire health platform. Kimbo therefore has four core flows:

1. Start as a guest or account holder, complete onboarding, and establish a monthly goal.
2. Record food or exercise through a photo or manual entry, review the result, and save it.
3. Review daily, weekly, and monthly progress, including weight records.
4. Create account-gated AI conversations grounded in the active profile's data.

Account creation and profile management support these flows; they should not become separate large projects. Health-report uploads and voice logging are suggestions in the brief, not mandatory features; defer both for this version.

## 2. Scope and dependency decisions

### App dependency rule

Use React, React Native core, TypeScript, Expo Router, and first-party Expo SDK packages. Dependencies required by the Expo template or Expo Router are allowed; “Expo-only” does not mean manually removing their required transitive dependencies.

For this first implementation, do not add Reanimated, Skia, Lucide, Zustand, TanStack Query, React Hook Form, Zod, Axios, external date pickers, chart packages, or third-party storage libraries. This supersedes the earlier broader mobile stack for today's build. It does not change the planned NestJS, Supabase PostgreSQL, Drizzle, and OpenRouter backend.

Use React context and hooks for session and app state, typed plain functions for validation, and built-in fetch for future network requests. Keep data operations behind a service interface so adopting other libraries later is optional rather than necessary.

| Package or built-in capability | Responsibility |
| --- | --- |
| expo-router | Route groups, tabs, nested navigation, route parameters |
| expo-secure-store | Installation identifier and eventual session credentials |
| expo-crypto | Generate a random installation UUID |
| expo-sqlite, including its key-value storage API | Persist mock profile, goals, entries, preferences, and threads |
| expo-image-picker | Take a photo through the system camera or choose an existing image |
| expo-image-manipulator | Resize and compress images before future uploads |
| expo-file-system | Keep durable local copies of saved entry photos |
| expo-haptics | Optional feedback; never required for a flow to work |
| React Native core | Inputs, lists, loading states, keyboard behavior, platform settings link, and built-in animations if needed |

Use system camera capture through expo-image-picker initially. A separate expo-camera implementation is unnecessary unless embedded capture becomes a genuine requirement. Request permissions only when the user invokes the relevant action.

Install Expo dependencies through `npx expo install` so versions match the selected SDK. Start with a current Expo template compatible with the Expo Go installed on the testing phone. Avoid experimental native APIs and features that require a custom native build. Test core paths in Expo Go, then also verify the release APK: Expo Go permission behavior is not proof that release permission configuration is correct.

Do not pin SDK or package versions from this document; use the compatible versions selected during project creation. Expo Go does not cover every possible native configuration, and “Expo-only” does not eliminate release-build verification.

### Deferred features

No video analysis, voice transcription, health reports, hardware device identifiers, BYOK, full OpenRouter catalog, subscriptions, social login, password recovery, push reminders, device health integrations, multi-account management, or elaborate offline synchronization. No real provider requests or embedded provider keys during mock development.

## 3. Identity and data ownership

Every health record belongs to a profileId. Account registration attaches an account to the existing guest profile; it does not copy records into a new owner.

An installationId is a generated identifier, not an authentication credential. The future backend must issue a guest session credential and verify ownership rather than trusting a supplied profileId or installationId.

| Concept | Meaning |
| --- | --- |
| Installation | Local app installation identity |
| Profile | Owner of onboarding, goals, entries, history, and conversations |
| Account | Optional email/password identity linked to a profile |
| Session | Current access to the active profile |
| Onboarding draft | Incomplete answers, separate from a completed profile |

Guest capabilities: onboarding, goals, manual/photo logging, weight logging, and history. Account capabilities: the same plus AI chat and chat model selection. Photo analysis remains available to guests; account gating applies to conversational AI. Future server limits must protect guest image analysis from abuse.

During the mock phase, guest history lives on the device. After backend integration, describe storage truthfully if guest records also live on the server. Do not continue claiming that data is exclusively local.

Uninstall is not a supported guest recovery mechanism. Storage behavior varies by platform; never promise that uninstall always removes or preserves the installation identity. Reopening the app must preserve data. Clearing application storage may remove guest history.

## 4. Launch and routing rules

Startup first restores credentials, installation identity, active profile, and onboarding status. Do not route from an initial default state before restoration finishes.

| Restored condition | Destination |
| --- | --- |
| No active profile | Welcome |
| Active profile with incomplete onboarding | First unfinished onboarding step |
| Completed profile with a current monthly goal | Home |
| Completed profile but current monthly goal missing | Goal creation for the current month |
| Invalid account session | Sign-in recovery; private account data stays inaccessible |
| Corrupt or unreadable local state | Recovery action; never silently overwrite existing history |

A transient server error is not automatically a logout. Previously cached data may remain readable under the active session; actions requiring a valid server session must surface the failure.

After successful sign-in or onboarding, replace the navigation history so Back does not return to completed onboarding or credentials. A guest opening a protected chat route follows the same account gate as a guest navigating normally.

## 5. Route inventory

Route groups below organize implementation and do not become literal URL segments. Route files should delegate product behavior to feature modules.

| Route file under app/ | Responsibility | Normal exit |
| --- | --- | --- |
| index.tsx | Restore state and choose destination | Welcome, onboarding, goal, or Home |
| (auth)/welcome.tsx | Choose guest, sign in, or create account | Onboarding or authenticated destination |
| (auth)/register.tsx | Create account or promote guest | Resume interrupted action or Home |
| (auth)/login.tsx | Sign in to existing account | Existing account's destination |
| (onboarding)/about-you.tsx | Personal facts and measurements | Goal intention |
| (onboarding)/goal.tsx | Lose, maintain, or gain intention | Lifestyle |
| (onboarding)/lifestyle.tsx | Activity level and dietary context | Target |
| (onboarding)/target.tsx | Review proposed monthly target and confirm | Home |
| (tabs)/index.tsx | Today's summary and entries | Capture, entry, goal, or selected date |
| (tabs)/ai.tsx | Account gate or thread list | Registration, sign-in, or thread |
| (tabs)/profile.tsx | Profile facts, progress access, preferences, account actions | History, goal, weight, or auth |
| capture/index.tsx | Start camera, gallery, or manual logging | Review, manual entry, or origin |
| capture/review.tsx | Confirm an analysis draft | Saved entry or origin |
| entries/new-meal.tsx | Manual meal draft | Saved entry or origin |
| entries/new-exercise.tsx | Manual exercise draft | Saved entry or origin |
| entries/[entryId].tsx | Read, edit, and delete owned entry | Originating day |
| history/index.tsx | Select weekly or monthly period | Day or goal details |
| history/day/[date].tsx | Records and totals for a date | Entry, capture, or history |
| goals/current.tsx | Inspect current month's target | Edit, Home, or Profile |
| goals/edit.tsx | Create or revise current goal | Origin |
| weight/new.tsx | Add a dated weight record | Origin |
| chat/[threadId].tsx | Conversation and model preference | AI thread list |

Parameters should contain identifiers, dates, or a small origin marker. Keep images, credentials, full records, and conversation arrays out of route parameters. Review retrieves its draft from app state using a draftId. Missing drafts or unknown IDs produce a recoverable destination rather than a crash.

Three persistent destinations are Home, AI, and Profile. History is reached from Home or Profile; capture is an action rather than an additional permanent destination. Preserve the selected history period when returning from a day or record.

## 6. Welcome, guest, registration, and login

### Continue as guest

Generate or restore installationId, create a guest profile, establish the mock guest session, persist the active identity, and start onboarding. Repeated activation while creation is pending must not create duplicate profiles.

### Create an account on first launch

Collect display name, email, password, and password confirmation. Trim name/email, validate email shape, and apply one documented password policy shared with the future backend. Successful registration establishes a profile and starts onboarding. Failed registration preserves non-secret entered information and allows retry.

### Promote an existing guest

Registration from Profile or the AI gate attaches the account to the guest's existing profile. Retain profileId, goal, entries, weight history, and onboarding completion. Return to the interrupted destination after success; do not force onboarding again.

If the email is already registered, offer sign-in. Signing in to an existing account does not automatically merge guest history. Explain that the active profile will change, preserve the guest profile locally, and use the account's profile. Guest-to-new-account promotion and guest-to-existing-account merging are different operations; only the former is in scope.

### Sign in

Collect email/password and restore the account's profile. Incomplete onboarding resumes at the correct step. Completed accounts go to Home or the protected destination that triggered sign-in. An invalid-credentials failure does not reveal whether the email exists.

Mock authentication must be explicitly simulated. Use a known test account and injected success/failure scenarios; never store real passwords locally or claim that mock login provides real security.

### Log out

Confirm intent, invalidate the eventual account session, remove local credentials, and clear active account data from memory. Return to Welcome. A preserved unrelated guest profile can be resumed through Continue as guest. If the guest profile was promoted into the logged-out account, do not expose that account's records as unauthenticated guest data; create a fresh guest profile if requested.

## 7. Onboarding and monthly goals

Onboarding is mandatory once per profile. Persist each completed step so interruption or app restart does not discard progress. Back returns to the preceding step with values retained. Canceling does not mark onboarding complete.

### About you

Collect display name, age, height in centimeters, and current weight in kilograms. If the future target calculation needs sex-related physiological input, explain its purpose and allow an unspecified option with a manual target path. Do not collect that information merely because it appeared in a generic onboarding template.

For this assignment, target adult users. Unsupported ages stop personalized weight-target setup rather than producing an inappropriate recommendation. Validate numeric values, units, and plausible ranges; report invalid input without silently converting it.

### Goal intention

Choose lose weight, maintain weight, or gain weight. Store the intention independently from target weight. Maintenance does not require manufacturing a different target weight.

### Lifestyle

Collect activity level and optional dietary preference. Dietary preference changes future suggestions, not arithmetic calorie totals. Do not add a medical questionnaire or diagnostic feature.

### Target confirmation

Establish the current calendar month, starting weight, optional target weight, daily calorie target, and optional weekly activity target. In the mock build, proposed targets are fixture values explicitly treated as estimates, not recommendations generated by an implemented scientific calculator.

Allow correction before confirmation. A target requires finite positive values and a valid relationship to the chosen intention. Final nutritional-target validation and estimation belong to the backend phase. Completing this step saves the profile and goal together, then replaces onboarding navigation with Home.

### Goal rules

There is one current goal per profile per calendar month, using the profile's selected timezone. Monthly progress includes days logged, average calories on logged days, activity totals, and latest versus starting weight. Do not count missing days as zero calories.

Weight-based progress is applicable only when starting and target weights differ. Maintenance reports consistency and trend rather than dividing by zero. Values outside a target can be reported accurately; they must not imply guaranteed health improvement.

Editing a goal changes its target and update timestamp but never rewrites entries. At month rollover, retain the old goal and history, ask the user to confirm the new month's goal, and prefill prior preferences. Do not silently renew a changing-weight target.

## 8. Home and daily logging context

Home defaults to today in the profile's timezone. It provides access to the current goal, today's confirmed meals and exercise, total food calories, activity totals, latest weight, and daily logging actions.

Food remaining equals daily intake target minus confirmed food calories. Exercise calories are tracked separately and do not automatically increase the intake allowance. Negative remaining calories mean the intake target was exceeded; preserve the actual number in the data.

Opening a past day uses the same entry data and supports adding or correcting records for that date. Future-dated logs are out of scope. Preserve the chosen date while inspecting records. A new log started from a historical day defaults to that day; a new log started from Home defaults to today.

An empty day has no entries, not a failed request. Loading, empty, failed, and populated states must remain distinct. Return from saved or deleted records with updated totals and no duplicate records.

## 9. Camera/gallery capture and analysis

1. User starts logging from Home or a historical day.
2. User chooses take photo, pick photo, manual meal, or manual exercise.
3. Request the relevant permission if needed. Denial offers manual entry; permanent denial may offer device settings.
4. Camera/gallery cancellation returns without creating a record.
5. Create an in-memory draft containing photo URI, selected date, origin, and draftId.
6. Resize the photo to approximately 1024 pixels on its longest edge, without enlarging small images, and compress to JPEG.
7. Run mock analysis today; later upload multipart data to NestJS.
8. Receive meal, exercise, ambiguous, or unsupported classification.
9. Open review with editable inferred facts.
10. Save only after explicit user confirmation.

Model detection is a suggestion. A user can change a meal classification to exercise and vice versa. An exercise photo cannot reliably establish duration, intensity, or calories burned; require the user to supply missing facts instead of inventing them.

For ambiguous photos, ask the user to choose meal/exercise or retake the photo. Unsupported images lead to manual logging or a new photo. Analysis timeout, upload failure, invalid structured output, and provider unavailability keep the draft available for retry or manual completion.

Retaking a photo replaces the unsaved draft image. If the user abandons a changed draft, confirm discard. Unsaved capture drafts need not survive process termination in this version; after restart, return safely to the originating day. Saved photo files must survive normal app restarts by being copied out of temporary picker locations.

## 10. Meal review and manual meals

A meal contains date/time, meal category, optional photo, one or more food items, and optional notes. Each item contains a name, amount, unit, and calories; protein, carbohydrates, and fat are optional if unavailable.

AI identifies food and proposes amounts; a nutrition lookup supplies reference nutrition where a suitable match exists. Neither source makes an uncertain photo portion exact. Preserve whether amounts and nutrition are estimated, database-sourced, or user-entered.

Review supports changing names, portions, units, meal category, and date/time; adding/removing items; and correcting nutrition. The meal total is the sum of item values. Changing a quantity must recalculate against a valid reference amount or request new nutrition; it must not leave stale values silently attached.

Reference data is not guaranteed to cover homemade Indian dishes. Unmatched food may use explicitly estimated or manually entered calories with its source retained. Do not fabricate a USDA or Open Food Facts match. Unknown macros remain unknown rather than becoming zero.

Manual meal entry follows the same validation and save path. Require at least one named item with a positive amount and finite non-negative calories. Allow item removal only if the resulting draft can still be validated before saving.

Save transitions through pending, success, or failure. Block repeated submissions while pending. Success creates a stable ID and returns to the originating day. Failure retains the draft. The future API must use a stable operation identifier for duplicate-safe retries.

## 11. Exercise review and manual exercise

An exercise contains activity type, duration in minutes, date/time, optional intensity, optional estimated calories burned, optional photo, and optional notes. Require a named activity and positive duration. Calories burned can remain unknown; unknown is distinct from zero.

Photo analysis may suggest an activity but the user confirms it. If calories are estimated later, preserve the estimation source and inputs. Do not infer a completed workout just because a photograph contains gym equipment.

Saving follows the same draft, pending, success, failure, and duplicate-prevention behavior as meals. It updates exercise totals and history, without altering the daily food target.

## 12. Entry details, editing, and deletion

Opening an entry loads it by entryId within the active profile. An invalid ID, a deleted record, or a different profile's ID leads to an unavailable-record state and a return action.

Editing uses a draft copy. Cancel leaves the saved record unchanged. Save validates and replaces the existing record rather than inserting a second record. Changing its date updates both the previous and new daily totals.

Deletion requires confirmation. Success removes the record from daily and historical aggregates. Failure leaves the record in place and permits retry. Deleting a record does not delete its goal or conversation history.

## 13. Weight records and progress history

Weight logging accepts a positive weight in kilograms and a date up to today. Keep one daily weight measurement in this version; logging another for the same date explicitly replaces that day's value after confirmation.

Weekly history reports a documented calendar week, using Monday through Sunday. Monthly history uses a calendar month. Both use the profile's timezone rather than fixed UTC date slicing.

History includes days with confirmed food logs, calories per logged day, average intake across those days, exercise frequency/duration, available weight observations, and applicable goal context. Distinguish no data from zero-valued observations. Days logged means a day containing at least one confirmed meal; report activity days separately.

Selecting a day opens its records. Selecting a record opens its details. Back preserves the period and selected date. Historical months remain accessible even after a new goal is created. A day with no weight record does not invent one or create artificial precision by interpolation.

## 14. AI account gate, threads, and model switching

### Guest access

A guest entering AI is offered account creation or sign-in. Dismissing the gate returns to the prior destination. Account creation promotes the existing profile and unlocks chat with its accumulated health context.

### Thread lifecycle

An account user can create a conversation, open prior conversations, rename a conversation, or delete one after confirmation. An empty thread has no model response. Generate a simple title from the first user message; AI title generation is unnecessary.

Persist thread and message IDs, ownership, timestamps, ordering, and selected chat model. Thread deletion removes that conversation only, not health logs. A missing or deleted thread returns to the thread list safely.

### Sending a message

Reject blank messages. Persist the user message, mark the response pending, and send the selected public model ID with the thread ID. Use ordinary HTTP for this version; real streaming and WebSockets are deferred.

The future backend constructs context from onboarding, current goal, selected recent daily records, relevant historical aggregates, and a bounded set of thread messages. The client must not be trusted to submit authoritative health totals or another profile's context.

On success, persist the assistant response and actual model used. On failure, preserve the user message and allow retry without duplicating it. Allow one response request at a time per thread. A retry reuses the message/request identifier. If the user leaves during processing, later reopen the thread and recover its persisted status rather than create another request automatically.

Answers should distinguish tracked facts from inferred patterns and estimates. If history is insufficient, say so. Do not invent missing meals, diagnose illness, or claim that reaching calorie targets guarantees a result. No automatic log or goal mutation from a chat answer in this version.

### Model switching

Expose a small backend-approved list of chat models. Each entry has public ID, display name, capability, availability, and cost category. Today's model choices are fixtures; select actual affordable provider IDs during backend work rather than inventing prices.

Store the selection per thread and use the preferred default for new threads. Changing the model affects future messages only; it does not regenerate history. Record the model used on each assistant response.

Vision and food extraction models remain system-controlled. A text-only chat selection must not break photo analysis. If a model becomes unavailable, offer an enabled alternative and retain the message. A configured fallback must record the actual model; never silently claim the chosen model produced the response.

No API-key entry or BYOK flow. Provider credentials stay on NestJS.

## 15. Profile responsibilities

Profile exposes identity type, editable name and supported personal facts, current goal, weight logging, weekly/monthly history, and account actions. Optional profile photo selection can use expo-image-picker, but defer it if it delays the four core flows.

Guests can create an account or sign in. Account users can log out and set a preferred chat model. Editing measurements must not silently rewrite historical goals or nutritional targets. If a target should change, route the user through explicit goal revision.

Keep account settings limited to what actually works. Do not introduce unimplemented settings, notifications, provider credentials, or subscription destinations.

## 16. Functional mock phase

Mock mode should be a working local product simulation, not independent arrays copied into each destination. Use one profile-scoped persistent store and service methods with the same operations the backend will later support.

| Service responsibility | Required operations |
| --- | --- |
| Identity | Restore session, continue as guest, mock register/login/logout |
| Profile | Read facts, save onboarding draft, complete onboarding, update facts |
| Goals | Read current goal, create month goal, revise goal |
| Entries | Analyse draft, create meal/exercise, read, update, delete |
| Progress | Read day, week, month, and weight history; record weight |
| Chat | List/create/rename/delete threads, read messages, send/retry message |
| Models | List approved choices and store preferences |

Persist after mutations and derive daily/history totals from saved records. Do not maintain separately editable copies of the same totals. Scope all local records to profileId. Keep credentials in SecureStore and non-secret datasets in SQLite; ordinary SQLite storage is not encrypted health-data storage.

Mock photo analysis returns deterministic fixtures keyed to a selected scenario or known test photo. Label development/demo responses as simulated. Mock chat should use current fixture totals in canned replies so edits are reflected, without pretending a live model answered.

Seed fixtures only on a deliberate first initialization or explicit developer reset, never on every app launch. Add relative dates at seed time so today's dataset remains useful. Never run fixture reset automatically after a read failure.

### Required fixture profiles and cases

1. New guest with no onboarding or records.
2. Guest with completed onboarding and several days of food, exercise, and weight records.
3. Account profile with the same data plus two conversations.
4. Completed profile with no current-month goal.
5. Profile with an empty day and empty historical month.
6. Maintenance goal with no weight-change denominator.
7. Invalid record/thread IDs and a missing capture draft.

Inject analysis timeout, ambiguous image, unavailable nutrition, permission denial, save failure, invalid login, unavailable model, and failed chat response. Include controllable delay without random failures so scenarios can be reproduced.

Mock passwords, backend credentials, and production AI keys must never be packaged as real secrets. Local authentication simulation is only for development and must be disabled in the submission build once real services are integrated.

## 17. App structure and integration boundary

Keep routing in app/. Organize feature behavior under src/features/identity, onboarding, goals, home, capture, entries, history, chat, and profile. Place shared domain types under src/domain, service interfaces and mock/API implementations under src/services, and persistence under src/storage.

Today, feature code calls the mock implementation. Later, the same service boundary calls NestJS with session credentials. Upload services handle multipart images; domain services return normalized data rather than provider-specific responses.

Specify units, date semantics, nullability, identifiers, errors, and pending/success states now. Use kilograms, centimeters, grams where available, minutes, and kcal. Store event timestamps separately from their intended local calendar date. Unknown data is nullable; a missing value is not zero.

API integration will still require ownership enforcement, genuine auth, server validation, guest promotion, uploads, nutrition matching, model output validation, retry idempotency, and real-device error testing. Mock completion reduces integration rework; it does not make backend integration a mechanical URL replacement.

## 18. Order of work for today's app pass

1. Create the Expo project and verify it opens on the actual testing phone.
2. Establish domain types, persistent mock storage, fixture profiles, and service operations.
3. Implement startup restoration, Welcome, and resumable onboarding through monthly goal confirmation.
4. Implement Home and manual meal/exercise creation, detail, editing, deletion, and restart persistence.
5. Add camera/gallery input, compressed photo drafts, simulated analysis, and confirmation.
6. Add daily, weekly, monthly, and weight history using the same saved records.
7. Add guest promotion simulation, AI account gating, persisted threads, simulated responses, and selected chat models.
8. Verify failure, cancel, Back, restart, and duplicate-submit paths.

If time is short, reduce optional activity targets, profile photos, thread renaming, and extra settings first. Keep manual logging and record persistence working. Do not sacrifice complete save/review/error paths to add more destinations.

## 19. Completion criteria before starting backend work

- A fresh installation can enter as a guest, finish onboarding, and reach Home.
- Restart restores the same profile, incomplete onboarding step, saved records, and goal.
- A meal or exercise can be created manually, edited, deleted, and reflected in history.
- Camera/gallery cancellation and permission denial do not create records or block manual entry.
- Photo analysis drafts require confirmation and support correction and retry.
- Changing a record's date updates both affected days.
- Empty history, unknown nutrition, and missing records are recoverable.
- Guest registration preserves profileId and all saved health history.
- Signing in to an existing account switches profiles without merging unrelated data.
- Logging out does not expose account data in guest mode.
- Guests cannot open a protected conversation through a direct route.
- Account users can create/open conversations, send simulated messages, retry failures, and change models for subsequent messages.
- Month rollover and maintenance goals behave without invalid arithmetic.
- Repeated taps do not duplicate entries, profiles, or messages.
- No provider keys, real passwords, or privileged database credentials exist in the app.

## 20. Sources and boundaries

Assignment source: the supplied Personal Health Assistant PDF, especially its core-flow prioritization, persistence expectation, Expo/Node/TypeScript/PostgreSQL direction, and optimized Android APK requirement.

Product source: the supplied conversation covering guest promotion, mandatory onboarding, monthly goals, camera-first logging, history, account-gated chat, controlled model selection, and the NestJS/OpenRouter/Supabase backend.

Expo implementation references, checked for this specification:

- [Expo data storage guide](https://docs.expo.dev/develop/user-interface/store-data/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo permissions](https://docs.expo.dev/guides/permissions/)

The adult scope, precise route names, Monday-based weeks, one daily weight record, retry rules, and existing-account switch policy are implementation decisions made here to resolve unspecified behavior. They are not additional mandatory requirements from the assignment.
