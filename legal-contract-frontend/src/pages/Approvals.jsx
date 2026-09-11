import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "../css/Approvals.css";

function Approvals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(null);

  const role = localStorage.getItem("role");

  // =========================
  // FETCH MODIFICATION REQUESTS
  // =========================
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/modification-requests"
      );

      setRequests(response.data);
    } catch (err) {
      console.error(
        "Error fetching modification requests:",
        err
      );

      setError(
        err.response?.data ||
          "Unable to load modification requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // =========================
  // REVIEW REQUEST
  // =========================
  const handleReview = async (
    requestId,
    status
  ) => {
    let comments = "";

    if (status === "REJECTED") {
      comments = window.prompt(
        "Enter rejection reason:"
      );

      if (comments === null) {
        return;
      }

      if (!comments.trim()) {
        alert(
          "Rejection reason is required."
        );
        return;
      }
    } else {
      comments = window.prompt(
        "Enter approval comments:",
        "Approved after review"
      );

      if (comments === null) {
        return;
      }
    }

    try {
      setReviewing(requestId);

      await api.put(
        `/modification-requests/${requestId}/review`,
        null,
        {
          params: {
            status: status,
            comments: comments,
          },
        }
      );

      alert(
        status === "APPROVED"
          ? "Modification request approved successfully."
          : "Modification request rejected successfully."
      );

      await fetchRequests();
    } catch (err) {
      console.error(
        "Error reviewing modification request:",
        err
      );

      alert(
        err.response?.data ||
          err.response?.data?.message ||
          "Unable to review modification request"
      );
    } finally {
      setReviewing(null);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="approvals-layout">
        <Sidebar />

        <main className="approvals-page">
          <div className="approvals-loading">
            Loading modification requests...
          </div>
        </main>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error) {
    return (
      <div className="approvals-layout">
        <Sidebar />

        <main className="approvals-page">
          <div className="approvals-error">
            {error}
          </div>
        </main>
      </div>
    );
  }

  // =========================
  // APPROVAL DASHBOARD
  // =========================
  return (
    <div className="approvals-layout">

      <Sidebar />

      <main className="approvals-page">

        {/* HEADER */}
        <div className="approvals-header">

          <div>
            <h1>
              Approval Dashboard
            </h1>

            <p>
              Review and manage contract
              modification requests.
            </p>
          </div>

          <div className="approval-summary">
            <span>
              Pending:{" "}
              {
                requests.filter(
                  (request) =>
                    request.status === "PENDING"
                ).length
              }
            </span>
          </div>

        </div>


        {/* =========================
            EMPTY STATE
        ========================= */}
        {requests.length === 0 ? (

          <div className="empty-approvals">
            No modification requests found.
          </div>

        ) : (

          <div className="approvals-table-container">

            <table className="approvals-table">

              <thead>
                <tr>
                  <th>
                    Request
                  </th>

                  <th>
                    Contract
                  </th>

                  <th>
                    Requested By
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>


              <tbody>

                {requests.map(
                  (request) => (

                    <tr
                      key={request.id}
                    >

                      {/* REQUEST */}
                      <td>

                        <strong>
                          Request #
                          {request.id}
                        </strong>

                        <br />

                        <small>
                          {request.clause
                            ? `Clause ${
                                request.clause
                                  .clauseNumber ||
                                request.clause
                                  .orderNumber
                              }`
                            : "Whole Contract"}
                        </small>

                      </td>


                      {/* CONTRACT */}
                      <td>

                        <strong>
                          {
                            request.contract
                              ?.title
                          }
                        </strong>

                        <br />

                        <small>
                          {
                            request.contract
                              ?.contractNumber
                          }
                        </small>

                      </td>


                      {/* REQUESTED BY */}
                      <td>
                        {
                          request.requestedBy
                            ?.fullName ||
                          request.requestedBy
                            ?.username ||
                          "-"
                        }
                      </td>


                      {/* STATUS */}
                      <td>

                        <span
                          className={`approval-status status-${request.status?.toLowerCase()}`}
                        >
                          {request.status}
                        </span>

                      </td>


                      {/* ACTION */}
                      <td>

                        {role ===
                          "REVIEWER" &&
                        request.status ===
                          "PENDING" ? (

                          <div className="approval-actions">

                            <button
                              className="approve-btn"
                              onClick={() =>
                                handleReview(
                                  request.id,
                                  "APPROVED"
                                )
                              }
                              disabled={
                                reviewing ===
                                request.id
                              }
                            >
                              {reviewing ===
                              request.id
                                ? "Processing..."
                                : "✓ Approve"}
                            </button>


                            <button
                              className="reject-btn"
                              onClick={() =>
                                handleReview(
                                  request.id,
                                  "REJECTED"
                                )
                              }
                              disabled={
                                reviewing ===
                                request.id
                              }
                            >
                              {reviewing ===
                              request.id
                                ? "Processing..."
                                : "✕ Reject"}
                            </button>

                          </div>

                        ) : request.status !==
                          "PENDING" ? (

                          <span className="reviewed-text">
                            Reviewed
                          </span>

                        ) : (

                          <span className="reviewed-text">
                            Review Only
                          </span>

                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}


        {/* =========================
            REQUEST COMPARISON
        ========================= */}
        {requests.length > 0 && (
          <div className="approval-details-section">

            <h2>
              Pending Modification Details
            </h2>

            {requests
              .filter(
                (request) =>
                  request.status ===
                  "PENDING"
              )
              .map((request) => (

                <div
                  className="approval-detail-card"
                  key={`detail-${request.id}`}
                >

                  <div className="approval-detail-header">

                    <div>

                      <h3>
                        Request #
                        {request.id}
                      </h3>

                      <p>
                        {
                          request.contract
                            ?.contractNumber
                        }{" "}
                        -{" "}
                        {
                          request.contract
                            ?.title
                        }
                      </p>

                    </div>

                    <span className="approval-status status-pending">
                      PENDING
                    </span>

                  </div>


                  {/* ORIGINAL */}
                  <div className="approval-comparison">

                    <div className="approval-value original-value">

                      <h4>
                        Original Contract / Clause Value
                      </h4>

                      <div>
                        {
                          request.originalValue ||
                          "No original value provided."
                        }
                      </div>

                    </div>


                    <div className="approval-arrow">
                      →
                    </div>


                    {/* PROPOSED */}
                    <div className="approval-value proposed-value">

                      <h4>
                        Proposed Modified Value
                      </h4>

                      <div>
                        {
                          request.proposedModification ||
                          "No proposed modification provided."
                        }
                      </div>

                    </div>

                  </div>


                  {/* REASON */}
                  <div className="approval-reason">

                    <h4>
                      Modification Reason
                    </h4>

                    <p>
                      {
                        request.reason ||
                        "No reason provided."
                      }
                    </p>

                  </div>


                  {/* META */}
                  <div className="approval-meta">

                    <div>
                      <strong>
                        Requested By
                      </strong>

                      <span>
                        {
                          request.requestedBy
                            ?.fullName ||
                          request.requestedBy
                            ?.username ||
                          "-"
                        }
                      </span>
                    </div>


                    <div>
                      <strong>
                        Request Date
                      </strong>

                      <span>
                        {request.createdAt
                          ? new Date(
                              request.createdAt
                            ).toLocaleString()
                          : "-"}
                      </span>
                    </div>


                    <div>
                      <strong>
                        Status
                      </strong>

                      <span>
                        {request.status}
                      </span>
                    </div>

                  </div>


                  {/* ACTIONS */}
                  {role ===
                    "REVIEWER" && (

                    <div className="approval-detail-actions">

                      <button
                        className="approve-btn"
                        onClick={() =>
                          handleReview(
                            request.id,
                            "APPROVED"
                          )
                        }
                        disabled={
                          reviewing ===
                          request.id
                        }
                      >
                        {reviewing ===
                        request.id
                          ? "Processing..."
                          : "✓ Approve Modification"}
                      </button>


                      <button
                        className="reject-btn"
                        onClick={() =>
                          handleReview(
                            request.id,
                            "REJECTED"
                          )
                        }
                        disabled={
                          reviewing ===
                          request.id
                        }
                      >
                        {reviewing ===
                        request.id
                          ? "Processing..."
                          : "✕ Reject Modification"}
                      </button>

                    </div>

                  )}

                </div>

              ))}

          </div>
        )}

      </main>

    </div>
  );
}

export default Approvals;