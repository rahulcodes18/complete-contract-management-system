import { useEffect, useState } from "react";
import api from "../services/api";
import { getRole } from "../utils/auth";
import Sidebar from "../components/Sidebar";
import "../css/Contracts.css";

function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [error, setError] = useState("");

  // Create Contract
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [contractForm, setContractForm] = useState({
    contractNumber: "",
    title: "",
    description: "",
  });

  const role = getRole();

  useEffect(() => {
    fetchContracts();
  }, []);

  // =========================
  // FETCH CONTRACTS
  // =========================
  const fetchContracts = async () => {
    try {
      const response = await api.get("/contracts");
      setContracts(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load contracts");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CREATE CONTRACT
  // =========================
  const handleCreateContract = async (e) => {
    e.preventDefault();

    if (!contractForm.contractNumber.trim()) {
      alert("Please enter contract number");
      return;
    }

    if (!contractForm.title.trim()) {
      alert("Please enter contract title");
      return;
    }

    try {
      setCreating(true);

      const response = await api.post("/contracts", {
        contractNumber: contractForm.contractNumber,
        title: contractForm.title,
        description: contractForm.description,
      });

      // Add newly created contract to the list
      setContracts((prevContracts) => [
        ...prevContracts,
        response.data,
      ]);

      // Clear form
      setContractForm({
        contractNumber: "",
        title: "",
        description: "",
      });

      // Close form
      setShowCreateForm(false);

      alert("Contract created successfully.");
    } catch (err) {
      console.error("Error creating contract:", err);

      if (err.response?.data) {
        alert(
          typeof err.response.data === "string"
            ? err.response.data
            : "Unable to create contract."
        );
      } else {
        alert("Unable to create contract.");
      }
    } finally {
      setCreating(false);
    }
  };

  // =========================
  // FORM INPUT CHANGE
  // =========================
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setContractForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // OPEN CONTRACT DETAILS
  // =========================
  const openContractDetails = async (contract) => {
    setSelectedContract(contract);
    setDocuments([]);
    setDocumentsLoading(true);

    try {
      const response = await api.get(
        `/contracts/${contract.id}/documents`
      );

      setDocuments(response.data);
    } catch (err) {
      console.error("Error loading documents:", err);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // =========================
  // CLOSE CONTRACT DETAILS
  // =========================
  const closeContractDetails = () => {
    setSelectedContract(null);
    setDocuments([]);
  };

  // =========================
  // VIEW DOCUMENT
  // =========================
  const handleView = async (doc) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8080/contracts/${doc.contract.id}/documents/${doc.id}/view`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to view document: ${response.status}`
        );
      }

      const blob = await response.blob();

      const fileUrl = window.URL.createObjectURL(blob);

      window.open(fileUrl, "_blank");

      setTimeout(() => {
        window.URL.revokeObjectURL(fileUrl);
      }, 10000);
    } catch (err) {
      console.error("Error viewing document:", err);
      alert("Unable to view document.");
    }
  };

  // =========================
  // DOWNLOAD DOCUMENT
  // =========================
  const handleDownload = async (doc) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8080/contracts/${doc.contract.id}/documents/${doc.id}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to download document: ${response.status}`
        );
      }

      const blob = await response.blob();

      const fileUrl = window.URL.createObjectURL(blob);

      const link = window.document.createElement("a");

      link.href = fileUrl;
      link.download = doc.fileName || "document";

      window.document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error("Error downloading document:", err);
      alert("Unable to download document.");
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="contracts-layout">
        <Sidebar />

        <main className="contracts-page">
          Loading contracts...
        </main>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error) {
    return (
      <div className="contracts-layout">
        <Sidebar />

        <main className="contracts-page">
          {error}
        </main>
      </div>
    );
  }

  return (
    <div className="contracts-layout">
      <Sidebar />

      <main className="contracts-page">

        {/* =========================
            HEADER
        ========================= */}
        <div className="contracts-header">

          <div>
            <h1>Contracts</h1>
            <p>View and manage legal contracts</p>
          </div>

          {(role === "ADMIN" || role === "LEGAL_USER") && (
            <button
              className="create-contract-btn"
              onClick={() =>
                setShowCreateForm(!showCreateForm)
              }
            >
              {showCreateForm
                ? "✕ Cancel"
                : "+ Create Contract"}
            </button>
          )}

        </div>

        {/* =========================
            CREATE CONTRACT FORM
        ========================= */}
        {showCreateForm && (
          <div className="create-contract-section">

            <h2>Create New Contract</h2>

            <form
              className="create-contract-form"
              onSubmit={handleCreateContract}
            >

              <div className="form-group">
                <label>
                  Contract Number
                </label>

                <input
                  type="text"
                  name="contractNumber"
                  value={contractForm.contractNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. CON-005"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Contract Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={contractForm.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Employment Agreement"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={contractForm.description}
                  onChange={handleInputChange}
                  placeholder="Enter contract description"
                  rows="4"
                />
              </div>

              <button
                type="submit"
                className="save-contract-btn"
                disabled={creating}
              >
                {creating
                  ? "Creating..."
                  : "Create Contract"}
              </button>

            </form>

          </div>
        )}

        {/* =========================
            CONTRACT TABLE
        ========================= */}
        {contracts.length === 0 ? (
          <div className="empty-state">
            No contracts found.
          </div>
        ) : (
          <div className="contracts-table-container">

            <table className="contracts-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Contract Number</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created By</th>
                </tr>
              </thead>

              <tbody>

                {contracts.map((contract) => (

                  <tr key={contract.id}>

                    <td>
                      {contract.id}
                    </td>

                    <td>
                      {contract.contractNumber}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="contract-title-btn"
                        onClick={() =>
                          openContractDetails(contract)
                        }
                      >
                        {contract.title}
                      </button>
                    </td>

                    <td>
                      {contract.description || "-"}
                    </td>

                    <td>
                      <span
                        className={`status-badge status-${contract.status?.toLowerCase()}`}
                      >
                        {contract.status}
                      </span>
                    </td>

                    <td>
                      {contract.createdBy?.username || "-"}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

        {/* =========================
            CONTRACT DETAILS
        ========================= */}
        {selectedContract && (

          <div className="contract-details-section">

            <div className="contract-details-header">

              <div>
                <h2>
                  {selectedContract.title}
                </h2>

                <p>
                  Contract Number:{" "}
                  <strong>
                    {selectedContract.contractNumber}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                className="close-details-btn"
                onClick={closeContractDetails}
              >
                Close
              </button>

            </div>

            {/* Contract Information */}
            <div className="contract-info">

              <p>
                <strong>Contract ID:</strong>{" "}
                {selectedContract.id}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {selectedContract.status}
              </p>

              <p>
                <strong>Description:</strong>{" "}
                {selectedContract.description || "-"}
              </p>

              <p>
                <strong>Created By:</strong>{" "}
                {selectedContract.createdBy?.username || "-"}
              </p>

            </div>

            {/* =========================
                DOCUMENTS
            ========================= */}
            <div className="contract-documents">

              <h3>Documents</h3>

              {documentsLoading ? (
                <p>Loading documents...</p>
              ) : documents.length === 0 ? (

                <p className="no-documents">
                  No documents uploaded for this contract.
                </p>

              ) : (

                <div className="contract-document-list">

                  {documents.map((doc) => (

                    <div
                      className="contract-document-card"
                      key={doc.id}
                    >

                      <div className="document-info">

                        <h4>
                          {doc.fileName ||
                            `Document ${doc.id}`}
                        </h4>

                        <p>
                          <strong>Document ID:</strong>{" "}
                          {doc.id}
                        </p>

                        {doc.fileType && (
                          <p>
                            <strong>Type:</strong>{" "}
                            {doc.fileType}
                          </p>
                        )}

                        {doc.uploadedBy && (
                          <p>
                            <strong>Uploaded By:</strong>{" "}
                            {doc.uploadedBy.fullName ||
                              doc.uploadedBy.username}
                          </p>
                        )}

                        {doc.uploadedAt && (
                          <p>
                            <strong>Uploaded At:</strong>{" "}
                            {new Date(
                              doc.uploadedAt
                            ).toLocaleString()}
                          </p>
                        )}

                      </div>

                      <div className="contract-document-actions">

                        <button
                          type="button"
                          onClick={() =>
                            handleView(doc)
                          }
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownload(doc)
                          }
                        >
                          Download
                        </button>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>

        )}

      </main>
    </div>
  );
}

export default Contracts;