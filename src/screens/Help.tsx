import changelog from "../changelog.json";

export const VERSION = changelog[0]?.version ?? "0.1";

const SECTIONS: [string, string[]][] = [
  [
    "Tasks",
    [
      "Type in the box at the top and press Enter to add a task to the list you're looking at.",
      "Tick the box to complete a task. Repeating tasks move to their next date instead.",
      "Tap a task to open its details: due date, reminder, note, repeat schedule and which list it's in.",
      "Star a task to pin it to the top. Drag the grip to reorder.",
      "Press the play button on a task to start a focus timer on it.",
      "Today collects tasks due today, and you can add others by hand. All completed tasks live on the Completed page, linked from the bottom of each list.",
    ],
  ],
  [
    "Timer",
    [
      "Tap the clock to start or pause a focus period, and stop to end it early. When focus ends, a break starts.",
      "After a focus, add a note about what you did and save it to History, or discard it. Sessions under a minute aren't saved.",
      "While the timer runs, a countdown shows in the header on every other screen. Tap it to get back.",
      "Up next, Today and your partner's task sit beside the timer. Hide any of them with Show.",
      "During a break you can play a quick brick-breaker game.",
    ],
  ],
  [
    "Lists",
    [
      "Create lists to group tasks, give each a color, and put lists into folders.",
      "Your Inbox is always there and can't be deleted.",
    ],
  ],
  [
    "History",
    [
      "See every focus session grouped by week, with totals for sessions, focus time and tasks completed.",
    ],
  ],
  [
    "Partner",
    [
      "Choose a partner to keep each other on track. You both need to pick each other to see each other's task.",
      "Share one task with your partner. When they finish theirs, you get an alert and can react with an emoji.",
    ],
  ],
  [
    "Settings",
    [
      "Set focus and break lengths, the finishing chime, and which screen opens when you start the app.",
      "Choose light or dark mode, a theme, and rounded corners for this device.",
    ],
  ],
  ["Keyboard", ["Press 1 to 6 to jump between screens (shown next to each one in the menu)."]],
];

export function Help() {
  return (
    <div className="stack">
      <h1>Help</h1>
      {SECTIONS.map(([title, tips]) => (
        <section className="card" key={title}>
          <h2>{title}</h2>
          <ul className="prose-list">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function WhatsNew() {
  return (
    <div className="stack">
      <h1>What's new</h1>
      {changelog.map((release) => (
        <section className="card" key={release.version}>
          <h2>
            {release.version} <span className="muted">{release.date}</span>
          </h2>
          <ul className="prose-list">
            {release.changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
