import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { API_BASE_URL } from "../services/api";

export default function Analytics() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRealData() {
            try {
                // Fetch real data from the backend heatmap endpoint (wide radius to capture region)
                const response = await fetch(`${API_BASE_URL}/heatmap?lat=21.1702&lng=72.8311&radius=500`);
                const json = await response.json();

                if (json.success && json.data) {
                    setData(json.data);
                }
            } catch (error) {
                console.error("Error fetching analytics data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchRealData();
    }, []);

    // Compute analytics
    const totalReports = data.reduce((sum, point) => sum + (point.reportCount || 1), 0);
    const totalPoints = data.length;
    const avgOverallScore = totalPoints > 0
        ? (data.reduce((sum, point) => sum + point.avgScore, 0) / totalPoints).toFixed(1)
        : 0;

    // Prepare data for Category Distribution (Pie Chart)
    let riskyCount = 0, moderateCount = 0, safeCount = 0;
    data.forEach((p) => {
        if (p.category === 'risky') riskyCount++;
        else if (p.category === 'moderate') moderateCount++;
        else safeCount++;
    });

    const categoryData = [
        { name: "Safe", value: safeCount, color: "#10b981" },
        { name: "Moderate", value: moderateCount, color: "#f59e0b" },
        { name: "Risky", value: riskyCount, color: "#ef4444" },
    ];

    // Prepare data for Score Bracket Distribution (Bar Chart)
    const scoreBrackets = { "1-2": 0, "3-4": 0, "5-6": 0, "7-8": 0, "9-10": 0 };
    data.forEach((p) => {
        const s = p.avgScore;
        if (s <= 2) scoreBrackets["1-2"]++;
        else if (s <= 4) scoreBrackets["3-4"]++;
        else if (s <= 6) scoreBrackets["5-6"]++;
        else if (s <= 8) scoreBrackets["7-8"]++;
        else scoreBrackets["9-10"]++;
    });

    const barData = Object.keys(scoreBrackets).map(key => ({
        bracket: key,
        locations: scoreBrackets[key]
    }));

    return (
        <div className="analytics-page">
            <div className="analytics-container">

                <div className="analytics-header">
                    <div>
                        <h1 className="analytics-title">Community Safety Analytics</h1>
                        <p className="analytics-subtitle">Aggregated real-time metrics from actual user area reports.</p>
                    </div>
                    <button
                        onClick={() => navigate("/add-rating")}
                        className="analytics-add-btn"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        Add Rating Map
                    </button>
                </div>

                {loading ? (
                    <div className="analytics-loading">
                        <div className="rating-spinner" style={{ display: "inline-block", marginBottom: "1rem" }}></div>
                        <p>Loading real dataset...</p>
                    </div>
                ) : (
                    <>
                        <div className="analytics-stats-grid">

                            <div className="analytics-stat-card">
                                <h3 className="analytics-stat-label">Total Rated Locations</h3>
                                <div className="analytics-stat-value analytics-stat-green">
                                    {totalPoints}
                                </div>
                                <p className="analytics-stat-desc">Unique areas</p>
                            </div>

                            <div className="analytics-stat-card">
                                <h3 className="analytics-stat-label">Average Safety Score</h3>
                                <div className={`analytics-stat-value ${avgOverallScore > 7 ? "analytics-stat-green" : avgOverallScore > 4 ? "analytics-stat-yellow" : "analytics-stat-red"}`}>
                                    {avgOverallScore} / 10
                                </div>
                                <p className={`analytics-stat-desc ${avgOverallScore > 7 ? "analytics-stat-green" : avgOverallScore > 4 ? "analytics-stat-yellow" : "analytics-stat-red"}`}>
                                    {avgOverallScore > 7 ? "🟢 Safe" : avgOverallScore > 4 ? "🟡 Moderate" : "🔴 Risky"}
                                </p>
                            </div>

                            <div className="analytics-stat-card">
                                <h3 className="analytics-stat-label">Total Community Reports</h3>
                                <div className="analytics-stat-value analytics-stat-yellow">
                                    {totalReports}
                                </div>
                                <p className="analytics-stat-desc">User submissions</p>
                            </div>
                        </div>

                        <div className="analytics-charts-grid">
                            <div className="analytics-chart-card">
                                <h2 className="analytics-chart-title">Safety Category Breakdown</h2>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc", borderRadius: "8px" }}
                                            itemStyle={{ color: "#f8fafc" }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="analytics-chart-card">
                                <h2 className="analytics-chart-title">Locations by Score Bracket</h2>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="bracket" stroke="#cbd5e1" tick={{ fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#cbd5e1" tick={{ fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                            contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }}
                                        />
                                        <Bar dataKey="locations" fill="#4fd1a5" radius={[4, 4, 0, 0]} name="# of Locations" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
