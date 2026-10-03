import type { ImageSource } from 'expo-image';

// Replace this list with backend data. Remote SVG URLs use logo: { uri: url }.
export type ChatModel = {
  id: string;
  name: string;
  logo: ImageSource | number;
};

export const localChatModels: readonly ChatModel[] = [
  { id: 'deepseek-r1', name: 'DeepSeek R1', logo: require('@/icons/deepseek.svg') },
  { id: 'openai', name: 'OpenAI', logo: require('@/icons/openai.svg') },
  { id: 'claude', name: 'Claude', logo: require('@/icons/claude.svg') },
  { id: 'qwen', name: 'Qwen', logo: require('@/icons/qwen.svg') },
];
