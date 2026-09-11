import { useEffect, useState } from "react";
import api from "../services/api";
import { getRole, getUsername } from "../utils/auth";
import Sidebar from "../components/Sidebar";
import "../css/Profile.css";

function Profile() {

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const role = getRole();
  const username = getUsername();

  useEffect(() => {

    const fetchProfile = async () => {

      try {
        const response = await api.get("/admin/users");

        const currentUser = response.data.find(
          (item) => item.username === username
        );

        if (currentUser) {
          setUser(currentUser);
        } else {
          setError("Profile not found.");
        }

      } catch (err) {
        console.error(err);
        setError("Unable to load profile.");
      }

    };

    if (role === "ADMIN") {
      fetchProfile();
    }

  }, [role, username]);

  return (
    <div className="profile-page-layout">

      <Sidebar />

      <main className="profile-page">

        <div className="profile-header">
          <h1>My Profile</h1>
          <p>View your account information.</p>
        </div>

        {error && (
          <div className="profile-error">
            {error}
          </div>
        )}

        {!user && !error && (
          <div className="profile-loading">
            Loading profile...
          </div>
        )}

        {user && (
          <div className="profile-main-card">

            <div className="profile-large-avatar">
              {user.fullName?.charAt(0).toUpperCase()}
            </div>

            <div className="profile-info">

              <h2>{user.fullName}</h2>

              <span className="profile-role-badge">
                {user.role?.name}
              </span>

              <div className="profile-info-grid">

                <div className="profile-info-item">
                  <span>Full Name</span>
                  <strong>{user.fullName}</strong>
                </div>

                <div className="profile-info-item">
                  <span>Username</span>
                  <strong>{user.username}</strong>
                </div>

                <div className="profile-info-item">
                  <span>Email</span>
                  <strong>{user.email}</strong>
                </div>

                <div className="profile-info-item">
                  <span>Role</span>
                  <strong>{user.role?.name}</strong>
                </div>

                <div className="profile-info-item">
                  <span>Account Status</span>

                  <strong
                    className={
                      user.enabled
                        ? "profile-active"
                        : "profile-inactive"
                    }
                  >
                    {user.enabled ? "Active" : "Inactive"}
                  </strong>

                </div>

              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}

export default Profile;