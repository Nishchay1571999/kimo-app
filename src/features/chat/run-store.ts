import { createStore } from 'zustand/vanilla';
import type { ChatIdentity, createChatService } from './service';
import { sendSchema, type ChatSource, type SendInput } from './schema';

type Run = SendInput & {
  reply: string; messageId?: string; userMessageId?: string; actualModelId?: string | null;
  status: 'connecting' | 'thinking' | 'generating' | 'completed' | 'failed' | 'cancelled' | 'interrupted';
  replayed: boolean; sources: ChatSource[]; tools: { id: string; label: string; status: string }[];
};
export function createChatRunStore(service: ReturnType<typeof createChatService>, owner: ChatIdentity, threadId: string, uuid: () => string) {
  let abort: AbortController | null = null, pending: Promise<void> | null = null;
  const store = createStore<{ run: Run | null; busy: boolean; error: string | null }>(() => ({ run: null, busy: false, error: null }));
  const update = (values: Partial<Run>) => {
    if (service.isCurrent(owner)) { const run = store.getState().run; if (run) store.setState({ run: { ...run, ...values } }); }
  };
  function start(input: SendInput) {
    if (pending) return pending;
    if (!service.isCurrent(owner)) return Promise.resolve();
    const parsed = sendSchema.parse(input);
    abort = new AbortController();
    store.setState({ run: { ...parsed, reply: '', status: 'connecting', replayed: false, sources: [], tools: [] }, busy: true, error: null });
    const signal = abort.signal;
    pending = (async () => {
      try {
        const terminal = await service.send(owner, threadId, parsed, signal, event => {
          if (signal.aborted || !service.isCurrent(owner)) return;
          const run = store.getState().run!;
          switch (event.type) {
            case 'message.started': update({ messageId: event.messageId, userMessageId: event.userMessageId, replayed: event.replayed }); break;
            case 'agent.status': update({ status: event.status }); break;
            case 'text.delta': update({ reply: run.reply + event.delta }); break;
            case 'source.added': update({ sources: [...run.sources.filter(source => source.id !== event.source.id), event.source] }); break;
            case 'tool.started': update({ tools: [...run.tools.filter(tool => tool.id !== event.toolCallId), { id: event.toolCallId, label: event.label, status: 'processing' }] }); break;
            case 'tool.completed': case 'tool.failed': update({ tools: run.tools.map(tool => tool.id === event.toolCallId ? { ...tool, status: event.type === 'tool.completed' ? 'completed' : 'failed' } : tool) }); break;
          }
        });
        if (!service.isCurrent(owner)) return;
        if (terminal.type === 'message.completed') update({ status: 'completed', actualModelId: terminal.actualModelId });
        else if (terminal.type === 'message.failed' || terminal.type === 'message.cancelled') {
          update({ status: terminal.type === 'message.failed' ? 'failed' : 'cancelled' });
          store.setState({ error: terminal.type === 'message.failed' ? 'The AI response failed. Your message is saved. Send another message for a new response.' : 'The response was cancelled. Your message is saved.' });
        }
      } catch (error) {
        if (service.isCurrent(owner)) {
          update({ status: 'interrupted' });
          store.setState({ error: signal.aborted ? 'Response stopped. Check saved messages or retry this request.' : error instanceof Error ? error.message : 'The reply was interrupted. Retry this request.' });
        }
      } finally {
        abort = null; pending = null;
        if (service.isCurrent(owner)) store.setState({ busy: false });
      }
    })();
    return pending;
  }
  return { store,
    send: (text: string) => pending ?? start({ requestId: uuid(), text }),
    retry: () => { const run = store.getState().run; return run ? start({ requestId: run.requestId, text: run.text }) : Promise.resolve(); },
    recover: (input: SendInput) => start(input),
    stop: () => abort?.abort(),
  };
}
