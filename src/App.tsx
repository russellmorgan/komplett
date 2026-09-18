import { BrowserRouter, NavLink, Route, Routes } from "react-router";
import { useAuthUser } from "./data/auth";
import { History, Partner, Settings, Timer } from "./screens";
import { ListsNav } from "./screens/ListsNav";
import { SignIn } from "./screens/SignIn";
import { Tasks } from "./screens/Tasks";

export function App() {
  const user = useAuthUser();
  if (user === undefined) return null;
  if (user === null) return <SignIn />;

  const screens = [
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
            <Route path="/list/:listId" element={<Tasks user={user} />} />
            {screens.map((screen) => (
              <Route key={screen.path} path={screen.path} element={screen.element} />
            ))}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
