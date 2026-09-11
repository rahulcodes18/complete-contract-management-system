import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "../css/Users.css";

function Users() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    const fetchUsers = async () => {

      try {
        const response = await api.get("/admin/users");
        setUsers(response.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load users.");
      } finally {
        setLoading(false);
      }

    };

    fetchUsers();

  }, []);

  return (
    <div className="users-page-layout">

      <Sidebar />

      <main className="users-page">

        <div className="users-page-header">

          <div>
            <h1>Users</h1>
            <p>
              Manage and view registered users.
            </p>
          </div>

          <div className="users-count">
            {users.length} Users
          </div>

        </div>


        {loading && (
          <div className="users-loading">
            Loading users...
          </div>
        )}


        {error && (
          <div className="users-error">
            {error}
          </div>
        )}


        {!loading && !error && (

          <div className="users-table-container">

            <table className="users-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>


              <tbody>

                {users.length === 0 ? (

                  <tr>
                    <td
                      colSpan="6"
                      className="empty-users"
                    >
                      No users found.
                    </td>
                  </tr>

                ) : (

                  users.map((user) => (

                    <tr key={user.id}>

                      <td>
                        {user.id}
                      </td>

                      <td>
                        <strong>
                          {user.fullName}
                        </strong>
                      </td>

                      <td>
                        {user.username}
                      </td>

                      <td>
                        {user.email}
                      </td>

                      <td>

                        <span
                          className={`user-role role-${user.role?.name?.toLowerCase()}`}
                        >
                          {user.role?.name}
                        </span>

                      </td>

                      <td>

                        <span
                          className={
                            user.enabled
                              ? "user-status active"
                              : "user-status inactive"
                          }
                        >
                          {user.enabled
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        )}

      </main>

    </div>
  );
}

export default Users;