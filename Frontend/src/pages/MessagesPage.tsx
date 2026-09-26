import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Lock,
  MessageSquare,
  MessageSquarePlus,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PageContainer } from "../components/layout/AppShell";
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Modal,
  Skeleton,
  Spinner,
  Textarea,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { chatApi, usersApi } from "../api";
import { ConversationOut, MessageOut, UserSearchItem } from "../types";
import { cn } from "../lib/cn";
import { emitUnreadChanged } from "../lib/events";
import { prefersReducedMotion } from "../lib/motion";
import { errorMessage, fullDate, relativeDate } from "../lib/format";
import { DURATION, EASE, Magnetic, SPRING, bubble } from "../motion";

const POLL_INTERVAL_MS = 3000;

/**
 * Master/detail breakpoint, mirrored from the `lg:` pane classes below so the
 * thread push knows when a selection actually swaps the screen.
 */
const useCompactPanes = (): boolean => {
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setCompact(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return compact;
};

/** How far a freshly opened thread slides in on phones (cf. `RouteStage`). */
const THREAD_PUSH = 28;

/** Empty "never seen" set — an identity for "no arrivals", not `null`. */
const NO_ARRIVALS: ReadonlySet<string> = new Set();

/**
 * "Today" renders as a clock time (14:05); older messages fall back to the
 * shared relative date ("Yesterday", "3d ago", "12 Mar 2025"). `fullDate`
 * backs it as the tooltip for the exact timestamp.
 */
const messageTimestamp = (iso: string): string => {
  const relative = relativeDate(iso);
  if (relative !== "Today") return relative;
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * Sent ⇄ Read, crossfaded inside a fixed 14px box so the row's timestamp
 * never shifts when the poll flips the state.
 */
const ReadReceipt: React.FC<{ read: boolean }> = ({ read }) => (
  <span className="relative inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
    <AnimatePresence initial={false}>
      <motion.span
        key={read ? "read" : "sent"}
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DURATION.fast, ease: EASE.standard }}
      >
        {read ? (
          <CheckCheck size={14} className="text-primary" aria-hidden="true" />
        ) : (
          <Check size={14} aria-hidden="true" />
        )}
      </motion.span>
    </AnimatePresence>
  </span>
);

/**
 * One bubble. Rows already on screen render instantly — only a message this
 * session has never seen (your fresh send, or a realtime arrival on the
 * silent poll) plays the `bubble` arrival, so the 3s refresh never replays
 * the thread or fights the scroll-to-bottom.
 */
const MessageRow: React.FC<{ msg: MessageOut; mine: boolean; arriving: boolean }> = ({
  msg,
  mine,
  arriving,
}) => (
  <motion.div
    variants={bubble(mine)}
    initial={arriving ? "hidden" : false}
    animate="show"
    className={cn(
      "flex max-w-[85%] flex-col gap-1 sm:max-w-[75%]",
      mine ? "self-end items-end" : "self-start items-start"
    )}
  >
    <div
      className={cn(
        "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
        mine
          ? "rounded-br-md bg-primary text-primary-fg shadow-md"
          : "rounded-bl-md border border-line bg-surface text-body shadow-xs"
      )}
    >
      <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
    </div>
    <span className="flex items-center gap-1 px-1 text-xs text-faint">
      <time dateTime={msg.created_at} title={fullDate(msg.created_at)}>
        {messageTimestamp(msg.created_at)}
      </time>
      {mine && (
        <>
          <ReadReceipt read={msg.is_read} />
          <span className="sr-only">{msg.is_read ? "Read" : "Sent"}</span>
        </>
      )}
    </span>
  </motion.div>
);

/** Unread pill: bounces in when a poll reports new messages, out when read. */
const UnreadBadge: React.FC<{ count: number }> = ({ count }) => (
  <AnimatePresence initial={false}>
    {count > 0 && (
      <motion.span
        key="unread"
        className="tabular absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-surface bg-primary px-1 text-xs font-semibold text-primary-fg"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1, transition: SPRING.bouncy }}
        exit={{ opacity: 0, scale: 0.6, transition: { duration: DURATION.fast, ease: EASE.exit } }}
      >
        {count > 9 ? "9+" : count}
      </motion.span>
    )}
  </AnimatePresence>
);

/**
 * A conversation row. The selected row keeps its flat primary rail; idle rows
 * get a line-strong left edge on hover and a small press dip, so picking a
 * thread feels tactile without turning the list into motion noise.
 */
const ConversationRow: React.FC<{
  conv: ConversationOut;
  selected: boolean;
  onSelect: (id: string) => void;
}> = ({ conv, selected, onSelect }) => {
  const p = conv.other_participant;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(conv.id)}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex w-full items-center gap-3 border-l-2 p-3.5 text-left transition duration-fast ease-swift active:scale-nudge",
          selected
            ? "border-primary bg-primary-soft"
            : "border-transparent hover:border-l-line-strong hover:bg-sunken/60"
        )}
      >
        <span className="relative shrink-0">
          <Avatar src={p.profile_photo_url} name={p.full_name || p.username} size="md" />
          <UnreadBadge count={conv.unread_count} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm",
                conv.unread_count > 0 ? "font-semibold text-heading" : "font-medium text-heading"
              )}
            >
              {p.full_name || `@${p.username}`}
            </span>
            {conv.last_message && (
              <span className="shrink-0 text-xs text-faint">
                {messageTimestamp(conv.last_message.created_at)}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted">
            {conv.last_message ? conv.last_message.message_text : "No messages yet"}
          </span>
        </span>
      </button>
    </li>
  );
};

/**
 * Send leans toward the cursor on fine pointers (so reaching for it closes a
 * small gap) and keeps the plain press behaviour otherwise; disabled sends
 * render bare so a dead control never moves.
 */
const SendButton: React.FC<{ disabled: boolean; loading: boolean }> = ({ disabled, loading }) => {
  const button = (
    <IconButton
      type="submit"
      label="Send message"
      tone="primary"
      className="h-10 w-10 active:scale-press"
      loading={loading}
      disabled={disabled}
    >
      <Send size={16} aria-hidden="true" />
    </IconButton>
  );
  return disabled ? button : <Magnetic strength={0.25}>{button}</Magnetic>;
};

/**
 * Direct messages: a conversation list and a thread pane.
 *
 * Below `lg` the two never share the screen — `activeConversationId` null
 * shows the list, a selection shows the thread with an explicit "Back to
 * conversations" control — while at `lg` and up both stay side by side.
 */
export const MessagesPage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { success, error } = useToast();

  const [conversations, setConversations] = useState<ConversationOut[]>([]);
  const [convsError, setConvsError] = useState<string | null>(null);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageOut[]>([]);
  const [msgsError, setMsgsError] = useState<string | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  // Message ids this session has already rendered — a silent poll animates
  // only the ones it has never seen, so a 3s refresh never replays history.
  const [enteringIds, setEnteringIds] = useState<ReadonlySet<string>>(NO_ARRIVALS);

  // New chat modal state
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchItem[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const messagesListRef = useRef<HTMLDivElement>(null);

  // Ids rendered at least once this session (including by a previous load of
  // this thread), so arrival animation is decided against history, not time.
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  // Phones swap list ⇄ thread — that swap is where the push-in plays.
  const compact = useCompactPanes();

  // Guards every setState that can resolve after a route change or a
  // conversation switch.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Latest selection, readable from in-flight callbacks without re-creating
  // them (used to drop stale responses).
  const activeIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeIdRef.current = selectedConvId;
  }, [selectedConvId]);

  // True once the list has either auto-selected or the user has taken
  // control — afterwards polling must never hijack the selection again
  // (e.g. yanking a phone user back into a thread after they pressed Back).
  const autoSelectDoneRef = useRef(false);

  // The list mirrored into a ref so `loadMessages` can read a conversation's
  // `unread_count` without re-creating on every 3s poll (a new callback would
  // re-fire the load effect and restart the thread).
  const conversationsRef = useRef<ConversationOut[]>([]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Threads already marked read this session, so opening one costs at most a
  // single mark-read request however often polling refreshes the list.
  const markedReadRef = useRef<Set<string>>(new Set());

  const scrollToBottom = useCallback((smooth = false) => {
    const el = messagesListRef.current;
    if (!el) return;
    // Scrolls the message container only — never the page.
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
    });
  }, []);

  const loadConversations = useCallback(
    async (silent = false) => {
      if (!isAuthenticated) return;
      if (!silent) {
        setLoadingConvs(true);
        setConvsError(null);
      }
      try {
        const res = await chatApi.listConversations();
        if (!mountedRef.current) return;
        const items = res.data.items || [];
        setConversations(items);
        setConvsError(null); // also recovers when a silent poll succeeds

        if (!autoSelectDoneRef.current && !activeIdRef.current && items.length > 0) {
          autoSelectDoneRef.current = true;
          // Desktop opens the first thread (previous behaviour); on phones
          // the list stays primary so the user chooses the thread.
          if (window.matchMedia("(min-width: 1024px)").matches) {
            setSelectedConvId(items[0].id);
          }
        }
      } catch (err: unknown) {
        if (!mountedRef.current) return;
        if (!silent) setConvsError(errorMessage(err, "Failed to load conversations."));
      } finally {
        if (mountedRef.current && !silent) setLoadingConvs(false);
      }
    },
    [isAuthenticated]
  );

  const loadMessages = useCallback(
    async (convId: string, silent = false) => {
      if (!silent) {
        setLoadingMsgs(true);
        setMsgsError(null);
      }
      try {
        const res = await chatApi.getMessages(convId, 1, 100);
        // Stale response: the user switched conversations (or left) while
        // this request was in flight.
        if (!mountedRef.current || activeIdRef.current !== convId) return;
        const items = res.data.items || [];
        if (silent) {
          // Realtime arrival: only ids never rendered before get the bubble
          // entrance; rows already on screen stay put (no replay, no scroll
          // fight). Marking them seen here also stops a follow-up non-silent
          // refresh from re-animating them.
          const fresh = items.filter((m) => !seenMessageIdsRef.current.has(m.id));
          setMessages(items);
          if (fresh.length > 0) {
            const freshIds = new Set(fresh.map((m) => m.id));
            fresh.forEach((m) => seenMessageIdsRef.current.add(m.id));
            setEnteringIds((prev) => new Set([...prev, ...freshIds]));
          }
        } else {
          // Opening/refreshing a thread: history renders instantly, arrivals
          // belong to the poll from here on.
          seenMessageIdsRef.current = new Set(items.map((m) => m.id));
          setEnteringIds(NO_ARRIVALS);
          setMessages(items);
        }
        setMsgsError(null); // also recovers when a silent poll succeeds
        if (!silent) window.setTimeout(() => scrollToBottom(), 80);

        // Opening a thread marks it read so the header badge can clear. Only
        // when it actually had unread messages, and only once per thread —
        // deliberately not awaited, so the spinner never waits on it.
        const conv = conversationsRef.current.find((c) => c.id === convId);
        if (conv && conv.unread_count > 0 && !markedReadRef.current.has(convId)) {
          markedReadRef.current.add(convId);
          chatApi
            .markRead(convId)
            .then(() => {
              if (mountedRef.current) emitUnreadChanged();
            })
            .catch(() => {
              markedReadRef.current.delete(convId); // retried on next open
            });
        }
      } catch (err: unknown) {
        if (!mountedRef.current || activeIdRef.current !== convId) return;
        if (!silent) setMsgsError(errorMessage(err, "Failed to load messages."));
      } finally {
        if (mountedRef.current && !silent && activeIdRef.current === convId) {
          setLoadingMsgs(false);
        }
      }
    },
    [scrollToBottom]
  );

  // Initial load — send unauthenticated visitors through the auth modal.
  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    void loadConversations();
  }, [isAuthenticated, loadConversations, openAuthModal]);

  // (Re)load the thread whenever the active conversation changes.
  useEffect(() => {
    setEnteringIds(NO_ARRIVALS);
    if (selectedConvId) {
      void loadMessages(selectedConvId);
    } else {
      setMessages([]);
      setLoadingMsgs(false);
      setMsgsError(null);
    }
  }, [selectedConvId, loadMessages]);

  // Realtime polling every 3s for the list and the active thread. The
  // interval is torn down on unmount AND whenever the conversation changes.
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = window.setInterval(() => {
      void loadConversations(true);
      if (selectedConvId) void loadMessages(selectedConvId, true);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, selectedConvId, loadConversations, loadMessages]);

  // Handle send message — pessimistic: the composer clears optimistically,
  // the server message is appended on success, and the text is restored on
  // failure (same behaviour as before).
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await chatApi.sendMessage(selectedConvId, text);
      if (!mountedRef.current || activeIdRef.current !== selectedConvId) return;
      seenMessageIdsRef.current.add(res.data.id);
      setMessages((prev) => [...prev, res.data]);
      // Only this fresh send plays the arrival — the next silent poll sees
      // the id and leaves the rest of the thread alone.
      setEnteringIds(new Set([res.data.id]));
      window.setTimeout(() => scrollToBottom(true), 50);
      void loadConversations(true);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      error(errorMessage(err, "Failed to send message."));
      setInputText(text);
    } finally {
      if (mountedRef.current) setSending(false);
    }
  };

  const onComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // isComposing keeps Enter from sending mid-IME-composition.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  // Debounced user search for the new-chat modal (300ms, unchanged).
  useEffect(() => {
    if (!userQuery.trim()) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await usersApi.searchUsers(userQuery.trim(), 10);
        if (cancelled) return;
        setSearchResults(res.data.items?.filter((u) => u.id !== user?.id) || []);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchingUsers(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [userQuery, user?.id]);

  const handleStartChatWithUser = async (targetUserId: string) => {
    try {
      const res = await chatApi.startConversation(targetUserId);
      autoSelectDoneRef.current = true;
      setIsNewChatOpen(false);
      setUserQuery("");
      setSearchResults([]);
      await loadConversations();
      setSelectedConvId(res.data.id);
      success("Conversation ready.", "Chat Started");
    } catch (err: unknown) {
      error(errorMessage(err, "Failed to start conversation."));
    }
  };

  const selectConversation = (id: string) => {
    autoSelectDoneRef.current = true;
    setSelectedConvId(id);
  };

  const openNewChat = () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    setIsNewChatOpen(true);
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId) ?? null;
  const filteredConvs = conversations.filter((c) =>
    (c.other_participant.full_name || c.other_participant.username)
      .toLowerCase()
      .includes(searchFilter.toLowerCase())
  );

  return (
    <>
      <PageContainer width="shell">
        <div className="flex h-[calc(100svh_-_var(--navbar-height)_-_13rem)] min-h-[460px] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xs lg:flex-row">
          {/* Conversation list — the only pane visible on mobile until a
              thread is opened. */}
          <aside
            aria-label="Conversations"
            className={cn(
              "w-full shrink-0 flex-col border-b border-line bg-raised lg:flex lg:w-80 lg:border-b-0 lg:border-r xl:w-96",
              selectedConv ? "hidden" : "flex"
            )}
          >
            {/* Header / search */}
            <div className="flex flex-col gap-3 border-b border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <MessageSquare size={17} className="text-primary" aria-hidden="true" />
                  <span>Messages</span>
                </h1>
                <Button size="sm" icon={<MessageSquarePlus size={15} aria-hidden="true" />} onClick={openNewChat}>
                  New chat
                </Button>
              </div>

              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                  aria-hidden="true"
                />
                <label htmlFor="conv-filter" className="sr-only">
                  Filter conversations
                </label>
                <Input
                  id="conv-filter"
                  type="text"
                  autoComplete="off"
                  className="pl-9"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter conversations…"
                />
              </div>
            </div>

            {/* Conversation list scroll area */}
            <div className="flex-1 overflow-y-auto scrollbar-slim">
              {/* Guests land here behind the auto-opened sign-in modal —
                  after dismissing it they must not see loading skeletons
                  that can never resolve (the fetch is auth-guarded). */}
              {!isAuthenticated ? (
                <EmptyState
                  className="m-4"
                  art="chat"
                  title="Sign in to see your conversations"
                  description="Your direct messages are private to your account."
                  action={
                    <Button
                      size="sm"
                      icon={<Lock size={15} aria-hidden="true" />}
                      onClick={() => openAuthModal("login")}
                    >
                      Sign in
                    </Button>
                  }
                />
              ) : loadingConvs ? (
                <div role="status" className="flex flex-col gap-4 p-4">
                  <span className="sr-only">Loading conversations…</span>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : convsError ? (
                <ErrorState
                  className="m-4"
                  title="Couldn't load conversations"
                  description={convsError}
                  onRetry={() => void loadConversations()}
                />
              ) : filteredConvs.length > 0 ? (
                <ul className="divide-y divide-line">
                  {filteredConvs.map((conv) => (
                    <ConversationRow
                      key={conv.id}
                      conv={conv}
                      selected={conv.id === selectedConvId}
                      onSelect={selectConversation}
                    />
                  ))}
                </ul>
              ) : conversations.length > 0 ? (
                <EmptyState
                  className="m-4"
                  icon={<Search size={24} aria-hidden="true" />}
                  title="No matches"
                  description={`No conversations match “${searchFilter}”.`}
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setSearchFilter("")}>
                      Clear filter
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  className="m-4"
                  art="chat"
                  title="No conversations yet"
                  description="Start a direct chat with a peer or candidate to exchange interview insights."
                  action={
                    <Button size="sm" icon={<MessageSquarePlus size={15} aria-hidden="true" />} onClick={openNewChat}>
                      Start a conversation
                    </Button>
                  }
                />
              )}
            </div>
          </aside>

          {/* Thread pane — hidden on mobile until a conversation is open;
              shows a placeholder on desktop when nothing is selected. */}
          <section
            className={cn(
              "min-w-0 flex-1 flex-col bg-surface",
              selectedConv ? "flex" : "hidden lg:flex"
            )}
          >
            {selectedConv ? (
              <motion.div
                key={selectedConv.id}
                className="flex min-h-0 flex-1 flex-col"
                initial={compact ? { opacity: 0, x: THREAD_PUSH } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: DURATION.base, ease: EASE.enter }}
              >
                <header className="flex items-center justify-between gap-3 border-b border-line bg-raised px-3 py-2.5 sm:px-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-1 lg:hidden"
                      icon={<ArrowLeft size={16} aria-hidden="true" />}
                      aria-label="Back to conversations"
                      onClick={() => setSelectedConvId(null)}
                    >
                      Back
                    </Button>
                    <Avatar
                      src={selectedConv.other_participant.profile_photo_url}
                      name={selectedConv.other_participant.full_name || selectedConv.other_participant.username}
                      size="md"
                    />
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">
                        {selectedConv.other_participant.full_name ||
                          selectedConv.other_participant.username}
                      </h2>
                      <p className="truncate text-sm text-muted">
                        @{selectedConv.other_participant.username}
                      </p>
                    </div>
                  </div>

                  <IconButton
                    label="Refresh messages"
                    onClick={() => void loadMessages(selectedConv.id)}
                  >
                    <RefreshCw size={16} aria-hidden="true" />
                  </IconButton>
                </header>

                {/* Message scroll area */}
                <div
                  ref={messagesListRef}
                  className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 scrollbar-slim sm:p-5"
                >
                  {loadingMsgs ? (
                    <div className="my-auto flex justify-center py-8">
                      <Spinner size={20} label="Loading messages…" />
                    </div>
                  ) : msgsError ? (
                    <ErrorState
                      className="my-auto w-full"
                      title="Couldn't load messages"
                      description={msgsError}
                      onRetry={() => void loadMessages(selectedConv.id)}
                    />
                  ) : messages.length > 0 ? (
                    messages.map((msg) => (
                      <MessageRow
                        key={msg.id}
                        msg={msg}
                        mine={msg.sender_id === user?.id}
                        arriving={enteringIds.has(msg.id)}
                      />
                    ))
                  ) : (
                    <EmptyState
                      className="my-auto w-full"
                      art="chat"
                      title="No messages yet"
                      description="Say hello to start the conversation."
                    />
                  )}
                </div>

                {/* Composer */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end gap-2 border-t border-line bg-raised p-3"
                >
                  <div className="min-w-0 flex-1">
                    <label htmlFor="composer" className="sr-only">
                      Write a message
                    </label>
                    <Textarea
                      id="composer"
                      rows={2}
                      autoComplete="off"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={onComposerKeyDown}
                      placeholder="Write a message…"
                      className="min-h-[44px] resize-none"
                    />
                    <p className="mt-1 hidden text-xs text-faint sm:block">
                      Enter to send · Shift + Enter for a new line
                    </p>
                  </div>
                  <SendButton disabled={!inputText.trim() || sending} loading={sending} />
                </form>
              </motion.div>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState
                  className="w-full max-w-md"
                  art="chat"
                  title="Select a conversation"
                  description="Choose an existing conversation from the list, or start a new direct chat with a peer."
                  action={
                    <Button
                      size="sm"
                      icon={<MessageSquarePlus size={15} aria-hidden="true" />}
                      onClick={openNewChat}
                    >
                      New chat
                    </Button>
                  }
                />
              </div>
            )}
          </section>
        </div>
      </PageContainer>

      {/* New chat modal */}
      <Modal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        title="Start a new conversation"
        subtitle="Search for a registered member by username or name."
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
              aria-hidden="true"
            />
            <label htmlFor="new-chat-search" className="sr-only">
              Search members
            </label>
            <Input
              id="new-chat-search"
              type="text"
              autoComplete="off"
              className="pl-9"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search by username or name…"
            />
          </div>

          <div className="max-h-64 overflow-y-auto scrollbar-slim">
            {searchingUsers ? (
              <p role="status" className="p-4 text-center text-sm text-muted">
                Searching registered users…
              </p>
            ) : searchResults.length > 0 ? (
              <ul className="divide-y divide-line">
                {searchResults.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => void handleStartChatWithUser(u.id)}
                      className="flex w-full items-center gap-3 p-3 text-left transition-colors duration-fast ease-swift hover:bg-sunken/60 active:scale-nudge"
                    >
                      <Avatar src={u.profile_photo_url} name={u.full_name || u.username} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-heading">
                          {u.full_name || u.username}
                        </span>
                        <span className="block truncate text-sm text-muted">@{u.username}</span>
                      </span>
                      <span className="shrink-0 text-sm font-medium text-primary">Message</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : userQuery.trim() ? (
              <p className="p-4 text-center text-sm text-muted">
                No users found matching “{userQuery}”.
              </p>
            ) : (
              <p className="p-4 text-center text-sm text-muted">
                Type a username to find candidates and colleagues.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
