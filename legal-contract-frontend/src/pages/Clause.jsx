import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../css/Clause.css";

function Clause() {

  // =========================
  // CURRENT USER ROLE
  // =========================
  const role = localStorage.getItem("role");

  // ADMIN and LEGAL_USER can modify clauses
  // REVIEWER can only view clauses
  const canModifyClauses =
    role === "ADMIN" || role === "LEGAL_USER";

  const [clauses, setClauses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [createForm, setCreateForm] = useState({
    contractId: "",
    clauseNumber: "",
    title: "",
    content: "",
  });

  const [creating, setCreating] = useState(false);
  const [contracts, setContracts] = useState([]);

  // =========================
  // FETCH CLAUSES
  // =========================
  const fetchClauses = async () => {
    try {
      const token = localStorage.getItem("token");

      const contractsResponse = await fetch(
        "http://localhost:8080/contracts",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!contractsResponse.ok) {
        throw new Error("Failed to fetch contracts");
      }

      const contractsData =
        await contractsResponse.json();

      setContracts(contractsData);

      const clauseResponses = await Promise.all(
        contractsData.map((contract) =>
          fetch(
            `http://localhost:8080/contracts/${contract.id}/clauses`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          )
        )
      );

      const clauseLists = await Promise.all(
        clauseResponses.map(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch clauses");
          }

          return response.json();
        })
      );

      const allClauses = clauseLists.flat();

      setClauses(allClauses);

    } catch (error) {
      console.error(
        "Error fetching clauses:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE CLAUSE
  // =========================
  const handleDelete = async (clause) => {

    // Extra frontend authorization check
    if (!canModifyClauses) {
      alert(
        "You are not authorized to delete clauses."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete Clause ${clause.clauseNumber}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(clause.id);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8080/contracts/${clause.contract.id}/clauses/${clause.id}`,
        {
          method: "DELETE",
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
            `Delete failed: ${response.status}`
        );
      }

      setClauses(
        (previousClauses) =>
          previousClauses.filter(
            (item) =>
              item.id !== clause.id
          )
      );

      alert(
        "Clause deleted successfully."
      );

    } catch (error) {
      console.error(
        "Error deleting clause:",
        error
      );

      alert(
        error.message ||
          "Unable to delete clause."
      );

    } finally {
      setDeleting(null);
    }
  };

  // =========================
  // CREATE CLAUSE
  // =========================
  const handleCreateClause = async (event) => {

    event.preventDefault();

    // Extra frontend authorization check
    if (!canModifyClauses) {
      alert(
        "You are not authorized to create clauses."
      );
      return;
    }

    if (!createForm.contractId) {
      alert("Please select a contract.");
      return;
    }

    if (!createForm.clauseNumber.trim()) {
      alert("Please enter clause number.");
      return;
    }

    if (!createForm.title.trim()) {
      alert("Please enter clause title.");
      return;
    }

    if (!createForm.content.trim()) {
      alert("Please enter clause content.");
      return;
    }

    try {
      setCreating(true);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8080/contracts/${createForm.contractId}/clauses`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clauseNumber:
              createForm.clauseNumber,
            title: createForm.title,
            content:
              createForm.content,
          }),
        }
      );

      if (!response.ok) {
        const errorMessage =
          await response.text();

        throw new Error(
          errorMessage ||
            `Create failed: ${response.status}`
        );
      }

      alert(
        "Clause created successfully."
      );

      setCreateForm({
        contractId: "",
        clauseNumber: "",
        title: "",
        content: "",
      });

      setShowCreateForm(false);

      await fetchClauses();

    } catch (error) {
      console.error(
        "Error creating clause:",
        error
      );

      alert(
        error.message ||
          "Unable to create clause."
      );

    } finally {
      setCreating(false);
    }
  };

  // =========================
  // MOVE CLAUSE
  // =========================
  const handleMoveClause = async (
    clause,
    direction
  ) => {

    // Extra frontend authorization check
    if (!canModifyClauses) {
      alert(
        "You are not authorized to reorder clauses."
      );
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8080/contracts/${clause.contract.id}/clauses/${clause.id}/move?direction=${direction}`,
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
            `Move failed: ${response.status}`
        );
      }

      await fetchClauses();

    } catch (error) {
      console.error(
        "Error moving clause:",
        error
      );

      alert(
        error.message ||
          "Unable to reorder clause."
      );
    }
  };

  // =========================
  // LOAD CLAUSES
  // =========================
  useEffect(() => {
    fetchClauses();
  }, []);

  // =========================
  // GROUP CLAUSES BY CONTRACT
  // =========================
  const groupedClauses =
    clauses.reduce(
      (groups, clause) => {

        const contractId =
          clause.contract?.id;

        if (!groups[contractId]) {
          groups[contractId] = {
            contract: clause.contract,
            clauses: [],
          };
        }

        groups[contractId].clauses.push(
          clause
        );

        return groups;
      },
      {}
    );

  // =========================
  // UI
  // =========================
  return (
    <div className="clause-page">

      <Sidebar />

      <main className="clause-content">

        {/* PAGE HEADER */}
        <div className="clause-page-header">

          <h1>Contract Clauses</h1>

          {/* CREATE BUTTON
              ADMIN + LEGAL_USER ONLY
          */}
          {canModifyClauses && (
            <button
              type="button"
              className="create-clause-btn"
              onClick={() =>
                setShowCreateForm(
                  !showCreateForm
                )
              }
            >
              {showCreateForm
                ? "✕ Close"
                : "+ Create Clause"}
            </button>
          )}

        </div>

        {/* CREATE CLAUSE FORM
            ADMIN + LEGAL_USER ONLY
        */}
        {canModifyClauses &&
          showCreateForm && (

            <div className="create-clause-section">

              <h2>Create Clause</h2>

              <form
                className="create-clause-form"
                onSubmit={
                  handleCreateClause
                }
              >

                {/* CONTRACT */}
                <div className="form-group">

                  <label>
                    Contract
                  </label>

                  <select
                    value={
                      createForm.contractId
                    }
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        contractId:
                          event.target.value,
                      })
                    }
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
                          {
                            contract.contractNumber
                          }{" "}
                          -{" "}
                          {contract.title}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* CLAUSE NUMBER */}
                <div className="form-group">

                  <label>
                    Clause Number
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. 2.1"
                    value={
                      createForm.clauseNumber
                    }
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        clauseNumber:
                          event.target.value,
                      })
                    }
                  />

                </div>

                {/* TITLE */}
                <div className="form-group">

                  <label>
                    Title
                  </label>

                  <input
                    type="text"
                    placeholder="Enter clause title"
                    value={
                      createForm.title
                    }
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        title:
                          event.target.value,
                      })
                    }
                  />

                </div>

                {/* CONTENT */}
                <div className="form-group">

                  <label>
                    Content
                  </label>

                  <textarea
                    placeholder="Enter clause content"
                    rows="5"
                    value={
                      createForm.content
                    }
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        content:
                          event.target.value,
                      })
                    }
                  />

                </div>

                {/* CREATE BUTTON */}
                <button
                  type="submit"
                  className="save-clause-btn"
                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
                    : "Create Clause"}
                </button>

              </form>

            </div>
          )}

        {/* CLAUSE LIST */}
        <div className="clause-list">

          {loading ? (
            <p>
              Loading clauses...
            </p>

          ) : Object.values(
              groupedClauses
            ).length === 0 ? (

            <p>
              No clauses found.
            </p>

          ) : (

            Object.values(
              groupedClauses
            ).map((group) => (

              <div
                key={group.contract.id}
              >

                {/* CONTRACT HEADER */}
                <div className="contract-clause-header">

                  <h2>
                    {group.contract.title}
                  </h2>

                  <span>
                    {
                      group.contract
                        .contractNumber
                    }
                  </span>

                </div>

                {/* CLAUSES */}
                {group.clauses.map(
                  (clause) => (

                    <div
                      className="clause-card"
                      key={clause.id}
                    >

                      <div className="clause-header">

                        <h3>
                          Clause{" "}
                          {clause.orderNumber}

                          {clause.clauseNumber &&
                            ` (${clause.clauseNumber})`}
                        </h3>

                      </div>

                      <p>
                        <strong>
                          Clause ID:
                        </strong>{" "}
                        {clause.id}
                      </p>

                      <p>
                        <strong>
                          Title:
                        </strong>{" "}
                        {clause.title}
                      </p>

                      <p>
                        <strong>
                          Content:
                        </strong>{" "}
                        {clause.content}
                      </p>

                      {/* CLAUSE ACTIONS
                          ADMIN + LEGAL_USER ONLY
                      */}
                      {canModifyClauses && (
                        <div className="clause-actions">

                          <button
                            type="button"
                            className="move-clause-btn"
                            onClick={() =>
                              handleMoveClause(
                                clause,
                                "UP"
                              )
                            }
                          >
                            ↑ Move Up
                          </button>

                          <button
                            type="button"
                            className="move-clause-btn"
                            onClick={() =>
                              handleMoveClause(
                                clause,
                                "DOWN"
                              )
                            }
                          >
                            ↓ Move Down
                          </button>

                          <button
                            type="button"
                            className="delete-clause-btn"
                            onClick={() =>
                              handleDelete(
                                clause
                              )
                            }
                            disabled={
                              deleting ===
                              clause.id
                            }
                          >
                            {deleting ===
                            clause.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>
                      )}

                    </div>

                  )
                )}

              </div>

            ))
          )}

        </div>

      </main>

    </div>
  );
}

export default Clause;