import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../css/Documents.css";

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // =========================
  // CURRENT USER ROLE
  // =========================
  const role = localStorage.getItem("role");

  // Only ADMIN and LEGAL_USER can upload
  const canUpload =
    role === "ADMIN" || role === "LEGAL_USER";

  // =========================
  // FETCH DOCUMENTS
  // =========================
  const fetchDocuments = async () => {
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

      const contractData = await contractsResponse.json();

      const documentResponses = await Promise.all(
        contractData.map((contract) =>
          fetch(
            `http://localhost:8080/contracts/${contract.id}/documents`,
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

      const documentLists = await Promise.all(
        documentResponses.map(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch documents");
          }

          return response.json();
        })
      );

      setDocuments(documentLists.flat());
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH CONTRACTS
  // =========================
  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:8080/contracts",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch contracts");
      }

      const data = await response.json();

      console.log("Contracts received:", data);
      console.log("Contracts count:", data.length);

      setContracts(data);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    }
  };

  // =========================
  // UPLOAD DOCUMENT
  // =========================
  const handleUpload = async () => {

    // Frontend security check
    if (!canUpload) {
      alert("You are not authorized to upload documents.");
      return;
    }

    if (!selectedContract) {
      alert("Please select a contract.");
      return;
    }

    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    try {
      setUploading(true);

      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(
        `http://localhost:8080/contracts/${selectedContract}/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText ||
            `Upload failed with status ${response.status}`
        );
      }

      alert("Document uploaded successfully!");

      // Reset upload form
      setSelectedContract("");
      setSelectedFile(null);

      // Reset file input visually
      const fileInput = document.getElementById(
        "document-file-input"
      );

      if (fileInput) {
        fileInput.value = "";
      }

      // Refresh document list
      await fetchDocuments();

    } catch (error) {
      console.error("Error uploading document:", error);

      alert(
        error.message ||
          "Unable to upload document."
      );

    } finally {
      setUploading(false);
    }
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

      const fileUrl =
        window.URL.createObjectURL(blob);

      window.open(fileUrl, "_blank");

      setTimeout(() => {
        window.URL.revokeObjectURL(fileUrl);
      }, 10000);

    } catch (error) {
      console.error(
        "Error viewing document:",
        error
      );

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

      const fileUrl =
        window.URL.createObjectURL(blob);

      const link =
        window.document.createElement("a");

      link.href = fileUrl;

      link.download =
        doc.fileName || "document";

      window.document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(fileUrl);

    } catch (error) {
      console.error(
        "Error downloading document:",
        error
      );

      alert("Unable to download document.");
    }
  };

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    fetchDocuments();
    fetchContracts();
  }, []);

  // =========================
  // UI
  // =========================
  return (
    <div className="documents-page">

      <Sidebar />

      <main className="documents-content">

        <h1>Documents</h1>

        {/* =========================
            UPLOAD SECTION
            ADMIN + LEGAL_USER ONLY
        ========================= */}

        {canUpload && (
          <div className="document-upload-section">

            <h2>Upload Document</h2>

            {/* Contract Selection */}
            <select
              value={selectedContract}
              onChange={(e) =>
                setSelectedContract(
                  e.target.value
                )
              }
            >
              <option value="">
                Select Contract
              </option>

              {contracts.map((contract) => (
                <option
                  key={contract.id}
                  value={contract.id}
                >
                  {contract.contractNumber} -{" "}
                  {contract.title}
                </option>
              ))}
            </select>

            {/* File Selection */}
            <input
              id="document-file-input"
              type="file"
              onChange={(e) =>
                setSelectedFile(
                  e.target.files[0]
                )
              }
            />

            {/* Upload Button */}
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading
                ? "Uploading..."
                : "Upload"}
            </button>

          </div>
        )}

        {/* =========================
            DOCUMENT LIST
        ========================= */}

        <div className="documents-list-section">

          <h2>Documents List</h2>

          {loading ? (
            <p>Loading documents...</p>

          ) : documents.length === 0 ? (
            <p>No documents found.</p>

          ) : (

            <div className="documents-list">

              {documents.map((doc) => (

                <div
                  className="document-card"
                  key={doc.id}
                >

                  {/* Document Name */}
                  <h3>
                    {doc.fileName ||
                      doc.name ||
                      `Document ${doc.id}`}
                  </h3>

                  {/* Document ID */}
                  <p>
                    <strong>
                      Document ID:
                    </strong>{" "}
                    {doc.id}
                  </p>

                  {/* Contract */}
                  {doc.contract && (
                    <>
                      <p>
                        <strong>
                          Contract:
                        </strong>{" "}
                        {doc.contract.title}
                      </p>

                      <p>
                        <strong>
                          Contract Number:
                        </strong>{" "}
                        {doc.contract.contractNumber}
                      </p>
                    </>
                  )}

                  {/* File Type */}
                  {doc.fileType && (
                    <p>
                      <strong>
                        File Type:
                      </strong>{" "}
                      {doc.fileType}
                    </p>
                  )}

                  {/* Uploaded By */}
                  {doc.uploadedBy && (
                    <p>
                      <strong>
                        Uploaded By:
                      </strong>{" "}
                      {doc.uploadedBy.fullName ||
                        doc.uploadedBy.username}
                    </p>
                  )}

                  {/* Uploaded At */}
                  {doc.uploadedAt && (
                    <p>
                      <strong>
                        Uploaded At:
                      </strong>{" "}
                      {new Date(
                        doc.uploadedAt
                      ).toLocaleString()}
                    </p>
                  )}

                  {/* Action Buttons */}
                  {doc.contract && (

                    <div className="document-actions">

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

                  )}

                </div>

              ))}

            </div>

          )}

        </div>

      </main>

    </div>
  );
}

export default Documents;