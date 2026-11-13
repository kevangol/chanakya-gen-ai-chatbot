"use client";

/**
 * Top-level chat screen. Composes the sidebar, header, transcript and
 * composer, and wires them to the state hooks.
 *
 * @module components/chat/Chat
 */

import { useState } from "react";
import { Sidebar } from "../sidebar/Sidebar";
import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { Welcome } from "./Welcome";
import { useChat } from "@/app/hooks/useChat";
import { useConversations } from "@/app/hooks/useConversations";
import { useSidebar } from "@/app/hooks/useSidebar";
import { APP_NAME } from "@/app/lib/constants";

/**
 * The whole chat application.
 *
 * State lives in hooks; components below are presentational:
 * - {@link useConversations} — threads + `localStorage` persistence
 * - {@link useChat} — send / stream / stop / retry
 * - {@link useSidebar} — sidebar visibility
 * - local `input` — composer text, shared by the welcome and docked composers
 *
 * Shows {@link Welcome} when the open conversation is empty (or none is
 * open), otherwise {@link MessageList} with a docked {@link Composer}.
 *
 * @example
 * // app/page.tsx
 * export default function Home() { return <Chat />; }
 */
export function Chat() {
  const store = useConversations();
  const chat = useChat(store);
  const sidebar = useSidebar();
  const [input, setInput] = useState("");

  const messages = store.active?.messages ?? [];

  /** Send `text` and clear the composer (no-op while a reply is streaming). */
  const handleSend = (text: string) => {
    if (chat.isStreaming || !text.trim()) return;
    chat.send(text);
    setInput("");
  };

  /** Abort any running reply and return to the welcome screen. */
  const handleNewChat = () => {
    chat.stop();
    store.select(null);
    setInput("");
    sidebar.closeOnMobile();
  };

  /** Open a conversation from the sidebar. */
  const handleSelect = (id: string) => {
    if (chat.isStreaming) chat.stop();
    store.select(id);
    sidebar.closeOnMobile();
  };

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        isOpen={sidebar.isOpen}
        onClose={sidebar.close}
        conversations={store.conversations}
        activeId={store.activeId}
        onSelect={handleSelect}
        onNewChat={handleNewChat}
        onDelete={store.remove}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <ChatHeader
          title={store.active?.title}
          sidebarHidden={!sidebar.isOpen}
          onOpenSidebar={sidebar.open}
          onNewChat={handleNewChat}
        />

        {messages.length === 0 ? (
          <Welcome input={input} onInputChange={setInput} onSend={handleSend} isStreaming={chat.isStreaming} />
        ) : (
          <>
            <MessageList messages={messages} isStreaming={chat.isStreaming} onRetry={chat.retry} />
            <div className="mx-auto w-full max-w-3xl px-4 pb-4">
              <Composer
                value={input}
                onChange={setInput}
                onSend={() => handleSend(input)}
                onStop={chat.stop}
                isStreaming={chat.isStreaming}
              />
              <p className="mt-2 text-center text-xs text-muted">
                {APP_NAME} can make mistakes. Check the cited sources.
              </p>
            </div>
          </>
        )}
      </main>

    </div>
  );
}
