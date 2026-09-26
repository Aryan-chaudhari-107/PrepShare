/* Shared jsdom environment for component tests: RTL cleanup between tests
   plus the browser APIs framer-motion and the app chrome expect. */

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

if (typeof window.matchMedia !== "function") {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (typeof window.ResizeObserver !== "function") {
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver = ObserverStub;
}
if (typeof window.IntersectionObserver !== "function") {
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = ObserverStub;
}
if (typeof window.requestAnimationFrame !== "function") {
  window.requestAnimationFrame = ((callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 16) as unknown as number) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = ((handle: number) =>
    clearTimeout(handle)) as typeof window.cancelAnimationFrame;
}
