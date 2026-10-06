const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};
const { AxiosError, CanceledError } = require('axios');
const { QueryClient, QueryObserver } = require('@tanstack/react-query');
const { createApiClient } = require('../src/lib/api/client.ts');
const { createChatService } = require('../src/features/chat/service.ts');
const { createChatStream } = require('../src/features/chat/stream.ts');
const { createChatRunStore } = require('../src/features/chat/run-store.ts');
const { chatModels } = require('../src/features/chat/models.ts');
const { chatKey, threadKey, threadOptions, threadsOptions, messagesOptions, refreshChat } = require('../src/features/chat/queries.ts');
const { sendSchema } = require('../src/features/chat/schema.ts');
const member = { id: randomUUID(), epoch: 1, token: 'fixture-member-token', email: 'test@email.com' };
const threadId = randomUUID(), modelId = randomUUID(), userId = randomUUID(), assistantId = randomUUID();
const timestamp = '2026-10-06T10:00:00Z';
const source = { id: randomUUID(), type: 'daily_health', title: 'Today', origin: 'context', query: { date: '2026-10-06' },
  snapshot: { consumedCalories: 195, burnedCalories: null }, provenance: { entities: [], healthRecordIds: [] } };
const thread = { id: threadId, title: null, aiModelId: modelId, threadStatus: 'active', createdAt: timestamp, updatedAt: timestamp };
const model = { id: modelId, name: 'Fixture model', provider: 'openrouter', providerModelId: 'fixture/model', supportsText: true, supportsImages: true, supportsAudio: false };
const message = (role, requestId, sequenceNumber = role === 'user' ? 1 : 2) => ({ id: role === 'user' ? userId : assistantId, threadId, message: role === 'user' ? 'How was today?' : 'Today 🥑 was logged.',
  role, requestId, sequenceNumber, status: 'completed', replyToMessageId: role === 'assistant' ? userId : null, actualModelId: role === 'assistant' ? modelId : null,
  metadata: role === 'assistant' ? { sources: [source] } : {}, errorCode: null, createdAt: timestamp, updatedAt: timestamp, completedAt: timestamp });
function events(requestId, ending = 'completed', replayed = false) {
  return [
    { type: 'message.started', messageId: assistantId, userMessageId: userId, requestId, replayed },
    { type: 'agent.status', status: 'thinking' },
    { type: 'source.added', source },
    { type: 'tool.started', toolCallId: 'tool-1', tool: 'get_entries', label: 'Checking your meals' },
    { type: 'tool.completed', toolCallId: 'tool-1', tool: 'get_entries' },
    { type: 'tool.started', toolCallId: 'tool-2', tool: 'get_week_health', label: 'Checking this week' },
    { type: 'tool.failed', toolCallId: 'tool-2', tool: 'get_week_health', errorCode: 'TOOL_UNAVAILABLE' },
    { type: 'agent.status', status: 'generating' },
    { type: 'text.delta', delta: 'Today 🥑 ' }, { type: 'text.delta', delta: 'was logged.' },
    ending === 'completed' ? { type: 'message.completed', messageId: assistantId, actualModelId: modelId, replayed }
      : { type: `message.${ending}`, messageId: assistantId, errorCode: ending === 'cancelled' ? 'CANCELLED' : 'AI_PROVIDER_ERROR' },
  ];
}
const encode = rows => rows.map(row => JSON.stringify(row)).join('\n') + '\n';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
async function main() {
  const requestId = randomUUID();
  const rows = events(requestId), text = encode(rows), seen = [];
  const parser = createChatStream(requestId, event => seen.push(event));
  for (let end = 1; end <= text.length; end++) parser.push(text.slice(0, end));
  parser.push(text); assert.equal(parser.finish().type, 'message.completed');
  assert.deepEqual(seen, rows, 'Split lines, Unicode and repeated cumulative text are decoded exactly once');
  const finalWithoutNewline = createChatStream(requestId, () => {}); finalWithoutNewline.push(text.trimEnd()); finalWithoutNewline.finish();
  for (const bad of ['{}\n', '{broken}\n', encode([{ type: 'text.delta', delta: 'before start' }]), encode(events(randomUUID()))]) {
    assert.throws(() => createChatStream(requestId, () => {}).push(bad), error => error.code === 'INVALID_CHAT_STREAM');
  }
  const incomplete = createChatStream(requestId, () => {}); incomplete.push(encode(rows.slice(0, -1)));
  assert.throws(() => incomplete.finish(), error => error.code === 'INVALID_CHAT_STREAM');
  const wrongTerminal = createChatStream(requestId, () => {});
  assert.throws(() => wrongTerminal.push(encode([...rows.slice(0, -1), { ...rows.at(-1), messageId: randomUUID() }])), error => error.code === 'INVALID_CHAT_STREAM');
  assert.equal(sendSchema.safeParse({ requestId, text: ' ' }).success, false);
  assert.equal(sendSchema.safeParse({ requestId, text: 'x'.repeat(8001) }).success, false);
  assert.equal(chatModels([])[0].id, 'server-default');
  assert.equal(chatModels([], modelId)[0].id, modelId, 'Catalog gaps preserve the existing thread model');

  let owner = member, savedThread = { ...thread }, savedMessages = [], mode = 'completed', hold, malformed = false, httpFailure = 0, buffered = false, unauthorized = 0, afterRead;
  const requests = [];
  const api = createApiClient('https://fixture.test', { getIdentity: () => owner, unauthorized: () => { unauthorized++; }, onboardingRequired: () => {} }, async config => {
    const body = config.data ? JSON.parse(config.data) : undefined;
    requests.push({ method: config.method, url: config.url, body, token: config.headers.Authorization, timeout: config.timeout });
    if (hold) await hold.promise;
    if (config.signal?.aborted) throw new CanceledError();
    let data, headers = {}, status = 200;
    if (httpFailure) {
      status = httpFailure; data = config.responseType === 'text' ? JSON.stringify({ message: httpFailure === 409 ? 'THREAD_BUSY' : 'Invalid credentials' }) : { message: 'Unavailable' };
    } else if (config.url.endsWith('/messages') && config.method === 'post') {
      assert.deepEqual(Object.keys(body).sort(), ['content', 'requestId']);
      assert.equal(config.timeout, 200000); assert.equal(config.headers.Accept, 'application/x-ndjson');
      const replayed = savedMessages.some(message => message.requestId === body.requestId);
      const streamRows = events(body.requestId, mode === 'incomplete' ? 'completed' : mode, replayed);
      data = encode(mode === 'incomplete' ? streamRows.slice(0, -1) : streamRows);
      headers = { 'content-type': 'application/x-ndjson; charset=utf-8' };
      if (!buffered) {
        const xhr = { status: 200, responseText: '', getResponseHeader: () => headers['content-type'] };
        for (let end = 11; end < data.length; end += 23) {
          xhr.responseText = data.slice(0, end); config.onDownloadProgress({ event: { target: xhr } });
          if (config.signal.aborted) throw new CanceledError();
        }
      }
      if (mode !== 'incomplete') savedMessages = [message('user', body.requestId), { ...message('assistant', body.requestId), status: mode, errorCode: mode === 'completed' ? null : 'SAFE_ERROR' }];
    } else if (config.url === '/v1/ai/models') data = [model, { ...model, id: randomUUID(), supportsText: false }];
    else if (config.url.includes('/messages?')) data = savedMessages;
    else if (config.method === 'post') { data = savedThread = { ...thread, ...body }; status = 201; }
    else if (config.method === 'patch') data = savedThread = { ...savedThread, ...body };
    else if (config.method === 'delete') { data = ''; status = 204; }
    else if (config.url.includes('?limit=')) data = [savedThread];
    else data = savedThread;
    if (malformed) data = { invalid: true };
    afterRead?.();
    const response = { config, status, data, headers, statusText: '' };
    if (status >= 400) throw new AxiosError('Failed', 'ERR_BAD_REQUEST', config, undefined, response);
    return response;
  });
  const service = createChatService(api, () => owner);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  try {
    assert.equal((await service.models(member)).length, 1);
    assert.equal((await service.create(member, {})).id, threadId);
    assert.deepEqual(requests.at(-1).body, {}, 'Server chooses default without a guessed model');
    await service.create(member, { aiModelId: modelId, title: 'Weekly check-in' });
    await service.update(member, threadId, { title: 'Renamed', threadStatus: 'archived' });
    assert.equal((await service.get(member, threadId)).threadStatus, 'archived');
    await service.update(member, threadId, { threadStatus: 'active', aiModelId: modelId });
    assert.equal((await service.list(member, threadId)).length, 1); assert.ok(requests.at(-1).url.includes(`cursor=${threadId}`));
    assert.equal(threadsOptions(service, member).getNextPageParam(Array(50).fill(thread)), threadId);
    assert.equal(threadsOptions(service, member).getNextPageParam([]), undefined);
    assert.equal(messagesOptions(service, member, threadId).getNextPageParam(Array(50).fill(message('user', requestId))), 1);
    let count = requests.length;
    await assert.rejects(service.get(member, 'demo-thread')); await assert.rejects(service.create(member, { aiModelId: 'openai' }));
    await assert.rejects(service.send(member, threadId, { requestId, text: '' }, new AbortController().signal, () => {}));
    assert.equal(requests.length, count);
    const runner = createChatRunStore(service, member, threadId, randomUUID);
    hold = deferred(); const first = runner.send('How was today?'), second = runner.send('How was today?');
    assert.equal(first, second, 'Duplicate send taps share one allocation');
    assert.equal(runner.store.getState().busy, true); hold.resolve(); hold = null; await first;
    const state = runner.store.getState(); assert.equal(state.run.status, 'completed'); assert.equal(state.run.reply, 'Today 🥑 was logged.');
    assert.equal(state.run.sources.length, 1); assert.deepEqual(state.run.tools.map(tool => tool.status), ['completed', 'failed']);
    assert.equal(state.run.actualModelId, modelId); assert.equal(state.busy, false);
    const originalRequestId = state.run.requestId;
    await runner.retry(); assert.equal(runner.store.getState().run.requestId, originalRequestId); assert.equal(runner.store.getState().run.replayed, true);
    assert.equal(runner.store.getState().run.reply, 'Today 🥑 was logged.', 'Replay replaces preview instead of duplicating text');
    const loaded = await service.messages(member, threadId); assert.equal(loaded[1].metadata.sources[0].snapshot.burnedCalories, null);
    await service.messages(member, threadId, 3); assert.ok(requests.at(-1).url.includes('before=3'));
    mode = 'failed'; await runner.send('Another question'); assert.equal(runner.store.getState().run.status, 'failed');
    assert.ok(runner.store.getState().error); assert.notEqual(runner.store.getState().run.requestId, originalRequestId);
    mode = 'cancelled'; await runner.send('Cancel fixture'); assert.equal(runner.store.getState().run.status, 'cancelled');
    mode = 'incomplete'; await runner.send('Interrupted fixture'); const interruptedId = runner.store.getState().run.requestId;
    assert.equal(runner.store.getState().run.status, 'interrupted');
    mode = 'completed'; buffered = true; await runner.retry(); assert.equal(runner.store.getState().run.requestId, interruptedId);
    assert.equal(runner.store.getState().run.status, 'completed', 'Buffered transports flush the complete NDJSON response'); buffered = false;
    httpFailure = 409; await runner.send('Busy thread fixture'); assert.equal(runner.store.getState().run.status, 'interrupted');
    assert.ok(runner.store.getState().error.includes('THREAD_BUSY')); const busyId = runner.store.getState().run.requestId;
    httpFailure = 0; await runner.retry(); assert.equal(runner.store.getState().run.requestId, busyId);
    hold = deferred(); const stopped = runner.send('Stop fixture'); runner.stop(); hold.resolve(); hold = null; await stopped;
    assert.equal(runner.store.getState().run.status, 'interrupted'); assert.ok(runner.store.getState().error.includes('stopped'));
    await runner.retry(); assert.equal(runner.store.getState().run.status, 'completed');
    const recoveredId = runner.store.getState().run.requestId;
    const reopened = createChatRunStore(service, member, threadId, randomUUID);
    await reopened.recover({ requestId: recoveredId, text: 'Stop fixture' }); assert.equal(reopened.store.getState().run.replayed, true);
    httpFailure = 401; await assert.rejects(service.send(member, threadId, { requestId: randomUUID(), text: 'Auth fixture' }, new AbortController().signal, () => {}), error => error.status === 401);
    assert.equal(unauthorized, 1, 'Streaming uses shared auth error interception for JSON text bodies'); httpFailure = 0;
    malformed = true; await assert.rejects(service.get(member, threadId), error => error.code === 'INVALID_CHAT_RESPONSE'); malformed = false;
    await client.fetchQuery(threadOptions(service, member, threadId));
    client.setQueryData([...chatKey(member), 'threads'], { pages: [[thread]], pageParams: [undefined] });
    const other = { ...member, id: randomUUID(), epoch: 2, token: 'other-token' };
    client.setQueryData(threadKey(other, threadId), { foreign: true });
    await refreshChat(client, member, () => service.isCurrent(member));
    assert.equal(client.getQueryState(threadKey(member, threadId)).isInvalidated, true);
    assert.equal(client.getQueryState(threadKey(other, threadId)).isInvalidated, false);
    const observer = new QueryObserver(client, threadOptions(service, member, threadId));
    observer.setOptions({ ...threadOptions(service, { ...other, id: randomUUID() }, threadId), enabled: false });
    assert.equal(observer.getCurrentResult().data, undefined); observer.destroy();
    await service.delete(member, threadId); assert.equal(requests.at(-1).method, 'delete');
    hold = deferred(); const switching = runner.send('Session race fixture'); const beforeSwitch = runner.store.getState();
    owner = other; hold.resolve(); hold = null; await switching;
    assert.equal(runner.store.getState(), beforeSwitch, 'Old replies do not update a switched account');
    count = requests.length; await assert.rejects(service.get(member, threadId), error => error.code === 'SESSION_CHANGED'); assert.equal(requests.length, count);
    owner = member; afterRead = () => { owner = other; };
    await assert.rejects(service.get(member, threadId), error => error.code === 'SESSION_CHANGED'); afterRead = null;
    assert.ok(requests.every(request => request.token === `Bearer ${member.token}`));
  } finally { client.clear(); }
  console.log('Chat checks passed: bearer thread CRUD, models/defaults, pagination, saved messages/sources, split NDJSON/Unicode, terminal failures, idempotent retries, duplicate taps, cancellation, buffering, conflicts, auth and session isolation.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
