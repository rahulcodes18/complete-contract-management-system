import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../css/Version.css";

function Version() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVersions = async () => {
    try {
      const token = localStorage.getItem("token");

      // Get all contracts
      const contractsResponse = await fetch(
        "http://localhost:8080/contracts",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!contractsResponse.ok) {
        throw new Error("Failed to fetch contracts");
      }

      const contracts = await contractsResponse.json();

      // Get versions for every contract
      const versionResponses = await Promise.all(
        contracts.map((contract) =>
          fetch(
            `http://localhost:8080/contracts/${contract.id}/versions`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          )
        )
      );

      const versionLists = await Promise.all(
        versionResponses.map(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch versions");
          }

          return response.json();
        })
      );

      // Combine all versions
      setVersions(versionLists.flat());
    } catch (error) {
      console.error("Error fetching versions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  return (
    <div className="version-page">
      <Sidebar />

      <main className="version-content">
        <h1>Contract Versions</h1>

        <div className="version-list-section">
          <h2>Versions List</h2>

          {loading ? (
            <p>Loading versions...</p>
          ) : versions.length === 0 ? (
            <p>No versions found.</p>
          ) : (
            <div className="version-list">
              {versions.map((version) => (
                <div className="version-card" key={version.id}>
                  <div className="version-header">
                    <h3>
                      Version {version.versionNumber}
                    </h3>

                    <span className="version-status">
                      {version.status}
                    </span>
                  </div>

                  <p>
                    <strong>Version ID:</strong> {version.id}
                  </p>

                  {version.contract && (
                    <>
                      <p>
                        <strong>Contract:</strong>{" "}
                        {version.contract.title}
                      </p>

                      <p>
                        <strong>Contract Number:</strong>{" "}
                        {version.contract.contractNumber}
                      </p>
                    </>
                  )}

                  {version.changeSummary && (
                    <p>
                      <strong>Change Summary:</strong>{" "}
                      {version.changeSummary}
                    </p>
                  )}

                  {version.createdBy && (
                    <p>
                      <strong>Created By:</strong>{" "}
                      {version.createdBy.fullName ||
                        version.createdBy.username}
                    </p>
                  )}

                  {version.document && (
                    <p>
                      <strong>Document:</strong>{" "}
                      {version.document.fileName}
                    </p>
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

export default Version;