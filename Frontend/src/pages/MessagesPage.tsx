import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { chatApi, usersApi } from "../api";
import { ConversationOut, MessageOut, UserSearchItem } from "../types";
import { Modal } from "../components/common/Modal";

export const MessagesPage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { success, error } = useToast();

  const [conversations, setConversations] = useState<ConversationOut[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageOut[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  // New Chat Modal state
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchItem[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;
    if (!silent) setLoadingConvs(true);
    try {
      const res = await chatApi.listConversations();
      const items = res.data.items || [];
      setConversations(items);
      if (items.length > 0 && !selectedConvId) {
        setSelectedConvId(items[0].id);
      }
    } catch (err: any) {
      if (!silent) error(err.response?.data?.detail || "Failed to load conversations.");
    } finally {
      if (!silent) setLoadingConvs(false);
    }
  }, [isAuthenticated, selectedConvId, error]);

  const loadMessages = useCallback(async (convId: string, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    try {
      const res = await chatApi.getMessages(convId, 1, 100);
      setMessages(res.data.items || []);
      if (!silent) setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      if (!silent) error(err.response?.data?.detail || "Failed to load messages.");
    } finally {
      if (!silent) setLoadingMsgs(false);
    }
  }, [error]);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    loadConversations();
  }, [isAuthenticated, loadConversations, openAuthModal]);

  // When active conversation changes
  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
    } else {
      setMessages([]);
    }
  }, [selectedConvId, loadMessages]);

  // Realtime Polling (every 3 seconds for active conversation & list)
  useEffect(() => {
    if (!isAuthenticated) return;
    pollTimerRef.current = setInterval(() => {
      loadConversations(true);
      if (selectedConvId) {
        loadMessages(selectedConvId, true);
      }
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isAuthenticated, selectedConvId, loadConversations, loadMessages]);

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await chatApi.sendMessage(selectedConvId, text);
      setMessages((prev) => [...prev, res.data]);
      setTimeout(scrollToBottom, 50);
      loadConversations(true);
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to send message.");
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  // Search users for new conversation
  useEffect(() => {
    if (!userQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await usersApi.searchUsers(userQuery.trim(), 10);
        setSearchResults(res.data.items?.filter((u) => u.id !== user?.id) || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userQuery, user?.id]);

  // Start new conversation
  const handleStartChatWithUser = async (targetUserId: string) => {
    try {
      const res = await chatApi.startConversation(targetUserId);
      setIsNewChatOpen(false);
      setUserQuery("");
      setSearchResults([]);
      await loadConversations();
      setSelectedConvId(res.data.id);
      success("Conversation ready.", "Chat Started");
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to start conversation.");
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const filteredConvs = conversations.filter((c) =>
    (c.other_participant.full_name || c.other_participant.username)
      .toLowerCase()
      .includes(searchFilter.toLowerCase())
  );

  return (
    <AppShell>
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full flex flex-col flex-1 h-[calc(100vh-5rem)]">
        {/* Messages Card Container (Split Panel) */}
        <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm flex flex-1 overflow-hidden">
          {/* Left Panel: Conversation List (35%) */}
          <aside className="w-full md:w-80 lg:w-96 border-r border-border-subtle flex flex-col bg-surface-container-low/50">
            {/* Header / Search */}
            <div className="p-4 border-b border-border-subtle flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h1 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">forum</span>
                  <span>Messages</span>
                </h1>
                <button
                  type="button"
                  onClick={() => setIsNewChatOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">edit_square</span>
                  <span>New Chat</span>
                </button>
              </div>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                  search
                </span>
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter conversations..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {/* Conversation List Scroll Area */}
            <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/50">
              {loadingConvs ? (
                <div className="p-4 flex flex-col gap-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-3 animate-pulse p-2">
                      <div className="w-10 h-10 rounded-full bg-surface-container"></div>
                      <div className="flex-1 space-y-1.5">
                        <div className="w-24 h-3 bg-surface-container rounded"></div>
                        <div className="w-36 h-2.5 bg-surface-container rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConvs.length > 0 ? (
                filteredConvs.map((conv) => {
                  const isSelected = conv.id === selectedConvId;
                  const p = conv.other_participant;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${
                        isSelected
                          ? "bg-primary-container/10 border-l-4 border-primary"
                          : "hover:bg-surface-container/60"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-surface-container flex items-center justify-center font-bold text-primary text-sm border border-border-subtle">
                          {p.profile_photo_url ? (
                            <img src={p.profile_photo_url} alt={p.username} className="w-full h-full object-cover" />
                          ) : (
                            <span>{p.username.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="text-xs font-bold text-on-surface truncate">
                            {p.full_name || `@${p.username}`}
                          </h3>
                          {conv.last_message && (
                            <span className="text-[10px] text-outline">
                              {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate">
                          {conv.last_message ? conv.last_message.message_text : "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl text-outline">chat_bubble_outline</span>
                  <p className="text-xs">No active conversations found.</p>
                  <button
                    type="button"
                    onClick={() => setIsNewChatOpen(true)}
                    className="text-xs text-primary font-semibold hover:underline mt-1"
                  >
                    Start a new conversation
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Right Panel: Active Chat Thread (65%) */}
          <section className="flex-1 flex flex-col bg-surface">
            {selectedConv ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-elevated">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container flex items-center justify-center font-bold text-primary text-sm border border-border-subtle">
                      {selectedConv.other_participant.profile_photo_url ? (
                        <img
                          src={selectedConv.other_participant.profile_photo_url}
                          alt={selectedConv.other_participant.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{selectedConv.other_participant.username.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-on-surface">
                        {selectedConv.other_participant.full_name || selectedConv.other_participant.username}
                      </h2>
                      <p className="text-[11px] text-on-surface-variant">
                        @{selectedConv.other_participant.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadMessages(selectedConv.id)}
                      className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container transition-all"
                      title="Refresh messages"
                    >
                      <span className="material-symbols-outlined text-base">refresh</span>
                    </button>
                  </div>
                </div>

                {/* Messages Scroll Area */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-[#F8FAFC]/50">
                  {loadingMsgs ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[75%] ${
                            isMe ? "self-end items-end" : "self-start items-start"
                          }`}
                        >
                          <div
                            className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                              isMe
                                ? "bg-primary text-white rounded-br-none"
                                : "bg-surface-elevated text-on-surface border border-border-subtle rounded-bl-none"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.message_text}</p>
                          </div>
                          <span className="text-[10px] text-outline mt-1 px-1 flex items-center gap-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {isMe && (
                              <span className="material-symbols-outlined text-xs">
                                {msg.is_read ? "done_all" : "done"}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant gap-2">
                      <span className="material-symbols-outlined text-4xl text-outline">mark_chat_unread</span>
                      <p className="text-xs">No messages yet. Send a greeting to begin!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Composer */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-border-subtle bg-surface-elevated flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 px-4 py-3 bg-surface border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="px-5 py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <span>Send</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-on-surface-variant gap-3">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">chat</span>
                </div>
                <h3 className="text-sm font-bold text-on-surface">No Conversation Selected</h3>
                <p className="text-xs max-w-sm">
                  Select an existing conversation from the list or start a new direct chat with peers and candidates.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewChatOpen(true)}
                  className="mt-2 px-4 py-2 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
                >
                  Start New Chat
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* New Chat Modal */}
      <Modal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} title="Start New Conversation">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search by username or name..."
              className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-border-subtle flex flex-col">
            {searchingUsers ? (
              <div className="p-4 text-center text-xs text-on-surface-variant">Searching registered users...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleStartChatWithUser(u.id)}
                  className="p-3 text-left flex items-center gap-3 hover:bg-surface-container transition-colors rounded-xl"
                >
                  <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary text-xs border border-border-subtle shrink-0">
                    {u.profile_photo_url ? (
                      <img src={u.profile_photo_url} alt={u.username} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span>{u.username.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs font-bold text-on-surface truncate">{u.full_name || u.username}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">@{u.username}</p>
                  </div>
                  <span className="text-xs text-primary font-semibold">Message</span>
                </button>
              ))
            ) : userQuery.trim() ? (
              <div className="p-4 text-center text-xs text-on-surface-variant italic">No users found matching "{userQuery}".</div>
            ) : (
              <div className="p-4 text-center text-xs text-on-surface-variant">Type a username to find candidates and colleagues.</div>
            )}
          </div>
        </div>
      </Modal>
    </AppShell>
  );
};
