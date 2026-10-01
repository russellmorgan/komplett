// The design's icon set, inline SVG. Color comes from currentColor, size from the `size` prop.
const PATHS = {
  play: <polygon points="7 4 20 12 7 20 7 4" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="5" y="4" width="5" height="16" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="5" height="16" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  stop: <rect width="16" height="16" x="4" y="4" rx="2" fill="currentColor" stroke="none" />,
  plus: <path d="M5 12h14M12 5v14" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="M20 6 9 17l-5-5" />,
  star: (
    <polygon points="12 2 15.1 8.6 22 9.3 16.8 14 18.2 21 12 17.5 5.8 21 7.2 14 2 9.3 8.9 8.6 12 2" />
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  edit: <path d="M21.2 6.8a2.8 2.8 0 0 0-4-4L4 16v4h4Z" />,
  trash: (
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  ),
};

export function Icon({ name, size = 14 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
