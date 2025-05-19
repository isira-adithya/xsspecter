import express from 'express';
import { PrismaClient } from "@prisma/client";
const router = express.Router();
const prisma = new PrismaClient();

// Dashboard statistics route - will be mounted at /api/dashboard
router.get('/', async (req, res) => {
  try {
    // Fetch and compute all statistics
    const statistics = {
      topLevelStats: await getTopLevelStats(),
      timeBasedAnalytics: await getTimeBasedAnalytics(),
      detailedLists: await getDetailedLists(),
      userActivity: await getUserActivity(),
      technicalDetails: await getTechnicalDetails(),
      notifications: await getNotifications()
    };
    
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Top-Level Statistics Cards
async function getTopLevelStats() {
  // Total Alerts
  const totalAlerts = await prisma.xSSAlert.count();
  
  // New Alerts Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newAlertsToday = await prisma.xSSAlert.count({
    where: {
      timestamp: {
        gte: today
      }
    }
  });
  
  // New Alerts This Week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newAlertsThisWeek = await prisma.xSSAlert.count({
    where: {
      timestamp: {
        gte: oneWeekAgo
      }
    }
  });
  
  // Unique Domains
  const uniqueDomains = await prisma.document.findMany({
    select: {
      domain: true
    },
    distinct: ['domain']
  });
  
  // Active Users
  const activeUsers = await prisma.user.count({
    where: {
      isActive: true
    }
  });
  
  return {
    totalAlerts,
    newAlertsToday,
    newAlertsThisWeek,
    uniqueDomainsCount: uniqueDomains.length,
    activeUsers
  };
}

// Time-Based Analytics
async function getTimeBasedAnalytics() {
  // Alert Trend - Last 30 days
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });
  
  const alertTrend = await Promise.all(dates.map(async (date) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const count = await prisma.xSSAlert.count({
      where: {
        timestamp: {
          gte: date,
          lt: nextDay
        }
      }
    });
    
    return {
      date: date.toISOString().split('T')[0],
      count
    };
  }));
  
  // Domain Distribution - Top 10
  const documents = await prisma.document.findMany({
    select: {
      domain: true
    }
  });
  
  const domainCounts = documents.reduce((acc, doc) => {
    acc[doc.domain] = (acc[doc.domain] || 0) + 1;
    return acc;
  }, {});
  
  const domainDistribution = Object.entries(domainCounts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // User Agent Distribution - Top 10
  const alerts = await prisma.xSSAlert.findMany({
    select: {
      userAgent: true
    }
  });
  
  const userAgentCounts = alerts.reduce((acc, alert) => {
    acc[alert.userAgent] = (acc[alert.userAgent] || 0) + 1;
    return acc;
  }, {});
  
  const userAgentDistribution = Object.entries(userAgentCounts)
    .map(([userAgent, count]) => ({ userAgent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    alertTrend,
    domainDistribution,
    userAgentDistribution
  };
}

// Detailed Tables/Lists
async function getDetailedLists() {
  // Recent Alerts - Latest 10
  const recentAlerts = await prisma.xSSAlert.findMany({
    include: {
      document: true,
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: 10
  });
  
  // Top Vulnerable Domains - Top 10
  const documents = await prisma.document.findMany({
    select: {
      domain: true
    }
  });
  
  const domainCounts = documents.reduce((acc, doc) => {
    acc[doc.domain] = (acc[doc.domain] || 0) + 1;
    return acc;
  }, {});
  
  const vulnerableDomains = Object.entries(domainCounts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Script Sources - Top 10
  const scripts = await prisma.script.findMany({
    select: {
      src: true
    },
    where: {
      src: {
        not: ''
      }
    }
  });
  
  const scriptCounts = scripts.reduce((acc, script) => {
    acc[script.src] = (acc[script.src] || 0) + 1;
    return acc;
  }, {});
  
  const scriptSources = Object.entries(scriptCounts)
    .map(([src, count]) => ({ src, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    recentAlerts: recentAlerts.map(alert => ({
      id: alert.id,
      timestamp: alert.timestamp,
      domain: alert.document?.domain || 'Unknown',
      userAgent: alert.userAgent
    })),
    vulnerableDomains,
    scriptSources
  };
}

// User Activity
async function getUserActivity() {
  // User Login Statistics - Recent 10 logins
  const recentLogins = await prisma.user.findMany({
    where: {
      lastLogin: {
        not: null
      }
    },
    select: {
      id: true,
      username: true,
      lastLogin: true,
      role: true
    },
    orderBy: {
      lastLogin: 'desc'
    },
    take: 10
  });
  
  // Reports Created - Latest 10
  const recentReports = await prisma.report.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });
  
  // User Role Distribution
  const users = await prisma.user.findMany({
    select: {
      role: true
    }
  });
  
  const roleDistribution = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});
  
  return {
    recentLogins,
    recentReports: recentReports.map(report => ({
      id: report.id,
      title: report.title,
      createdAt: report.createdAt,
      alertId: report.alertId
    })),
    roleDistribution: Object.entries(roleDistribution).map(([role, count]) => ({
      role,
      count
    }))
  };
}

// Technical Details
async function getTechnicalDetails() {
  // Permission States
  const permissions = await prisma.permission.findMany({
    select: {
      name: true,
      status: true
    }
  });
  
  const permissionStatusCounts = permissions.reduce((acc, perm) => {
    const key = `${perm.name}:${perm.status}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  
  const permissionStates = Object.entries(permissionStatusCounts)
    .map(([nameStatus, count]) => {
      const [name, status] = nameStatus.split(':');
      return { name, status, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // iFrame vs Direct
  const totalAlerts = await prisma.xSSAlert.count();
  const iframeAlerts = await prisma.xSSAlert.count({
    where: {
      isInIframe: true
    }
  });
  
  const iframePercentage = totalAlerts > 0 ? (iframeAlerts / totalAlerts) * 100 : 0;
  
  // Meta Tag Analysis - Top 10
  const metaTags = await prisma.metaTag.findMany({
    select: {
      name: true,
      content: true
    }
  });
  
  const metaTagCounts = metaTags.reduce((acc, tag) => {
    const key = `${tag.name}:${tag.content}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  
  const metaTagAnalysis = Object.entries(metaTagCounts)
    .map(([nameContent, count]) => {
      const [name, content] = nameContent.split(':');
      return { name, content, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    permissionStates,
    iframeStats: {
      iframeAttacks: iframeAlerts,
      directAttacks: totalAlerts - iframeAlerts,
      iframePercentage: parseFloat(iframePercentage.toFixed(2))
    },
    metaTagAnalysis
  };
}

// Notifications Section
async function getNotifications() {
  // Recent Reports - Latest 5
  const recentReports = await prisma.report.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });
  
  // User Activity - Recent 5 user logins
  const recentLogins = await prisma.user.findMany({
    where: {
      lastLogin: {
        not: null
      }
    },
    select: {
      username: true,
      lastLogin: true
    },
    orderBy: {
      lastLogin: 'desc'
    },
    take: 5
  });
  
  // Unreviewed Alerts - XSSAlerts without associated Report
  const unreviewedAlerts = await prisma.xSSAlert.findMany({
    where: {
      Report: null
    },
    include: {
      document: true
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: 5
  });
  
  return {
    recentReports: recentReports.map(report => ({
      id: report.id,
      title: report.title,
      createdAt: report.createdAt
    })),
    recentUserActivity: recentLogins,
    unreviewedAlerts: unreviewedAlerts.map(alert => ({
      id: alert.id,
      timestamp: alert.timestamp,
      domain: alert.document?.domain || 'Unknown'
    }))
  };
}

export default router;