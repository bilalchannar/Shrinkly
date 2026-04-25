import React, { useState, useEffect } from "react";
import "../Css/Analytics.css";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { Line, Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import { linksAPI, analyticsAPI } from "../services/api";

export default function Analytics() {
  const [link, setLink] = useState("");  // Selected link for analytics
  const [links, setLinks] = useState([]); // All links for dropdown
  const [startDate, setStartDate] = useState("");  // Start date for analytics
  const [endDate, setEndDate] = useState("");  // End date for analytics
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClicks: 0,
    uniqueVisitors: 0,
    deviceCount: 0,
    countryCount: 0,
    referrerCount: 0,
    qrScans: 0,
  });
  const [devices, setDevices] = useState([]);
  const [browsers, setBrowsers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [clickTrends, setClickTrends] = useState([]);
  const [topLinks, setTopLinks] = useState([]);
  const [insights, setInsights] = useState({
    bestDay: "Loading...",
    bestPlatform: "Loading...",
    bestHour: "Loading...",
    topLink: "Loading...",
    unusualPatterns: "None"
  });
  const [heatmap, setHeatmap] = useState([]);

  // Fetch all links for the dropdown
  useEffect(() => {
    fetchLinks();
  }, []);

  // Fetch analytics when filters change
  useEffect(() => {
    fetchAnalytics();
    fetchInsights();
    fetchHeatmap();
  }, [link, startDate, endDate]);

  const fetchLinks = async () => {
    try {
      const data = await linksAPI.getAll();
      if (data.success) {
        setLinks(data.links);
      }
    } catch (error) {
      console.error("Error fetching links:", error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let data;
      if (link) {
        data = await analyticsAPI.getForLink(link, params);
      } else {
        data = await analyticsAPI.getOverall(params);
      }

      if (data.success) {
        const { analytics } = data;
        setStats({
          totalClicks: analytics.totalClicks || 0,
          uniqueVisitors: analytics.uniqueVisitors || 0,
          deviceCount: analytics.deviceCount || 0,
          countryCount: analytics.countryCount || 0,
          referrerCount: analytics.referrerCount || 0,
          qrScans: analytics.qrScans || 0,
        });
        setDevices(analytics.devices || []);
        setBrowsers(analytics.browsers || []);
        setCountries(analytics.countries || []);
        setReferrers(analytics.referrers || []);
        setClickTrends(analytics.clickTrends || []);
        setTopLinks(analytics.topLinks || []);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
    setLoading(false);
  };

  const fetchInsights = async () => {
    try {
      const params = {};
      if (link) params.linkId = link;

      const data = await analyticsAPI.getInsights(params);

      if (data.success) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const fetchHeatmap = async () => {
    try {
      const params = {};
      if (link) params.linkId = link;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await analyticsAPI.getHeatmap(params);
      if (data.success) {
        setHeatmap(data.heatmap);
      }
    } catch (error) {
      console.error("Error fetching heatmap:", error);
    }
  };

  // Chart data from API
  const clickTrendsData = {
    labels: clickTrends.map(t => t.date),
    datasets: [
      {
        label: "Click Trends",
        data: clickTrends.map(t => t.clicks),
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const trafficSourcesData = {
    labels: referrers.map(r => r.name),
    datasets: [
      {
        data: referrers.map(r => r.clicks),
        backgroundColor: ["#ff6384", "#36a2eb", "#ffcd56", "#4bc0c0", "#9966ff", "#ff9f40", "#c9cbcf"],
        hoverOffset: 4,
      },
    ],
  };

  const deviceAnalyticsData = {
    labels: devices.map(d => d.name),
    datasets: [
      {
        data: devices.map(d => d.clicks),
        backgroundColor: ["#512da8", "#7b4fd4", "#9d7fe3", "#c0b1f0"],
        hoverOffset: 4,
        borderWidth: 0,
      },
    ],
  };

  const heatmapData = {
    labels: ["12am", "3am", "6am", "9am", "12pm", "3pm", "6pm", "9pm"],
    datasets: [
      {
        label: "Hourly Traffic",
        data: Array(8).fill(0).map((_, i) => {
          const hourRange = [i * 3, (i * 3) + 1, (i * 3) + 2];
          return heatmap
            .filter(h => hourRange.includes(h.hour))
            .reduce((sum, h) => sum + h.clicks, 0);
        }),
        backgroundColor: "rgba(81, 45, 168, 0.7)",
        borderRadius: 8,
      },
    ],
  };

  // Handle exports
  const handleExportCSV = async () => {
    try {
      const params = {};
      if (link) params.linkId = link;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await analyticsAPI.export(params);

      if (data.success) {
        const headers = ["Short URL", "Original URL", "Device", "Browser", "OS", "Country", "Referrer", "QR Scan", "Clicked At"];
        const csvContent = [
          headers.join(","),
          ...data.data.map(row => 
            [row.shortUrl, row.originalUrl, row.device, row.browser, row.os, row.country, row.referrer, row.isQrScan, row.clickedAt].join(",")
          )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "analytics_export.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  const handleExportPDF = () => {
    // For PDF export, you would typically use a library like jsPDF
    alert("PDF export requires additional setup with jsPDF library");
  };

  // Handle link and date changes
  const handleLinkChange = (e) => setLink(e.target.value);
  const handleStartDateChange = (e) => setStartDate(e.target.value);
  const handleEndDateChange = (e) => setEndDate(e.target.value);

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div id="analytics" className="page active analytics-page">
          <header className="analytics-header">
            <div className="analytics-header-left">
              <h1>Analytics Dashboard</h1>
              <p>Track your link performance in real-time</p>
            </div>
            <div className="analytics-header-right">
              <div className="filter-group">
                <label>Filter by Link</label>
                <select
                  id="linkSelector"
                  value={link}
                  onChange={handleLinkChange}
                >
                  <option value="">All Links</option>
                  {links.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.shortCode || l.shortUrl || l.short}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>From</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={handleStartDateChange}
                />
              </div>
              <div className="filter-group">
                <label>To</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={handleEndDateChange}
                />
              </div>
            </div>
          </header>

          <div className="analytics-container">
            {/* Performance Cards */}
            <section className="performance-cards">
              <div className="card">
                Total Clicks <span>{loading ? "..." : stats.totalClicks}</span>
              </div>
              <div className="card">
                Unique Visitors <span>{loading ? "..." : stats.uniqueVisitors}</span>
              </div>
              <div className="card">
                Devices Used <span>{loading ? "..." : stats.deviceCount}</span>
              </div>
              <div className="card">
                Countries <span>{loading ? "..." : stats.countryCount}</span>
              </div>
              <div className="card">
                Referrers <span>{loading ? "..." : stats.referrerCount}</span>
              </div>
              <div className="card">
                QR Scans <span>{loading ? "..." : stats.qrScans}</span>
              </div>
            </section>

            {/* Click Trends Chart */}
            <section className="chart-section">
              <h2>Click Trends</h2>
              {clickTrends.length > 0 ? (
                <Line data={clickTrendsData} />
              ) : (
                <p>No click data available yet</p>
              )}
            </section>

            {/* Charts Grid */}
            <div className="charts-grid">
              {/* Traffic Sources Chart */}
              <section className="chart-section pie-card">
                <h2>Traffic Sources</h2>
                <div className="pie-container">
                  {referrers.length > 0 ? (
                    <Pie 
                      data={trafficSourcesData} 
                      options={{ maintainAspectRatio: false }}
                    />
                  ) : (
                    <p className="no-data">No referrer data available</p>
                  )}
                </div>
              </section>

              {/* Device Analytics Chart */}
              <section className="chart-section pie-card">
                <h2>Device Analytics</h2>
                <div className="pie-container">
                  {devices.length > 0 ? (
                    <Pie 
                      data={deviceAnalyticsData} 
                      options={{ maintainAspectRatio: false }}
                    />
                  ) : (
                    <p className="no-data">No device data available</p>
                  )}
                </div>
              </section>
            </div>

            {/* Browser Analytics Table */}
            <section className="table-section">
              <h2>Browser Analytics</h2>
              <table id="browserTable">
                <thead>
                  <tr>
                    <th>Browser</th>
                    <th>Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {browsers.length > 0 ? (
                    browsers.map((b, idx) => (
                      <tr key={idx}>
                        <td>{b.name}</td>
                        <td>{b.clicks}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2">No browser data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Country Analytics Table */}
            <section className="table-section">
              <h2>Top Countries</h2>
              <table id="countryTable">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.length > 0 ? (
                    countries.map((c, idx) => (
                      <tr key={idx}>
                        <td>{c.name}</td>
                        <td>{c.clicks}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2">No country data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Referrer Analytics Table */}
            <section className="table-section">
              <h2>Referrers</h2>
              <table id="referrerTable">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {referrers.length > 0 ? (
                    referrers.map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.name}</td>
                        <td>{r.clicks}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2">No referrer data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Top Performing Links Section */}
            <section className="top-links-section">
              <h2>Top Performing Links</h2>
              <div id="topLinksList">
                {topLinks.length > 0 ? (
                  topLinks.map((l, idx) => (
                    <p key={idx}>
                      <strong>{idx + 1}.</strong> {l.shortUrl} - <span>{l.clicks} clicks</span>
                    </p>
                  ))
                ) : (
                  <p>No link data available yet</p>
                )}
              </div>
            </section>

            {/* AI Insights Section */}
            <section className="insights-section">
              <h2>AI Insights</h2>
              <div id="aiInsights">
                <p><strong>Best performing link:</strong> <span>{insights.topLink || "N/A"}</span></p>
                <p><strong>Best day to share:</strong> <span>{insights.bestDay || "N/A"}</span></p>
                <p><strong>Best platform:</strong> <span>{insights.bestPlatform || "N/A"}</span></p>
                <p><strong>Best time:</strong> <span>{insights.bestHour || "N/A"}</span></p>
                <p><strong>Traffic patterns:</strong> <span>{insights.unusualPatterns || "Normal"}</span></p>
              </div>

              <h2>Traffic Heatmap (Last 24h)</h2>
              <div className="chart-container" style={{ height: '300px' }}>
                <Bar 
                  data={heatmapData} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                  }} 
                />
              </div>
            </section>

            {/* Export Section */}
            <section className="export-section">
              <button id="exportPDF" onClick={handleExportPDF}>Export as PDF</button>
              <button id="exportCSV" onClick={handleExportCSV}>Export as CSV</button>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
