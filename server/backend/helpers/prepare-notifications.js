function formatTimestamp(timestamp) {
    const date = new Date(timestamp || Date.now());
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

// Helper function to determine severity based on context
function determineSeverity(xssAlert) {
    // Simple algorithm to determine severity based on available data
    let severity = "Medium";

    // Higher severity if auth cookies or sensitive paths are found
    if (xssAlert.cookies &&
        (xssAlert.cookies.includes("auth") ||
            xssAlert.cookies.includes("session") ||
            xssAlert.cookies.includes("token"))) {
        severity = "High";
    }

    // Higher severity if in admin/dashboard paths
    if (xssAlert.location.href.match(/admin|dashboard|account|profile|payment/i)) {
        severity = "High";
    }

    // Critical if both conditions are met
    if (severity === "High" && xssAlert.cookies &&
        (xssAlert.cookies.includes("auth") || xssAlert.location.href.match(/admin|dashboard/i))) {
        severity = "Critical";
    }

    return severity;
}

// Helper function to truncate long strings
function truncate(str, maxLength = 100) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * Prepares a rich Discord webhook message for XSS alerts
 * @param {Object} xssAlert - The XSS alert data
 * @returns {Object} Discord webhook message object
 */
function prepareDiscordMessage(xssAlert) {
    const severity = determineSeverity(xssAlert);
    const timestamp = formatTimestamp(xssAlert.timestamp);

    // Color mapping (Discord uses decimal color codes)
    const colorMap = {
        "Low": 5814783,      // Blue
        "Medium": 16776960,  // Yellow
        "High": 16744192,    // Orange
        "Critical": 16711680 // Red
    };

    return {
        content: `🚨 **New XSS Vulnerability Detected** 🚨`,
        embeds: [{
            title: `XSS Alert: ${xssAlert.id}`,
            color: colorMap[severity] || colorMap["Medium"],
            fields: [
                {
                    name: "🔗 Vulnerable URL",
                    value: `\`\`\`${truncate(xssAlert.location.href)}\`\`\``,
                    inline: false
                },
                {
                    name: "⚠️ Severity",
                    value: severity,
                    inline: true
                },
                {
                    name: "⏰ Timestamp",
                    value: timestamp,
                    inline: true
                },
                {
                    name: "🌐 Origin",
                    value: `\`${xssAlert.location.origin}\``,
                    inline: true
                },
                {
                    name: "↩️ Referer",
                    value: `\`${truncate(xssAlert.document.referrer || "N/A")}\``,
                    inline: true
                },
                {
                    name: "🔍 User Agent",
                    value: `\`\`\`${truncate(xssAlert.userAgent)}\`\`\``,
                    inline: false
                },
                {
                    name: "🍪 Cookies",
                    value: `\`\`\`${truncate(xssAlert.cookies || "None")}\`\`\``,
                    inline: false
                },
                {
                    name: "🌍 Victim IP",
                    value: `[${xssAlert.ip}](https://ipinfo.io/${xssAlert.ip})`,
                    inline: true
                }
            ],
            footer: {
                text: "XSSpecter • XSS Alert"
            },
            timestamp: new Date().toISOString()
        }]
    };
}

/**
 * Prepares a rich Slack webhook message for XSS alerts
 * @param {Object} xssAlert - The XSS alert data
 * @returns {Object} Slack webhook message object
 */
function prepareSlackMessage(xssAlert) {
    const severity = determineSeverity(xssAlert);
    const timestamp = formatTimestamp(xssAlert.timestamp);

    // Color mapping for Slack
    const colorMap = {
        "Low": "#5865F2",    // Blue
        "Medium": "#FFCC00", // Yellow
        "High": "#FF8800",   // Orange
        "Critical": "#FF0000" // Red
    };

    return {
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: `🚨 XSS Alert: ${xssAlert.id}`,
                    emoji: true
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Severity:*\n${severity}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Timestamp:*\n${timestamp}`
                    }
                ]
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*🔗 Vulnerable URL:*\n\`${truncate(xssAlert.location.href)}\``
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*🌐 Origin:*\n\`${xssAlert.location.origin}\``
                    },
                    {
                        type: "mrkdwn",
                        text: `*↩️ Referer:*\n\`${truncate(xssAlert.document.referrer || "N/A")}\``
                    }
                ]
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*🔍 User Agent:*\n\`${truncate(xssAlert.userAgent)}\``
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*🍪 Cookies:*\n\`${truncate(xssAlert.cookies || "None")}\``
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*🌍 Victim IP:*\n<https://ipinfo.io/${xssAlert.ip}|${xssAlert.ip}>`
                    },
                    {
                        type: "mrkdwn",
                        text: "*🔐 Action:*\nInvestigate immediately"
                    }
                ]
            },
            {
                type: "divider"
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: "XSSpecter • XSS Alert"
                    }
                ]
            }
        ],
        attachments: [
            {
                color: colorMap[severity] || colorMap["Medium"],
                blocks: []
            }
        ]
    };
}

/**
 * Prepares a rich Telegram webhook message for XSS alerts
 * @param {Object} xssAlert - The XSS alert data
 * @returns {string} Telegram message with Markdown formatting
 */
function prepareTelegramMessage(xssAlert) {
    const severity = determineSeverity(xssAlert);
    const timestamp = formatTimestamp(xssAlert.timestamp);

    // Emoji indicators for severity
    const severityEmoji = {
        "Low": "🔵",
        "Medium": "🟡",
        "High": "🟠",
        "Critical": "🔴"
    };

    const message = `
  🚨 *XSS ALERT: ${xssAlert.id}* 🚨
  
  *Severity:* ${severityEmoji[severity] || "⚠️"} ${severity}
  *Detected:* ${timestamp}
  
  *🔗 Vulnerable URL:*
  \`${truncate(xssAlert.location.href)}\`
  
  *🌐 Origin:* \`${xssAlert.location.origin}\`
  *↩️ Referer:* \`${truncate(xssAlert.document.referrer || "N/A")}\`
  
  *🔍 User Agent:*
  \`${truncate(xssAlert.userAgent)}\`
  
  *🍪 Cookies:*
  \`${truncate(xssAlert.cookies || "None")}\`
  
  *🌍 Victim IP:* [${xssAlert.ip}](https://ipinfo.io/${xssAlert.ip})
  
  ⚠️ *Action Required:* Investigate immediately
    `;

    return message.trim();
}

/**
 * Prepares HTML email content for XSS alerts
 * @param {Object} xssAlert - The XSS alert data
 * @returns {string} HTML formatted email content
 */
function prepareEmailHTML(xssAlert) {
    const severity = determineSeverity(xssAlert);
    const timestamp = formatTimestamp(xssAlert.timestamp);
    
    // Color mapping for email
    const colorMap = {
      "Low": "#5865F2",     // Blue
      "Medium": "#FFCC00",  // Yellow
      "High": "#FF8800",    // Orange
      "Critical": "#FF0000" // Red
    };
    
    const severityColor = colorMap[severity] || colorMap["Medium"];
    
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>XSS Alert: ${xssAlert.id}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333333;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background-color: #2C2F33;
        color: white;
        padding: 15px 20px;
        border-radius: 5px 5px 0 0;
        text-align: center;
      }
      .alert-title {
        margin: 0;
        font-size: 22px;
      }
      .content {
        background-color: #FFFFFF;
        padding: 20px;
        border: 1px solid #E0E0E0;
        border-top: none;
        border-radius: 0 0 5px 5px;
      }
      .severity-badge {
        display: inline-block;
        background-color: ${severityColor};
        color: white;
        padding: 5px 10px;
        border-radius: 3px;
        font-weight: bold;
        margin-bottom: 15px;
      }
      .info-section {
        margin-bottom: 20px;
      }
      .info-row {
        margin-bottom: 10px;
      }
      .info-label {
        font-weight: bold;
        margin-bottom: 3px;
      }
      .info-value {
        background-color: #F5F5F5;
        padding: 8px;
        border-radius: 3px;
        border: 1px solid #E0E0E0;
        word-break: break-all;
        font-family: monospace;
        font-size: 13px;
      }
      .info-value-short {
        display: inline-block;
        background-color: #F5F5F5;
        padding: 3px 8px;
        border-radius: 3px;
        border: 1px solid #E0E0E0;
        font-family: monospace;
        font-size: 13px;
      }
      .info-columns {
        display: table;
        width: 100%;
      }
      .info-column {
        display: table-cell;
        width: 50%;
        padding-right: 10px;
      }
      .footer {
        margin-top: 20px;
        text-align: center;
        font-size: 12px;
        color: #777777;
      }
      .action-button {
        display: inline-block;
        background-color: white;
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 3px;
        font-weight: bold;
        margin-top: 10px;
      }
      hr {
        border: none;
        border-top: 1px solid #E0E0E0;
        margin: 20px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="alert-title">🚨 XSS Alert: ${xssAlert.id}</h1>
      </div>
      <div class="content">
        <div class="info-section">
          <div class="severity-badge">Severity: ${severity}</div>
          <div class="info-columns">
            <div class="info-column">
              <div class="info-label">⏰ Detected:</div>
              <div class="info-value-short">${timestamp}</div>
            </div>
            <div class="info-column">
              <div class="info-label">🌍 Victim IP:</div>
              <div class="info-value-short">
                <a href="https://ipinfo.io/${xssAlert.ip}" target="_blank">${xssAlert.ip}</a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-row">
            <div class="info-label">🔗 Vulnerable URL:</div>
            <div class="info-value">${xssAlert.location.href}</div>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-columns">
            <div class="info-column">
              <div class="info-label">🌐 Origin:</div>
              <div class="info-value">${xssAlert.location.origin}</div>
            </div>
            <div class="info-column">
              <div class="info-label">↩️ Referer:</div>
              <div class="info-value">${xssAlert.document.referrer || "N/A"}</div>
            </div>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-row">
            <div class="info-label">🔍 User Agent:</div>
            <div class="info-value">${xssAlert.userAgent}</div>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-row">
            <div class="info-label">🍪 Cookies:</div>
            <div class="info-value">${xssAlert.cookies || "None"}</div>
          </div>
        </div>
        
        <hr>
        
        <div style="text-align: center;">
          <a href="#" class="action-button">Investigate Now</a>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated security alert. Please take appropriate action immediately.</p>
        <p>XSSpecter - XSS Alert</p>
      </div>
    </div>
  </body>
  </html>
    `;
  }

// Export functions for use
export {
    prepareDiscordMessage,
    prepareSlackMessage,
    prepareTelegramMessage,
    prepareEmailHTML
};