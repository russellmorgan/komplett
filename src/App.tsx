import { BrowserRouter, Navigate, NavLink, Route, Routes, useParams } from "react-router";
import { type AuthUser, useAuthUser } from "./data/auth";
import { useLists } from "./data/lists";
import { useReminders } from "./data/reminders";
import { useTasks } from "./data/tasks";
import { TimerProvider, useTimerContext } from "./data/timer";
import { formatMmSs, remainingMs } from "./domain/timer";
import { History, Partner } from "./screens";
import { Completed } from "./screens/Completed";
import { ListsNav } from "./screens/ListsNav";
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
  useReminders(useTasks(user.uid));

  const screens = [
    { path: "/completed", label: "Completed", element: <Completed user={user} /> },
    { path: "/timer", label: "Timer", element: <Timer user={user} /> },
    { path: "/history", label: "History", element: <History /> },
    { path: "/partner", label: "Partner", element: <Partner /> },
    { path: "/settings", label: "Settings", element: <Settings user={user} /> },
  ];
  return (
    <TimerProvider uid={user.uid}>
      <BrowserRouter>
        <div className="shell">
          <nav className="nav">
            <ListsNav user={user} />
            <TimerPill />
            {screens.map((screen) => (
              <NavLink key={screen.path} to={screen.path}>
                {screen.label}
              </NavLink>
            ))}
          </nav>
          <main>
            <Routes>
              <Route path="/" element={<Tasks user={user} />} />
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

// Countdown visible on every screen while focus or break is running.
function TimerPill() {
  const { state } = useTimerContext();
  if (state.phase !== "focus" && state.phase !== "break") return null;
  return (
    <span className="timer-pill">
      {state.pausedAt !== null ? "⏸ " : ""}
      {state.phase === "focus" ? "Focus" : "Break"} {formatMmSs(remainingMs(state, Date.now()))}
    </span>
  );
}

// key remounts Tasks per list so per-list UI state resets; a deleted list falls back to Inbox.
function ListRoute({ user }: { user: AuthUser }) {
  const { listId } = useParams();
  const lists = useLists(user.uid);
  if (lists.length > 0 && !lists.some((l) => l.id === listId)) return <Navigate to="/" replace />;
  return <Tasks key={listId} user={user} />;
}
