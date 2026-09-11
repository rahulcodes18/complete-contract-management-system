import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../css/ModificationRequests.css";

function ModificationRequests() {
  const [requests, setRequests] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [clauses, setClauses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [reviewing, setReviewing] = useState(null);

  const [showForm, setShowForm] = useState(false);

  // Prevent duplicate form submissions
  const submittingRef = useRef(false);

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    contractId: "",
    clauseId: "",
    originalValue: "",
    proposedModification: "",
    reason: "",
  });

  // =========================
  // FETCH REQUESTS
  // =========================
  const fetchRequests = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/modification-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch modification requests"
        );
      }

      const data = await response.json();

      setRequests(data);
    } catch (error) {
      console.error(
        "Error fetching requests:",
        error
      );
    }
  };

  // =========================
  // FETCH CONTRACTS
  // =========================
  const fetchContracts = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/contracts",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch contracts"
        );
      }

      const data = await response.json();

      setContracts(data);
    } catch (error) {
      console.error(
        "Error fetching contracts:",
        error
      );
    }
  };

  // =========================
  // FETCH CLAUSES
  // =========================
  const fetchClauses = async (contractId) => {
    if (!contractId) {
      setClauses([]);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/contracts/${contractId}/clauses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch clauses"
        );
      }

      const data = await response.json();

      setClauses(data);
    } catch (error) {
      console.error(
        "Error fetching clauses:",
        error
      );

      setClauses([]);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        fetchRequests(),
        fetchContracts(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  // =========================
  // CONTRACT CHANGE
  // =========================
  const handleContractChange = async (event) => {
    const contractId = event.target.value;

    setForm((previousForm) => ({
      ...previousForm,
      contractId,
      clauseId: "",
      originalValue: "",
    }));

    await fetchClauses(contractId);
  };

  // =========================
  // CLAUSE CHANGE
  // =========================
  const handleClauseChange = (event) => {
    const clauseId = event.target.value;

    const selectedClause = clauses.find(
      (clause) =>
        clause.id.toString() === clauseId
    );

    setForm((previousForm) => ({
      ...previousForm,
      clauseId,
      originalValue:
        selectedClause?.content || "",
    }));
  };

  // =========================
  // CREATE REQUEST
  // =========================
  const handleCreateRequest = async (event) => {
    event.preventDefault();

    // Prevent duplicate submissions
    if (submittingRef.current) {
      return;
    }

    // =========================
    // VALIDATION
    // =========================
    if (!form.contractId) {
      alert("Please select a contract.");
      return;
    }

    if (!form.originalValue.trim()) {
      alert("Please enter the original value.");
      return;
    }

    if (!form.proposedModification.trim()) {
      alert(
        "Please enter the proposed modification."
      );
      return;
    }

    if (!form.reason.trim()) {
      alert("Please enter the reason.");
      return;
    }

    // Lock immediately
    submittingRef.current = true;
    setCreating(true);

    try {
      const requestBody = {
        contract: {
          id: Number(form.contractId),
        },

        originalValue:
          form.originalValue.trim(),

        proposedModification:
          form.proposedModification.trim(),

        reason: form.reason.trim(),
      };

      // Clause is optional
      if (form.clauseId) {
        requestBody.clause = {
          id: Number(form.clauseId),
        };
      }

      const response = await fetch(
        "http://localhost:8080/modification-requests",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorMessage =
          await response.text();

        throw new Error(
          errorMessage ||
            `Request failed: ${response.status}`
        );
      }

      alert(
        "Modification request submitted successfully."
      );

      // Reset form
      setForm({
        contractId: "",
        clauseId: "",
        originalValue: "",
        proposedModification: "",
        reason: "",
      });

      setClauses([]);

      setShowForm(false);

      // Refresh request list
      await fetchRequests();

    } catch (error) {
      console.error(
        "Error creating modification request:",
        error
      );

      alert(
        error.message ||
          "Unable to submit modification request."
      );

    } finally {
      setCreating(false);

      // Unlock after request is completely processed
      submittingRef.current = false;
    }
  };

  // =========================
  // REVIEW REQUEST
  // =========================
  const handleReviewRequest = async (
    requestId,
    status
  ) => {
    const comments = window.prompt(
      `Enter comments for ${status.toLowerCase()}ing this request:`
    );

    if (comments === null) {
      return;
    }

    // Rejection requires a reason
    if (
      status === "REJECTED" &&
      !comments.trim()
    ) {
      alert(
        "Rejection reason is required."
      );
      return;
    }

    try {
      setReviewing(requestId);

      const response = await fetch(
        `http://localhost:8080/modification-requests/${requestId}/review?status=${status}&comments=${encodeURIComponent(
          comments
        )}`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorMessage =
          await response.text();

        throw new Error(
          errorMessage ||
            `Review failed: ${response.status}`
        );
      }

      alert(
        `Modification request ${status.toLowerCase()} successfully.`
      );

      await fetchRequests();

    } catch (error) {
      console.error(
        "Error reviewing modification request:",
        error
      );

      alert(
        error.message ||
          "Unable to review modification request."
      );

    } finally {
      setReviewing(null);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="modification-page">

      <Sidebar />

      <main className="modification-content">

        {/* =========================
            HEADER
        ========================= */}
        <div className="modification-page-header">

          <div>
            <h1>
              Modification Requests
            </h1>

            <p>
              Submit, review and track contract
              modification requests.
            </p>
          </div>

          {role === "LEGAL_USER" && (
            <button
              type="button"
              className="create-request-btn"
              onClick={() =>
                setShowForm(!showForm)
              }
            >
              {showForm
                ? "✕ Close"
                : "+ New Request"}
            </button>
          )}

        </div>


        {/* =========================
            CREATE FORM
        ========================= */}
        {showForm && (
          <div className="modification-form-section">

            <h2>
              New Modification Request
            </h2>

            <form
              className="modification-form"
              onSubmit={handleCreateRequest}
            >

              {/* CONTRACT */}
              <div className="form-group">

                <label>
                  Contract
                </label>

                <select
                  value={form.contractId}
                  onChange={
                    handleContractChange
                  }
                  disabled={creating}
                >

                  <option value="">
                    Select Contract
                  </option>

                  {contracts.map(
                    (contract) => (
                      <option
                        key={contract.id}
                        value={contract.id}
                      >
                        {contract.contractNumber}{" "}
                        - {contract.title}
                      </option>
                    )
                  )}

                </select>

              </div>


              {/* CLAUSE */}
              <div className="form-group">

                <label>
                  Clause{" "}
                  <span>
                    (Optional)
                  </span>
                </label>

                <select
                  value={form.clauseId}
                  onChange={
                    handleClauseChange
                  }
                  disabled={
                    !form.contractId ||
                    creating
                  }
                >

                  <option value="">
                    Whole Contract
                  </option>

                  {clauses.map(
                    (clause) => (
                      <option
                        key={clause.id}
                        value={clause.id}
                      >
                        Clause{" "}
                        {clause.clauseNumber ||
                          clause.orderNumber}{" "}
                        - {clause.title}
                      </option>
                    )
                  )}

                </select>

              </div>


              {/* ORIGINAL VALUE */}
              <div className="form-group">

                <label>
                  Original Value
                </label>

                <textarea
                  rows="4"
                  placeholder="Enter the existing contract or clause content"
                  value={
                    form.originalValue
                  }
                  onChange={(event) =>
                    setForm(
                      (previousForm) => ({
                        ...previousForm,
                        originalValue:
                          event.target.value,
                      })
                    )
                  }
                  disabled={creating}
                />

              </div>


              {/* PROPOSED MODIFICATION */}
              <div className="form-group">

                <label>
                  Proposed Modification
                </label>

                <textarea
                  rows="4"
                  placeholder="Enter the proposed change"
                  value={
                    form.proposedModification
                  }
                  onChange={(event) =>
                    setForm(
                      (previousForm) => ({
                        ...previousForm,
                        proposedModification:
                          event.target.value,
                      })
                    )
                  }
                  disabled={creating}
                />

              </div>


              {/* REASON */}
              <div className="form-group">

                <label>
                  Reason / Description
                </label>

                <textarea
                  rows="4"
                  placeholder="Explain why this modification is required"
                  value={form.reason}
                  onChange={(event) =>
                    setForm(
                      (previousForm) => ({
                        ...previousForm,
                        reason:
                          event.target.value,
                      })
                    )
                  }
                  disabled={creating}
                />

              </div>


              {/* SUBMIT */}
              <button
                type="submit"
                className="submit-request-btn"
                disabled={creating}
              >
                {creating
                  ? "Submitting..."
                  : "Submit Request"}
              </button>

            </form>

          </div>
        )}


        {/* =========================
            REQUEST LIST
        ========================= */}
        <div className="request-list">

          {loading ? (
            <p>
              Loading modification requests...
            </p>

          ) : requests.length === 0 ? (

            <p>
              No modification requests found.
            </p>

          ) : (

            requests.map((request) => (

              <div
                className="request-card"
                key={request.id}
              >

                {/* =========================
                    REQUEST HEADER
                ========================= */}
                <div className="request-header">

                  <div>

                    <h2>
                      Request #{request.id}
                    </h2>

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

                  <span
                    className={`request-status ${request.status?.toLowerCase()}`}
                  >
                    {request.status}
                  </span>

                </div>


                {/* =========================
                    BASIC DETAILS
                ========================= */}
                <div className="request-details">

                  <p>
                    <strong>
                      Contract:
                    </strong>{" "}
                    {
                      request.contract
                        ?.title
                    }
                  </p>

                  <p>
                    <strong>
                      Contract Number:
                    </strong>{" "}
                    {
                      request.contract
                        ?.contractNumber
                    }
                  </p>

                  <p>
                    <strong>
                      Type:
                    </strong>{" "}

                    {request.clause
                      ? `Clause ${
                          request.clause
                            .clauseNumber ||
                          request.clause
                            .orderNumber
                        } - ${
                          request.clause.title
                        }`
                      : "Whole Contract"}

                  </p>

                </div>


                {/* =========================
                    MODIFICATION COMPARISON
                ========================= */}
                <div className="modification-comparison">

                  <div className="comparison-column original-column">

                    <h3>
                      Original Value
                    </h3>

                    <div className="comparison-box">

                      {request.originalValue ||
                        "No original value provided."}

                    </div>

                  </div>


                  <div className="comparison-arrow">
                    →
                  </div>


                  <div className="comparison-column proposed-column">

                    <h3>
                      Proposed Modification
                    </h3>

                    <div className="comparison-box">

                      {
                        request.proposedModification ||
                        "No proposed modification provided."
                      }

                    </div>

                  </div>

                </div>


                {/* =========================
                    REASON
                ========================= */}
                <div className="reason-section">

                  <h3>
                    Modification Reason
                  </h3>

                  <p>
                    {request.reason ||
                      "No reason provided."}
                  </p>

                </div>


                {/* =========================
                    REQUEST INFORMATION
                ========================= */}
                <div className="request-meta">

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
                      Current Status
                    </strong>

                    <span
                      className={`request-status ${request.status?.toLowerCase()}`}
                    >
                      {request.status ||
                        "-"}
                    </span>

                  </div>

                </div>


                {/* =========================
                    REVIEW INFORMATION
                ========================= */}
                {request.reviewedBy && (
                  <div className="review-information">

                    <h3>
                      Review Information
                    </h3>

                    <p>
                      <strong>
                        Reviewed By:
                      </strong>{" "}
                      {
                        request.reviewedBy
                          ?.fullName ||
                        request.reviewedBy
                          ?.username ||
                        "-"
                      }
                    </p>

                    <p>
                      <strong>
                        Reviewed At:
                      </strong>{" "}
                      {request.reviewedAt
                        ? new Date(
                            request.reviewedAt
                          ).toLocaleString()
                        : "-"}
                    </p>

                    {request.reviewerComments && (
                      <p>
                        <strong>
                          Reviewer Comments:
                        </strong>{" "}
                        {
                          request.reviewerComments
                        }
                      </p>
                    )}

                  </div>
                )}


                {/* =========================
                    REVIEW ACTIONS
                    ONLY REVIEWER
                ========================= */}
                {role === "REVIEWER" &&
                  request.status ===
                    "PENDING" && (

                    <div className="review-actions">

                      <button
                        type="button"
                        className="approve-request-btn"
                        onClick={() =>
                          handleReviewRequest(
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
                        type="button"
                        className="reject-request-btn"
                        onClick={() =>
                          handleReviewRequest(
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

                  )}

              </div>

            ))

          )}

        </div>

      </main>

    </div>
  );
}

export default ModificationRequests;