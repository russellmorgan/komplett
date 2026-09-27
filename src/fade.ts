// Fade elements out over 300ms, then run `then` (which hides/removes them). Elements stay at
// opacity 0 and stop taking clicks until React removes them, so a double-click can't fire twice.
export function fadeOut(els: Element | Iterable<Element> | null | undefined, then: () => void) {
  const list = els instanceof Element ? [els] : els ? [...els] : [];
  if (list.length === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return then();
  Promise.all(
    list.map((el) => {
      (el as HTMLElement).style.pointerEvents = "none";
      return el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" })
        .finished;
    }),
  ).then(then);
}
