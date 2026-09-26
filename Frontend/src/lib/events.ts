/**
 * App-wide signal that an unread badge count may have changed.
 *
 * The header badges live in `AppShell`, while the actions that clear them —
 * marking a notification or a conversation read — happen deep inside page
 * components. Rather than thread a context through the tree just to carry two
 * numbers, a page emits this event and the shell re-fetches on receipt. One
 * small, explicit contract instead of a poll: no interval, no extra requests
 * while nothing is happening.
 */
export const UNREAD_CHANGED_EVENT = "prepshare:unread-changed";

/** Tell the app shell its unread badges may be stale. */
export const emitUnreadChanged = (): void => {
  window.dispatchEvent(new Event(UNREAD_CHANGED_EVENT));
};

/**
 * Subscribe to {@link emitUnreadChanged}. Returns its own unsubscribe so it
 * can be returned straight from a `useEffect`.
 */
export const onUnreadChanged = (handler: () => void): (() => void) => {
  window.addEventListener(UNREAD_CHANGED_EVENT, handler);
  return () => window.removeEventListener(UNREAD_CHANGED_EVENT, handler);
};
