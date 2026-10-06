import { ApiError } from '../../lib/api/client';
import { chatEventSchema, type ChatEvent } from './schema';

/** XHR progress supplies cumulative text, sometimes repeating the final chunk. */
export function createChatStream(requestId: string, emit: (event: ChatEvent) => void) {
  let offset = 0, buffer = '', assistantId: string | null = null, terminal: ChatEvent | null = null;
  const invalid = () => new ApiError('The reply was interrupted. Check saved messages or retry the same request.', 0, 'INVALID_CHAT_STREAM');
  function line(raw: string) {
    if (!raw.trim()) return;
    if (terminal) throw invalid();
    let event: ChatEvent;
    try { event = chatEventSchema.parse(JSON.parse(raw)); } catch { throw invalid(); }
    if (event.type === 'message.started') {
      if (assistantId || event.requestId !== requestId) throw invalid();
      assistantId = event.messageId;
    } else if (!assistantId) throw invalid();
    if (event.type === 'message.completed' || event.type === 'message.failed' || event.type === 'message.cancelled') {
      if (event.messageId !== assistantId) throw invalid();
      terminal = event;
    }
    emit(event);
  }
  return {
    push(text: string) {
      if (text.length < offset || text.length > 2 * 1024 * 1024) throw invalid();
      buffer += text.slice(offset); offset = text.length;
      let end: number;
      while ((end = buffer.indexOf('\n')) !== -1) { const raw = buffer.slice(0, end); buffer = buffer.slice(end + 1); line(raw); }
    },
    finish() { line(buffer); buffer = ''; if (!terminal) throw invalid(); return terminal; },
  };
}
