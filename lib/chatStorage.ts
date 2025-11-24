'use client';

export type StoredRole = 'user' | 'assistant';

export interface StoredMessage {
  id: string;
  content: string;
  role: StoredRole;
  createdAt: string;
}

export interface StoredChat {
  id: string;
  title: string;
  mode: string | null;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  messages: StoredMessage[];
}

const STORAGE_KEY = 'cortexChats';

const isBrowser = typeof window !== 'undefined';

const readChats = (): StoredChat[] => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredChat[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((chat) => ({
      ...chat,
      mode: chat.mode ?? null,
      isFavorite: chat.isFavorite ?? false,
      messages: Array.isArray(chat.messages) ? chat.messages : [],
    }));
  } catch {
    return [];
  }
};

const writeChats = (chats: StoredChat[]) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {
    // ignore
  }
};

const sortChats = (chats: StoredChat[]) =>
  [...chats].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime()
  );

const normalizeMessages = (messages: StoredMessage[]) => {
  const map = new Map<string, StoredMessage>();
  messages.forEach((message) => {
    map.set(message.id, {
      ...message,
      createdAt: new Date(message.createdAt).toISOString(),
    });
  });
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

const normalizeChat = (chat: StoredChat): StoredChat => ({
  ...chat,
  mode: chat.mode ?? null,
  createdAt: new Date(chat.createdAt).toISOString(),
  updatedAt: new Date(chat.updatedAt || chat.createdAt).toISOString(),
  isFavorite: Boolean(chat.isFavorite),
  messages: normalizeMessages(chat.messages || []),
});

export const ChatStorage = {
  getChats(): StoredChat[] {
    return sortChats(readChats());
  },

  getChat(id: string): StoredChat | undefined {
    return readChats().find((chat) => chat.id === id);
  },

  saveChat(chat: StoredChat) {
    const normalized = normalizeChat(chat);
    const chats = readChats();
    const index = chats.findIndex((c) => c.id === chat.id);
    if (index >= 0) {
      chats[index] = normalized;
    } else {
      chats.unshift(normalized);
    }
    writeChats(sortChats(chats));
  },

  appendMessage(chatId: string, message: StoredMessage) {
    const chats = readChats();
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;
    chat.messages = normalizeMessages([...chat.messages, message]);
    chat.updatedAt = new Date(message.createdAt).toISOString();
    writeChats(sortChats(chats));
  },

  updateChat(chatId: string, data: Partial<Omit<StoredChat, 'id'>>) {
    const chats = readChats();
    const index = chats.findIndex((c) => c.id === chatId);
    if (index === -1) return;
    
    const chat = chats[index];
    chats[index] = normalizeChat({
      ...chat,
      ...data,
      id: chat.id,
      messages: data.messages ?? chat.messages,
    });
    writeChats(sortChats(chats));
  },

  deleteChat(chatId: string) {
    const chats = readChats().filter((chat) => chat.id !== chatId);
    writeChats(chats);
  },
};

