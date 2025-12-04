import React, { useState, useEffect } from "react";
import "../Css/Analytics.css";  // Ensure your styling for the analytics page is here
import Sidebar from "../Components/Sidebar";  // Assuming Sidebar is in the Components folder
import Footer from "../Components/Footer";  // Assuming Footer is in the Components folder
import { Line, Pie } from "react-chartjs-2";  // For charts, replace with any other charting library if needed
import { Chart as ChartJS } from "chart.js/auto";  // Import Chart.js if using it

export default function Dashboard() {
  const [link, setLink] = useState("");  // Selected link for analytics
  const [startDate, setStartDate] = useState("");  // Start date for analytics
  const [endDate, setEndDate] = useState("");  // End date for analytics
  const [stats, setStats] = useState({
    totalClicks: 0,
    uniqueVisitors: 0,
    deviceCount: 0,
    countryCount: 0,
    referrerCount: 0,
    qrScans: 0,
  });

  // Sample chart data
  const clickTrendsData = {
    labels: ["January", "February", "March", "April"],
    datasets: [
      {
        label: "Click Trends",
        data: [12, 19, 3, 5],
        borderColor: "rgba(75,192,192,1)",
        tension: 0.1,
      },
    ],
  };

  const trafficSourcesData = {
    labels: ["Facebook", "Instagram", "Direct", "Other"],
    datasets: [
      {
        data: [50, 30, 10, 10],
        backgroundColor: ["#ff6384", "#36a2eb", "#ffcd56", "#4bc0c0"],
        hoverOffset: 4,
      },
    ],
  };

  const deviceAnalyticsData = {
    labels: ["Mobile", "Desktop", "Tablet"],
    datasets: [
      {
        data: [60, 30, 10],
        backgroundColor: ["#ff6384", "#36a2eb", "#ffcd56"],
        hoverOffset: 4,
      },
    ],
  };

  // Handle link and date changes
  const handleLinkChange = (e) => setLink(e.target.value);
  const handleStartDateChange = (e) => setStartDate(e.target.value);
  const handleEndDateChange = (e) => setEndDate(e.target.value);

  useEffect(() => {
    // Here, you can fetch data from API based on the selected link and dates
    // Just a simulated fetch (replace this with actual data fetching)
    setTimeout(() => {
      setStats({
        totalClicks: 1200,
        uniqueVisitors: 800,
        deviceCount: 500,
        countryCount: 50,
        referrerCount: 15,
        qrScans: 200,
      });
    }, 2000);
  }, [link, startDate, endDate]);

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
                  <option value="">Select link...</option>
                  {/* Populate dynamic links from API */}
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
                Total Clicks <span>{stats.totalClicks}</span>
              </div>
              <div className="card">
                Unique Visitors <span>{stats.uniqueVisitors}</span>
              </div>
              <div className="card">
                Devices Used <span>{stats.deviceCount}</span>
              </div>
              <div className="card">
                Countries <span>{stats.countryCount}</span>
              </div>
              <div className="card">
                Referrers <span>{stats.referrerCount}</span>
              </div>
              <div className="card">
                QR Scans <span>{stats.qrScans}</span>
              </div>
            </section>

            {/* Click Trends Chart */}
            <section className="chart-section">
              <h2>Click Trends</h2>
              <Line data={clickTrendsData} />
            </section>

            {/* Traffic Sources Chart */}
            <section className="chart-section">
              <h2>Traffic Sources</h2>
              <Pie data={trafficSourcesData} />
            </section>

            {/* Device Analytics Chart */}
            <section className="chart-section">
              <h2>Device Analytics</h2>
              <Pie data={deviceAnalyticsData} />
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
                  <tr>
                    <td>Chrome</td>
                    <td>600</td>
                  </tr>
                  <tr>
                    <td>Safari</td>
                    <td>300</td>
                  </tr>
                  <tr>
                    <td>Firefox</td>
                    <td>200</td>
                  </tr>
                  <tr>
                    <td>Edge</td>
                    <td>100</td>
                  </tr>
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
                  <tr>
                    <td>USA</td>
                    <td>500</td>
                  </tr>
                  <tr>
                    <td>India</td>
                    <td>300</td>
                  </tr>
                  <tr>
                    <td>Germany</td>
                    <td>200</td>
                  </tr>
                  <tr>
                    <td>UK</td>
                    <td>100</td>
                  </tr>
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
                  <tr>
                    <td>Facebook</td>
                    <td>400</td>
                  </tr>
                  <tr>
                    <td>Instagram</td>
                    <td>250</td>
                  </tr>
                  <tr>
                    <td>WhatsApp</td>
                    <td>150</td>
                  </tr>
                  <tr>
                    <td>Direct</td>
                    <td>200</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Top Performing Links Section */}
            <section className="top-links-section">
              <h2>Top Performing Links</h2>
              <div id="topLinksList">
                {/* Populate dynamically based on API */}
                <p>Link 1: www.shortlink1.com</p>
                <p>Link 2: www.shortlink2.com</p>
              </div>
            </section>

            {/* AI Insights Section */}
            <section className="insights-section">
              <h2>AI Insights</h2>
              <div id="aiInsights">
                <p>Best performing link: www.shortlink1.com</p>
                <p>Best day to share: Monday</p>
                <p>Best platform: Facebook</p>
                <p>Unusual traffic patterns: None</p>
              </div>

              <h2>Traffic Heatmap</h2>
              <canvas id="heatmapChart"></canvas>
            </section>

            {/* Export Section */}
            <section className="export-section">
              <button id="exportPDF">Export as PDF</button>
              <button id="exportCSV">Export as CSV</button>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
