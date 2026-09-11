import React, { useEffect, useState } from "react";
import "../css/ActivityLogs.css";
import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:8080";

function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("ALL");
    const [entityFilter, setEntityFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 10;

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_URL}/audit-logs`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch audit logs");
            }

            const data = await response.json();
            setLogs(data);
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter((log) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            String(log.id || "").toLowerCase().includes(searchText) ||
            String(log.action || "").toLowerCase().includes(searchText) ||
            String(log.entityType || "").toLowerCase().includes(searchText) ||
            String(log.entityId || "").toLowerCase().includes(searchText) ||
            String(log.description || "").toLowerCase().includes(searchText) ||
            String(log.user?.username || "")
                .toLowerCase()
                .includes(searchText);

        const matchesAction =
            actionFilter === "ALL" ||
            log.action === actionFilter;

        const matchesEntity =
            entityFilter === "ALL" ||
            log.entityType === entityFilter;

        return matchesSearch && matchesAction && matchesEntity;
    });

    const totalPages = Math.ceil(
        filteredLogs.length / logsPerPage
    );

    const startIndex =
        (currentPage - 1) * logsPerPage;

    const currentLogs = filteredLogs.slice(
        startIndex,
        startIndex + logsPerPage
    );

    const actions = [
        ...new Set(
            logs
                .map((log) => log.action)
                .filter(Boolean)
        ),
    ];

    const entities = [
        ...new Set(
            logs
                .map((log) => log.entityType)
                .filter(Boolean)
        ),
    ];

    const exportCSV = () => {
        const headers = [
            "ID",
            "Action",
            "Entity",
            "Entity ID",
            "User",
            "Description",
            "Date",
        ];

        const rows = filteredLogs.map((log) => [
            log.id,
            log.action,
            log.entityType,
            log.entityId,
            log.user?.username || "",
            `"${(log.description || "").replace(/"/g, '""')}"`,
            log.createdAt
                ? new Date(log.createdAt).toLocaleString()
                : "",
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "audit-logs.csv";
        link.click();

        URL.revokeObjectURL(url);
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString();
    };

    const getActionClass = (action) => {
        if (!action) return "action-info";

        if (
            action.includes("CREATE") ||
            action.includes("REGISTRATION") ||
            action.includes("APPROVE")
        ) {
            return "action-success";
        }

        if (
            action.includes("DELETE") ||
            action.includes("REJECT")
        ) {
            return "action-danger";
        }

        if (
            action.includes("UPDATE") ||
            action.includes("PASSWORD") ||
            action.includes("REORDER")
        ) {
            return "action-warning";
        }

        return "action-info";
    };

    /*
     * Loading screen
     */
    if (loading) {
        return (
            <div className="activity-layout">
                <Sidebar />

                <div className="activity-page activity-loading">
                    <h2>Activity Logs</h2>
                    <p>Loading audit logs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="activity-layout">

            {/* Sidebar */}
            <Sidebar />

            {/* Main Activity Logs Page */}
            <div className="activity-page">

                {/* Header */}
                <div className="activity-header">
                    <div>
                        <h2>Activity Logs</h2>

                        <p>
                            Track important activities performed
                            in the system.
                        </p>
                    </div>

                    <button
                        className="activity-export-btn"
                        onClick={exportCSV}
                    >
                        Export CSV
                    </button>
                </div>

                {/* Filters */}
                <div className="activity-filters">

                    <input
                        className="activity-search"
                        type="text"
                        placeholder="Search logs..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                    />

                    <select
                        className="activity-filter"
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="ALL">
                            All Actions
                        </option>

                        {actions.map((action) => (
                            <option
                                key={action}
                                value={action}
                            >
                                {action}
                            </option>
                        ))}
                    </select>

                    <select
                        className="activity-filter"
                        value={entityFilter}
                        onChange={(e) => {
                            setEntityFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="ALL">
                            All Entities
                        </option>

                        {entities.map((entity) => (
                            <option
                                key={entity}
                                value={entity}
                            >
                                {entity}
                            </option>
                        ))}
                    </select>

                </div>

                {/* Summary */}
                <div className="activity-summary">
                    Showing {filteredLogs.length} log
                    {filteredLogs.length !== 1 ? "s" : ""}
                </div>

                {/* Table */}
                <div className="activity-table-container">

                    <table className="activity-table">

                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Entity ID</th>
                                <th>User</th>
                                <th>Description</th>
                                <th>Date & Time</th>
                            </tr>
                        </thead>

                        <tbody>

                            {currentLogs.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="7"
                                        className="empty-activity"
                                    >
                                        No audit logs found.
                                    </td>
                                </tr>

                            ) : (

                                currentLogs.map((log) => (

                                    <tr key={log.id}>

                                        <td>
                                            {log.id}
                                        </td>

                                        <td>
                                            <span
                                                className={`activity-action ${getActionClass(
                                                    log.action
                                                )}`}
                                            >
                                                {log.action}
                                            </span>
                                        </td>

                                        <td>
                                            {log.entityType || "-"}
                                        </td>

                                        <td>
                                            {log.entityId || "-"}
                                        </td>

                                        <td>
                                            {log.user?.username ||
                                                "System"}
                                        </td>

                                        <td className="activity-description">
                                            {log.description || "-"}
                                        </td>

                                        <td>
                                            {formatDate(
                                                log.createdAt
                                            )}
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

                {/* Pagination */}
                {totalPages > 1 && (

                    <div className="activity-pagination">

                        <button
                            disabled={currentPage === 1}
                            onClick={() =>
                                setCurrentPage(
                                    currentPage - 1
                                )
                            }
                        >
                            Previous
                        </button>

                        <span>
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            disabled={
                                currentPage === totalPages
                            }
                            onClick={() =>
                                setCurrentPage(
                                    currentPage + 1
                                )
                            }
                        >
                            Next
                        </button>

                    </div>

                )}

            </div>

        </div>
    );
}

export default ActivityLogs;