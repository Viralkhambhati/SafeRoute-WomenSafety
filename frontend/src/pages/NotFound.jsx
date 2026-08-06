import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#0b1120", color: "#f8fafc", textAlign: "center" }}>
            <div style={{
                background: "rgba(30, 41, 59, 0.7)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "3rem",
                borderRadius: "1rem",
                maxWidth: "400px"
            }}>
                <h1 style={{ fontSize: "4rem", marginBottom: "0.5rem", color: "#4fd1a5" }}>404</h1>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Oops! Wrong Turn</h2>
                <p style={{ marginBottom: "2rem", color: "#94a3b8" }}>The safe route to this page doesn't exist.</p>
                <Link to="/" style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    background: "#4fd1a5",
                    color: "#0b1120",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "600",
                    transition: "background 0.2s"
                }}>
                    Return to Map
                </Link>
            </div>
        </div>
    );
}
