import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Register.css";

const API_URL = "http://localhost:8080";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        email: "",
        password: "",
        role: "LEGAL_USER",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (
            !formData.fullName ||
            !formData.username ||
            !formData.email ||
            !formData.password
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );

            const data = await response.text();

            if (!response.ok) {
                setError(data || "Registration failed.");
                return;
            }

            setMessage(
                data || "User registered successfully."
            );

            setFormData({
                fullName: "",
                username: "",
                email: "",
                password: "",
                role: "LEGAL_USER",
            });

        } catch (error) {
            console.error("Registration error:", error);

            setError(
                "Unable to connect to the server."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">

            <div className="register-card">

                <div className="register-header">
                    <h1>Create Account</h1>

                    <p>
                        Register a new user for the
                        Legal Contract Management System.
                    </p>
                </div>

                {message && (
                    <div className="register-success">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="register-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister}>

                    <div className="form-group">
                        <label>Full Name</label>

                        <input
                            type="text"
                            name="fullName"
                            placeholder="Enter full name"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Username</label>

                        <input
                            type="text"
                            name="username"
                            placeholder="Enter username"
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>

                        <input
                            type="email"
                            name="email"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>

                        <input
                            type="password"
                            name="password"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Role</label>

                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="LEGAL_USER">
                                Legal User
                            </option>

                            <option value="REVIEWER">
                                Reviewer
                            </option>

                            <option value="ADMIN">
                                Admin
                            </option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="register-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Registering..."
                            : "Register"}
                    </button>

                </form>

                <button
                    className="back-login-button"
                    onClick={() => navigate("/")}
                >
                    ← Back to Login
                </button>

            </div>

        </div>
    );
}

export default Register;