/**
 * Branded HTML email template for Shrinkly performance reports.
 * Matches the existing Shrinkly email design (purple gradient header, Segoe UI, etc.)
 */

const reportEmailTemplate = (username, reportType, summary, frontendUrl) => {
  const typeLabel = reportType.charAt(0).toUpperCase() + reportType.slice(1);

  // Calculate device percentages
  const totalDeviceClicks =
    summary.deviceBreakdown.desktop +
    summary.deviceBreakdown.mobile +
    summary.deviceBreakdown.tablet;
  const desktopPct = totalDeviceClicks > 0 ? Math.round((summary.deviceBreakdown.desktop / totalDeviceClicks) * 100) : 0;
  const mobilePct = totalDeviceClicks > 0 ? Math.round((summary.deviceBreakdown.mobile / totalDeviceClicks) * 100) : 0;
  const tabletPct = totalDeviceClicks > 0 ? Math.round((summary.deviceBreakdown.tablet / totalDeviceClicks) * 100) : 0;

  // Build comparison section if data is available
  let comparisonHtml = "";
  if (summary.comparison && summary.comparison.clickChange !== null) {
    const change = summary.comparison.clickChange;
    const isPositive = change >= 0;
    const arrow = isPositive ? "↑" : "↓";
    const color = isPositive ? "#2e7d32" : "#c62828";
    const bgColor = isPositive ? "#e8f5e9" : "#ffebee";
    comparisonHtml = `
      <div style="background:${bgColor};border-radius:8px;padding:16px 20px;margin:24px 0;text-align:center;">
        <span style="font-size:14px;color:${color};font-weight:600;">
          ${arrow} ${Math.abs(change)}% compared to previous period
        </span>
        <div style="font-size:12px;color:#888;margin-top:4px;">
          Previous period: ${summary.comparison.previousClicks} clicks
        </div>
      </div>
    `;
  }

  // Build referrer rows
  let referrerHtml = "";
  if (summary.referrerBreakdown && summary.referrerBreakdown.length > 0) {
    const referrerRows = summary.referrerBreakdown
      .map(
        (r) => `
        <tr>
          <td style="padding:8px 12px;font-size:13px;color:#555;border-bottom:1px solid #f0f0f0;">${r.referrer}</td>
          <td style="padding:8px 12px;font-size:13px;color:#512da8;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">${r.clicks}</td>
        </tr>`
      )
      .join("");
    referrerHtml = `
      <div style="margin:24px 0;">
        <h3 style="font-size:16px;color:#1a1a2e;margin:0 0 12px;">🌐 Top Referrers</h3>
        <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden;">
          <thead>
            <tr>
              <th style="padding:10px 12px;font-size:12px;color:#999;text-align:left;border-bottom:2px solid #f0f0f0;">Source</th>
              <th style="padding:10px 12px;font-size:12px;color:#999;text-align:right;border-bottom:2px solid #f0f0f0;">Clicks</th>
            </tr>
          </thead>
          <tbody>
            ${referrerRows}
          </tbody>
        </table>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
</head>
<body style="font-family:'Segoe UI',sans-serif;background:#f4f6f9;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#512da8,#7b4fd4);padding:36px 40px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:1px;">🔗 Shrinkly</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Your ${typeLabel} Performance Report</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">

      <!-- Greeting -->
      <h2 style="font-size:22px;margin:0 0 8px;color:#1a1a2e;">Hi ${username} 👋</h2>
      <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 24px;">
        Here's your ${typeLabel.toLowerCase()} performance summary. Keep up the great work!
      </p>

      <!-- Summary Cards (2x2 grid using tables for email safety) -->
      <table style="width:100%;border-collapse:separate;border-spacing:8px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;background:#f5f0ff;border-radius:10px;padding:20px;text-align:center;">
            <div style="font-size:32px;font-weight:700;color:#512da8;">${summary.totalLinks}</div>
            <div style="font-size:13px;color:#666;margin-top:4px;">Total Links</div>
          </td>
          <td style="width:50%;background:#f5f0ff;border-radius:10px;padding:20px;text-align:center;">
            <div style="font-size:32px;font-weight:700;color:#512da8;">${summary.totalClicks}</div>
            <div style="font-size:13px;color:#666;margin-top:4px;">Total Clicks</div>
          </td>
        </tr>
        <tr>
          <td style="width:50%;background:#f5f0ff;border-radius:10px;padding:20px;text-align:center;">
            <div style="font-size:32px;font-weight:700;color:#512da8;">${summary.activeLinks}</div>
            <div style="font-size:13px;color:#666;margin-top:4px;">Active Links</div>
          </td>
          <td style="width:50%;background:#f5f0ff;border-radius:10px;padding:20px;text-align:center;">
            <div style="font-size:32px;font-weight:700;color:#512da8;">${summary.qrScans}</div>
            <div style="font-size:13px;color:#666;margin-top:4px;">QR Scans</div>
          </td>
        </tr>
      </table>

      ${comparisonHtml}

      <!-- Top Performing Link -->
      <div style="margin:24px 0;">
        <h3 style="font-size:16px;color:#1a1a2e;margin:0 0 12px;">🏆 Top Performing Link</h3>
        <div style="background:#f8f4ff;border-left:4px solid #512da8;padding:14px 16px;border-radius:0 8px 8px 0;">
          <div style="font-size:15px;font-weight:600;color:#512da8;">/${summary.topLink.shortCode}</div>
          <div style="font-size:13px;color:#666;margin-top:4px;">${summary.topLink.clicks} clicks this period</div>
        </div>
      </div>

      <!-- Top Location -->
      <div style="margin:24px 0;">
        <h3 style="font-size:16px;color:#1a1a2e;margin:0 0 12px;">📍 Top Location</h3>
        <div style="background:#f8f4ff;border-left:4px solid #7b4fd4;padding:14px 16px;border-radius:0 8px 8px 0;">
          <div style="font-size:15px;font-weight:600;color:#333;">${summary.topCountry.country}</div>
          <div style="font-size:13px;color:#666;margin-top:4px;">
            ${summary.topCity.city !== "N/A" ? summary.topCity.city + " · " : ""}${summary.topCountry.clicks} clicks
          </div>
        </div>
      </div>

      <!-- Device Breakdown -->
      <div style="margin:24px 0;">
        <h3 style="font-size:16px;color:#1a1a2e;margin:0 0 12px;">📱 Device Breakdown</h3>
        <table style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 0;">
              <div style="font-size:13px;color:#555;margin-bottom:6px;">🖥 Desktop — ${desktopPct}%</div>
              <div style="background:#eee;border-radius:4px;height:8px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#512da8,#7b4fd4);height:8px;width:${desktopPct}%;border-radius:4px;"></div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;">
              <div style="font-size:13px;color:#555;margin-bottom:6px;">📱 Mobile — ${mobilePct}%</div>
              <div style="background:#eee;border-radius:4px;height:8px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#512da8,#7b4fd4);height:8px;width:${mobilePct}%;border-radius:4px;"></div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;">
              <div style="font-size:13px;color:#555;margin-bottom:6px;">📟 Tablet — ${tabletPct}%</div>
              <div style="background:#eee;border-radius:4px;height:8px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#512da8,#7b4fd4);height:8px;width:${tabletPct}%;border-radius:4px;"></div>
              </div>
            </td>
          </tr>
        </table>
      </div>

      ${referrerHtml}

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0 0;">
        <a href="${frontendUrl}/analytics" style="display:inline-block;background:linear-gradient(135deg,#512da8,#7b4fd4);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;letter-spacing:0.5px;">
          View Full Analytics
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 40px;font-size:12px;color:#999;border-top:1px solid #f0f0f0;">
      © ${new Date().getFullYear()} Shrinkly. All rights reserved.
    </div>

  </div>
</body>
</html>`;
};

module.exports = { reportEmailTemplate };
