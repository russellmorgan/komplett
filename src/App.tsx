import { BrowserRouter, NavLink, Route, Routes } from "react-router";
import { useAuthUser } from "./data/auth";
import { History, Partner, Settings, Tasks, Timer } from "./screens";
import { SignIn } from "./screens/SignIn";

const screens = [
  { path: "/", label: "Tasks", el: <Tasks /> },
  { path: "/timer", label: "Timer", el: <Timer /> },
  { path: "/history", label: "History", el: <History /> },
  { path: "/partner", label: "Partner", el: <Partner /> },
  { path: "/settings", label: "Settings", el: <Settings /> },
];

export function App() {
  const user = useAuthUser();
  if (user === undefined) return null;
  if (user === null) return <SignIn />;
  return (
    <BrowserRouter>
      <div className="shell">
        <nav className="nav">
          {screens.map((s) => (
            <NavLink key={s.path} to={s.path} end={s.path === "/"}>
              {s.label}
            </NavLink>
          ))}
        </nav>
        <main>
          <Routes>
            {screens.map((s) => (
              <Route key={s.path} path={s.path} element={s.el} />
            ))}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
