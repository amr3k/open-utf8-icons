/**
 * Global toast notifications for copy feedback (Phase 3 of #1).
 *
 * A small runes-based manager: any component can call `toasts.show(...)` and
 * the `<Toaster />` mounted once in the root layout renders the stack.
 * Toasts auto-dismiss after a short duration and the stack is capped so
 * rapid-fire copies don't flood the screen.
 */

export interface ToastItem {
  /** Unique id used for keyed rendering and dismissal. */
  id: number;
  /** Full visible text, e.g. `"✓ Copied ★"`. */
  text: string;
}

const MAX_TOASTS = 3;
const DEFAULT_DURATION_MS = 2000;

class ToastManager {
  items = $state<ToastItem[]>([]);

  #nextId = 1;
  #timers = new Map<number, ReturnType<typeof setTimeout>>();

  /** Show a toast; returns its id so callers can dismiss it early. */
  show(text: string, durationMs: number = DEFAULT_DURATION_MS): number {
    const id = this.#nextId++;
    this.items.push({ id, text });

    // Cap the stack by dropping the oldest toast.
    while (this.items.length > MAX_TOASTS) {
      const oldest = this.items[0];
      if (oldest === undefined) break;
      this.dismiss(oldest.id);
    }

    const timer = setTimeout(() => this.dismiss(id), durationMs);
    this.#timers.set(id, timer);
    return id;
  }

  /** Remove a toast immediately (also clears its pending timer). */
  dismiss(id: number) {
    const timer = this.#timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.#timers.delete(id);
    }
    this.items = this.items.filter((item) => item.id !== id);
  }
}

/** Singleton used by pages/components; rendered by `<Toaster />`. */
export const toasts = new ToastManager();
