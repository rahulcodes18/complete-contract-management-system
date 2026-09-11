import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../utils/auth";
import "../css/Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };
 const role = localStorage.getItem("role");
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Legal Contract</h2>
        <span>Management System</span>
      </div>

      <nav>
        <button
          className={`nav-item ${
            location.pathname === "/dashboard" ? "active" : ""
          }`}
          onClick={() => navigate("/dashboard")}
        >
          📊 Dashboard
        </button>

        <button
          className={`nav-item ${
            location.pathname === "/contracts" ? "active" : ""
          }`}
          onClick={() => navigate("/contracts")}
        >
          📄 Contracts
        </button>

       <button
         className={`nav-item ${
           location.pathname === "/documents" ? "active" : ""
         }`}
         onClick={() => navigate("/documents")}
       >
         📁 Documents
       </button>

      <button
        className={`nav-item ${
          location.pathname === "/clauses" ? "active" : ""
        }`}
        onClick={() => navigate("/clauses")}
      >
        📝 Clauses
      </button>
        <button
          className={`nav-item ${
            location.pathname === "/modification-requests" ? "active" : ""
          }`}
          onClick={() => navigate("/modification-requests")}
        >
          ✏️ Modification Requests
        </button>
        <button
          className={`nav-item ${
            location.pathname === "/versions" ? "active" : ""
          }`}
          onClick={() => navigate("/versions")}
        >
          🔄 Versions
        </button>

        <button
          className={`nav-item ${
            location.pathname === "/approvals" ? "active" : ""
          }`}
          onClick={() => navigate("/approvals")}
        >
          ✅ Approvals
        </button>
        {role === "ADMIN" && (
          <button
            className={`nav-item ${
              location.pathname === "/users" ? "active" : ""
            }`}
            onClick={() => navigate("/users")}
          >
            👥 Users
          </button>
        )}
        {role === "ADMIN" && (
          <button
            className={`nav-item ${
              location.pathname === "/audit-logs" ? "active" : ""
            }`}
            onClick={() => navigate("/audit-logs")}
          >
            📋 Activity Logs
          </button>
        )}
    {role === "ADMIN" && (
      <button
        className={`nav-item ${
          location.pathname === "/profile" ? "active" : ""
        }`}
        onClick={() => navigate("/profile")}
      >
        👤 My Profile
      </button>
    )}
      </nav>

      <button className="logout-button" onClick={handleLogout}>
        🚪 Logout
      </button>
    </aside>
  );
}

export default Sidebar;