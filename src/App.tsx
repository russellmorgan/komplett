import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { type AuthUser, useAuthUser } from "./data/auth";
import { useLists } from "./data/lists";
import { useReminders } from "./data/reminders";
import { usePartnerDoneAlert, useSharedTaskSync } from "./data/shared";
import { useTasks } from "./data/tasks";
import { TimerProvider, useTimerContext } from "./data/timer";
import { useUserDoc } from "./data/user";
import { formatMmSs, remainingMs } from "./domain/timer";
import { Icon } from "./icons";
import { Completed } from "./screens/Completed";
import { History } from "./screens/History";
import { Lists } from "./screens/Lists";
import { Partner } from "./screens/Partner";
import { Settings } from "./screens/Settings";
import { SignIn } from "./screens/SignIn";
import { Tasks } from "./screens/Tasks";
import { Timer } from "./screens/Timer";

export function App() {
  const user = useAuthUser();
  if (user === undefined) return null;
  if (user === null) return <SignIn />;
  return <Shell user={user} />;
}

function Shell({ user }: { user: AuthUser }) {
  // Reminders fire on every screen, not just Tasks.
  const tasks = useTasks(user.uid);
  useReminders(tasks);
  useSharedTaskSync(user.uid, useUserDoc(user.uid), tasks);
  usePartnerDoneAlert(user.uid);

  const screens = [
    { path: "/timer", label: "Timer", element: <Timer user={user} /> },
    { path: "/lists", label: "Lists", element: <Lists user={user} /> },
    { path: "/completed", label: "Completed", element: <Completed user={user} /> },
    { path: "/history", label: "History", element: <History user={user} /> },
    { path: "/partner", label: "Partner", element: <Partner user={user} /> },
    { path: "/settings", label: "Settings", element: <Settings user={user} /> },
  ];
  // Completed is reached from the Tasks screen, not the nav.
  const links: { path: string; label: string }[] = screens.filter((s) => s.path !== "/completed");
  links.splice(1, 0, { path: "/", label: "Tasks" });
  return (
    <TimerProvider uid={user.uid}>
      <BrowserRouter>
        <div className="shell">
          <Header links={links} />
          <main>
            <Routes>
              <Route path="/" element={<Tasks user={user} />} />
              <Route path="/today" element={<Tasks user={user} today />} />
              <Route path="/all" element={<Tasks user={user} showAll />} />
              <Route path="/list/:listId" element={<ListRoute user={user} />} />
              {screens.map((screen) => (
                <Route key={screen.path} path={screen.path} element={screen.element} />
              ))}
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TimerProvider>
  );
}

// Inline nav on wide screens; a menu button with a dropdown below 64rem (CSS decides which shows).
function Header({ links }: { links: { path: string; label: string }[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // 1-6 jump to the nav items in order, unless the user is typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const link = links[Number(e.key) - 1];
      if (!link || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
      navigate(link.path);
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [links, navigate]);
  const nav = (className: string) => (
    <nav className={className}>
      {links.map((l, i) => (
        <NavLink key={l.path} to={l.path} end onClick={() => setMenuOpen(false)}>
          {l.label} <kbd>{i + 1}</kbd>
        </NavLink>
      ))}
    </nav>
  );
  return (
    <header className="header">
      <Link to="/timer" className="wordmark" onClick={() => setMenuOpen(false)}>
        Kom<span>plett</span>
      </Link>
      <div className="header-actions">
        {nav("nav")}
        {pathname !== "/timer" && <TimerPill />}
        <button
          type="button"
          className="menu-button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name="menu" size={18} />
        </button>
      </div>
      {menuOpen && nav("menu")}
    </header>
  );
}

// Countdown visible on every other screen while focus or break is running.
function TimerPill() {
  const { state } = useTimerContext();
  if (state.phase !== "focus" && state.phase !== "break") return null;
  const paused = state.pausedAt !== null;
  return (
    <Link to="/timer" className="timer-pill" aria-label="Back to timer">
      <span className={paused ? "pill-dot paused" : "pill-dot"} />
      {paused ? "Paused" : state.phase === "focus" ? "Focus" : "Break"}{" "}
      {formatMmSs(remainingMs(state, Date.now()))}
    </Link>
  );
}

// key remounts Tasks per list so per-list UI state resets; a deleted list falls back to Inbox.
function ListRoute({ user }: { user: AuthUser }) {
  const { listId } = useParams();
  const lists = useLists(user.uid);
  if (lists.length > 0 && !lists.some((l) => l.id === listId)) return <Navigate to="/" replace />;
  return <Tasks key={listId} user={user} />;
}
