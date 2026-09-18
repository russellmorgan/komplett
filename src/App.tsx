import { BrowserRouter, Navigate, NavLink, Route, Routes, useParams } from "react-router";
import { type AuthUser, useAuthUser } from "./data/auth";
import { useLists } from "./data/lists";
import { useReminders } from "./data/reminders";
import { useTasks } from "./data/tasks";
import { History, Partner, Settings, Timer } from "./screens";
import { Completed } from "./screens/Completed";
import { ListsNav } from "./screens/ListsNav";
import { SignIn } from "./screens/SignIn";
import { Tasks } from "./screens/Tasks";

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
    { path: "/timer", label: "Timer", element: <Timer /> },
    { path: "/history", label: "History", element: <History /> },
    { path: "/partner", label: "Partner", element: <Partner /> },
    { path: "/settings", label: "Settings", element: <Settings user={user} /> },
  ];
  return (
    <BrowserRouter>
      <div className="shell">
        <nav className="nav">
          <ListsNav user={user} />
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
  );
}

// key remounts Tasks per list so per-list UI state resets; a deleted list falls back to Inbox.
function ListRoute({ user }: { user: AuthUser }) {
  const { listId } = useParams();
  const lists = useLists(user.uid);
  if (lists.length > 0 && !lists.some((l) => l.id === listId)) return <Navigate to="/" replace />;
  return <Tasks key={listId} user={user} />;
}
