import { type PointerEvent, useState } from "react";

// Drag-to-reorder with pointer events (mouse and touch), plus ArrowUp/ArrowDown on the focused
// handle so it works without a pointer. Rows carry data-reorder={index}; only rows that share the
// dragged row's parent count, so nested groups (lists inside folders) reorder independently.
export function useReorder(count: number, onMove: (from: number, to: number) => void) {
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);

  function start(from: number, e: PointerEvent<HTMLElement>) {
    e.preventDefault();
    const handle = e.currentTarget;
    const self = handle.closest<HTMLElement>("[data-reorder]");
    const group = self?.parentElement;
    const startY = e.clientY;
    handle.setPointerCapture(e.pointerId);
    let over = from;
    setDrag({ from, over });
    const move = (ev: globalThis.PointerEvent) => {
      // The dragged row follows the pointer; it's pointer-events: none (CSS), so hit-testing sees the row beneath.
      if (self) self.style.translate = `0 ${ev.clientY - startY}px`;
      const row = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-reorder]");
      if (!row || row.parentElement !== group) return;
      over = Number(row.getAttribute("data-reorder"));
      setDrag({ from, over });
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      if (self) {
        // The row is already in its new slot, so snap the pointer offset away: the global `all`
        // transition would slide it back from there. Keep only the opacity fade.
        self.style.transition = "opacity 300ms ease-in-out";
        self.style.translate = "";
        setTimeout(() => {
          self.style.transition = "";
        }, 300);
      }
      setDrag(null);
      if (over !== from) onMove(from, over);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  }

  return {
    // Spread onto the row element.
    row: (index: number) => ({
      "data-reorder": index,
      "data-drag":
        drag === null
          ? undefined
          : drag.from === index
            ? "self"
            : drag.over === index
              ? drag.from < index
                ? "after"
                : "before"
              : undefined,
    }),
    // Spread onto the grip <button>.
    handle: (index: number, label: string) => ({
      type: "button" as const,
      className: "grip",
      title: "Drag to reorder",
      "aria-label": `Reorder ${label} (arrow keys move it)`,
      onPointerDown: (e: PointerEvent<HTMLElement>) => start(index, e),
      onKeyDown: (e: { key: string; preventDefault: () => void }) => {
        const to = e.key === "ArrowUp" ? index - 1 : e.key === "ArrowDown" ? index + 1 : null;
        if (to === null) return;
        e.preventDefault();
        if (to >= 0 && to < count) onMove(index, to);
      },
    }),
  };
}

export function Grip() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="5" r="1.6" />
      <circle cx="15" cy="5" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="19" r="1.6" />
      <circle cx="15" cy="19" r="1.6" />
    </svg>
  );
}
