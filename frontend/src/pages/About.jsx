import { useNavigate } from "react-router-dom";

export default function About() {
    const navigate = useNavigate();

    return (
        <div style={{ padding: "80px 20px 40px", backgroundColor: "#0b1120", color: "#f8fafc", minHeight: "100vh" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
                <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}><span style={{ color: "#4fd1a5" }}>Safe</span>Route</h1>
                <p style={{ fontSize: "1.2rem", color: "#94a3b8", marginBottom: "3rem" }}>
                    Empowering your journey with real-time safety metrics and community-driven insights.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "3rem" }}>
                    <div style={{
                        background: "rgba(30, 41, 59, 0.7)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "2rem",
                        borderRadius: "1rem"
                    }}>
                        <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#4fd1a5" }}>Community Ratings</h3>
                        <p style={{ color: "#cbd5e1" }}>Contribute to a safer neighborhood by rating areas based on lighting, visibility, and security.</p>
                    </div>

                    <div style={{
                        background: "rgba(30, 41, 59, 0.7)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "2rem",
                        borderRadius: "1rem"
                    }}>
                        <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#4fd1a5" }}>Heatmaps</h3>
                        <p style={{ color: "#cbd5e1" }}>Visualize danger zones and safe regions globally right on the interactive map.</p>
                    </div>

                    <div style={{
                        background: "rgba(30, 41, 59, 0.7)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "2rem",
                        borderRadius: "1rem"
                    }}>
                        <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#4fd1a5" }}>Smart Routing</h3>
                        <p style={{ color: "#cbd5e1" }}>Let the advanced algorithm guide you through the safest paths, avoiding high-risk zones.</p>
                    </div>
                </div>

                <button
                    onClick={() => navigate("/")}
                    style={{
                        padding: "16px 32px",
                        fontSize: "1.1rem",
                        background: "#4fd1a5",
                        color: "#0b1120",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "opacity 0.2s"
                    }}
                >
                    Try the Map Now
                </button>
            </div>
        </div>
    );
}
