import { useEffect, useState } from "react";
import api from "../services/api";
import { getRole, getUsername } from "../utils/auth";
import Sidebar from "../components/Sidebar";
import "../css/Dashboard.css";

function Dashboard() {

  const [dashboard, setDashboard] = useState(null);
  const [modificationRequests, setModificationRequests] = useState([]);
  const [error, setError] = useState("");

  const role = getRole();
  const username = getUsername();

  useEffect(() => {

    const fetchDashboard = async () => {

      try {

        /*
         * REVIEWER DASHBOARD
         *
         * Modification request statistics are calculated
         * directly from /modification-requests.
         */
        if (role === "REVIEWER") {

          const response = await api.get("/modification-requests");

          console.log(
            "Modification Requests:",
            response.data
          );

          const requests = Array.isArray(response.data)
            ? response.data
            : [];

          setModificationRequests(requests);

          const pendingRequests = requests.filter(
            (request) => request.status === "PENDING"
          ).length;

          const approvedRequests = requests.filter(
            (request) => request.status === "APPROVED"
          ).length;

          const rejectedRequests = requests.filter(
            (request) => request.status === "REJECTED"
          ).length;

          setDashboard({
            pendingModificationRequests: pendingRequests,
            totalModificationRequests: requests.length,
            approvedModificationRequests: approvedRequests,
            rejectedModificationRequests: rejectedRequests
          });

          return;
        }


        /*
         * ADMIN / LEGAL USER DASHBOARD
         *
         * Continue using the existing dashboard API.
         */
        const response = await api.get("/dashboard");

        console.log("Dashboard data:", response.data);

        setDashboard(response.data);

      } catch (err) {

        console.error("Dashboard error:", err);

        setError("Unable to load dashboard");
      }
    };

    fetchDashboard();

  }, [role]);


  /* ================================
     ERROR
     ================================ */

  if (error) {

    return (
      <div className="dashboard-container">

        <Sidebar />

        <main className="main-content">

          <div className="dashboard-error">
            {error}
          </div>

        </main>

      </div>
    );
  }


  /* ================================
     LOADING
     ================================ */

  if (!dashboard) {

    return (
      <div className="dashboard-container">

        <Sidebar />

        <main className="main-content">

          <div className="dashboard-loading">
            Loading dashboard...
          </div>

        </main>

      </div>
    );
  }


  return (
    <div className="dashboard-container">

      <Sidebar />

      <main className="main-content">


        {/* ================================
            HEADER
            ================================ */}

        <header className="top-header">

          <div>

            <h1>Dashboard</h1>

            <p>
              Manage your legal contracts and documents
            </p>

          </div>


          <div className="user-info">

            <div className="user-avatar">
              {username?.charAt(0).toUpperCase()}
            </div>

            <div>

              <strong>{username}</strong>

              <small>{role}</small>

            </div>

          </div>

        </header>


        {/* ================================
            WELCOME
            ================================ */}

        <section className="welcome-section">

          <h2>
            Welcome back, {username}! 👋
          </h2>

          <p>
            Here's an overview of your legal contract activities.
          </p>

        </section>


        {/* ================================
            LEGAL USER DASHBOARD
            ================================ */}

        {role === "LEGAL_USER" && (

          <div className="stats-grid">


            <div className="stat-card">

              <div className="stat-icon">
                📄
              </div>

              <div>

                <span>
                  My Contracts
                </span>

                <h2>
                  {dashboard.myContracts || 0}
                </h2>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                📝
              </div>

              <div>

                <span>
                  Draft Contracts
                </span>

                <h2>
                  {dashboard.draftContracts || 0}
                </h2>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                ⏳
              </div>

              <div>

                <span>
                  Pending Approvals
                </span>

                <h2>
                  {dashboard.pendingApprovals || 0}
                </h2>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                ✅
              </div>

              <div>

                <span>
                  Approved Contracts
                </span>

                <h2>
                  {dashboard.approvedContracts || 0}
                </h2>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                ❌
              </div>

              <div>

                <span>
                  Rejected Contracts
                </span>

                <h2>
                  {dashboard.rejectedContracts || 0}
                </h2>

              </div>

            </div>

          </div>

        )}


        {/* ================================
            ADMIN DASHBOARD
            ================================ */}

        {role === "ADMIN" && (

          <div className="stats-grid">


            <div className="stat-card">

              <div className="stat-icon">
                👥
              </div>

              <div>

                <span>
                  Total Users
                </span>

                <h2>
                  {dashboard.totalUsers || 0}
                </h2>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                📄
              </div>

              <div>

                <span>
                  Total Contracts
                </span>

                <h2>
                  {dashboard.totalContracts || 0}
                </h2>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                📁
              </div>

              <div>

                <span>
                  Total Documents
                </span>

                <h2>
                  {dashboard.totalDocuments || 0}
                </h2>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                🔄
              </div>

              <div>

                <span>
                  Total Versions
                </span>

                <h2>
                  {dashboard.totalVersions || 0}
                </h2>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                ⏳
              </div>

              <div>

                <span>
                  Pending Approvals
                </span>

                <h2>
                  {dashboard.pendingApprovals || 0}
                </h2>

              </div>

            </div>

          </div>

        )}


        {/* ================================
            REVIEWER DASHBOARD
            ================================ */}

        {role === "REVIEWER" && (

          <div className="stats-grid">


            {/* PENDING */}

            <div className="stat-card">

              <div className="stat-icon">
                ⏳
              </div>

              <div>

                <span>
                  Pending Requests
                </span>

                <h2>
                  {dashboard.pendingModificationRequests || 0}
                </h2>

              </div>

            </div>


            {/* TOTAL */}

            <div className="stat-card">

              <div className="stat-icon">
                📋
              </div>

              <div>

                <span>
                  Total Modification Requests
                </span>

                <h2>
                  {dashboard.totalModificationRequests || 0}
                </h2>

              </div>

            </div>


            {/* APPROVED */}

            <div className="stat-card">

              <div className="stat-icon">
                ✅
              </div>

              <div>

                <span>
                  Approved Requests
                </span>

                <h2>
                  {dashboard.approvedModificationRequests || 0}
                </h2>

              </div>

            </div>


            {/* REJECTED */}

            <div className="stat-card">

              <div className="stat-icon">
                ❌
              </div>

              <div>

                <span>
                  Rejected Requests
                </span>

                <h2>
                  {dashboard.rejectedModificationRequests || 0}
                </h2>

              </div>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default Dashboard;