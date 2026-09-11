import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Contracts from "./pages/Contracts";
import Approvals from "./pages/Approvals";
import Documents from "./pages/Documents";
import Version from "./pages/Version";
import Clause from "./pages/Clause";
import ActivityLogs from "./pages/ActivityLogs";
import ModificationRequests from "./pages/ModificationRequests";
import Register from "./pages/Register";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
<Route path="/profile" element={<Profile />} />
        <Route
          path="/contracts"
          element={<Contracts />}
        />
        <Route path="/users" element={<Users />} />
        <Route
          path="/audit-logs"
          element={<ActivityLogs />}
        />
        <Route
          path="/clauses"
          element={<Clause />}
        />
        <Route
          path="/documents"
          element={<Documents />}
        />

        <Route
          path="/approvals"
          element={<Approvals />}
        />
        <Route
          path="/modification-requests"
          element={<ModificationRequests />}
        />
        <Route
          path="/versions"
          element={<Version />}
        />
        <Route path="/register" element={<Register />} />

        <Route
          path="*"
          element={<Navigate to="/" />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;