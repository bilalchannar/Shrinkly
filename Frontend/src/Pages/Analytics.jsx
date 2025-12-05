import React, { useState, useEffect } from "react";
import "../Css/Analytics.css";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { Line, Pie } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import { linksAPI, analyticsAPI } from "../services/api";

export default function Dashboard() {
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

  // Fetch all links for the dropdown
  useEffect(() => {
    fetchLinks();
  }, []);

  // Fetch analytics when filters change
  useEffect(() => {
    fetchAnalytics();
    fetchInsights();
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
        backgroundColor: ["#ff6384", "#36a2eb", "#ffcd56", "#4bc0c0"],
        hoverOffset: 4,
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
          <header className="header">
            <div className="header-content">
              <div className="logo">SHRINKLY</div>
              <div className="header-controls">
                <select
                  id="linkSelector"
                  value={link}
                  onChange={handleLinkChange}
                >
                  <option value="">All Links</option>
                  {links.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.short}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={handleStartDateChange}
                />
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={handleEndDateChange}
                />
              </div>
            </div>
          </header>

          <main className="main-content">
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

            {/* Traffic Sources Chart */}
            <section className="chart-section">
              <h2>Traffic Sources</h2>
              {referrers.length > 0 ? (
                <Pie data={trafficSourcesData} />
              ) : (
                <p>No referrer data available yet</p>
              )}
            </section>

            {/* Device Analytics Chart */}
            <section className="chart-section">
              <h2>Device Analytics</h2>
              {devices.length > 0 ? (
                <Pie data={deviceAnalyticsData} />
              ) : (
                <p>No device data available yet</p>
              )}
            </section>

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
                <p><strong>Best performing link:</strong> {insights.topLink}</p>
                <p><strong>Best day to share:</strong> {insights.bestDay}</p>
                <p><strong>Best platform:</strong> {insights.bestPlatform}</p>
                <p><strong>Best time:</strong> {insights.bestHour}</p>
                <p><strong>Unusual traffic patterns:</strong> {insights.unusualPatterns}</p>
              </div>

              <h2>Traffic Heatmap</h2>
              <canvas id="heatmapChart"></canvas>
            </section>

            {/* Export Section */}
            <section className="export-section">
              <button id="exportPDF" onClick={handleExportPDF}>Export as PDF</button>
              <button id="exportCSV" onClick={handleExportCSV}>Export as CSV</button>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
