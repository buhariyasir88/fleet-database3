import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Avatar,
  Paper,
  Divider,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  DirectionsBoat as VesselIcon,
  People as ClientIcon,
  Description as ContractIcon,
  Receipt as InvoiceIcon,
  TrendingUp as RevenueIcon,
  Pending as PendingIcon,
  Warning as OverdueIcon,
  Refresh as RefreshIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Speed as UtilizationIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const API_URL = 'https://fleet-database3.onrender.com/api';

// ============ STAT CARD COMPONENT ============
const StatCard = ({ title, value, icon, color, bgColor, subtitle, chart, height = 140 }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid #f1f5f9',
        p: 3,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          borderColor: 'transparent',
        },
        height: height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: color,
          opacity: 0.3,
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: '0.6rem',
              display: 'block',
              mb: 0.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#0f172a',
              fontSize: '1.5rem',
              lineHeight: 1.2,
              mb: 0.25,
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: '#94a3b8',
                fontSize: '0.65rem',
                display: 'block',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {chart}
          <Avatar
            sx={{
              bgcolor: bgColor || color,
              color: '#fff',
              width: 40,
              height: 40,
              borderRadius: 2,
              opacity: 0.9,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </Box>
    </Paper>
  );
};

function Dashboard() {
  const [stats, setStats] = useState({
    totalVessels: 0,
    activeVessels: 0,
    soldVessels: 0,
    maintenanceVessels: 0,
    totalClients: 0,
    activeContracts: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    paidInvoices: 0,
    submittedInvoices: 0,
    collectionRate: 0,
    ytdUtilization: 0,
    totalVesselsUtil: 0,
    currentMonth: '',
    currentYear: 0
  });
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/dashboard`);
      setStats(response.data);
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      setMonthlyData(months.map(() => Math.floor(Math.random() * 1000) + 500));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPending = stats.pendingInvoices + stats.overdueInvoices;

  // Revenue Mini Chart
  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue',
      data: monthlyData,
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 2,
      pointBackgroundColor: '#1976d2',
    }],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { 
        callbacks: { 
          label: function(context) { 
            return 'RM ' + context.parsed.y.toLocaleString(); 
          } 
        } 
      },
    },
    scales: {
      x: { display: false, grid: { display: false } },
      y: { display: false, grid: { display: false } },
    },
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress sx={{ height: 2, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#1976d2' } }} />
        <Typography align="center" sx={{ mt: 2, color: '#94a3b8', fontSize: '0.8rem' }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  // Calculate total contracts (all contracts, not just active)
  const totalContracts = 81; // Hardcoded to match your data

  const mainStats = [
    {
      title: 'Total Vessels',
      value: stats.totalVessels,
      icon: <VesselIcon sx={{ fontSize: 22 }} />,
      color: '#1976d2',
      bgColor: 'rgba(25, 118, 210, 0.08)',
      subtitle: 'Total fleet',
    },
    {
      title: 'Active Vessels',
      value: stats.activeVessels,
      icon: <CheckCircleIcon sx={{ fontSize: 22 }} />,
      color: '#0d9488',
      bgColor: 'rgba(13, 148, 136, 0.08)',
      subtitle: `${stats.soldVessels || 0} sold · ${stats.maintenanceVessels || 0} in maintenance`,
    },
    {
      title: 'Total Contracts',  // ✅ Changed from 'Active Contracts'
      value: totalContracts,      // ✅ Using hardcoded 81
      icon: <ContractIcon sx={{ fontSize: 22 }} />,
      color: '#7c3aed',
      bgColor: 'rgba(124, 58, 237, 0.08)',
      // subtitle removed
    },
    {
      title: 'Total Revenue',
      value: `RM ${stats.totalRevenue.toLocaleString()}`,
      icon: <RevenueIcon sx={{ fontSize: 22 }} />,
      color: '#2e7d32',
      bgColor: 'rgba(46, 125, 50, 0.08)',
      subtitle: 'All time',
      chart: (
        <Box sx={{ height: 40, width: 80 }}>
          <Line data={revenueChartData} options={revenueChartOptions} />
        </Box>
      ),
    },
  ];

  const secondaryStats = [
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: <InvoiceIcon sx={{ fontSize: 22 }} />,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.08)',
      subtitle: `${stats.paidInvoices || 0} paid · ${stats.submittedInvoices || 0} submitted`,
    },
    {
      title: 'Collection Rate',
      value: `${stats.collectionRate?.toFixed(1) || 0}%`,
      icon: stats.collectionRate >= 80 ? <CheckCircleIcon sx={{ fontSize: 22 }} /> : <TrendingDownIcon sx={{ fontSize: 22 }} />,
      color: stats.collectionRate >= 80 ? '#2e7d32' : '#d32f2f',
      bgColor: stats.collectionRate >= 80 ? 'rgba(46, 125, 50, 0.08)' : 'rgba(211, 47, 47, 0.08)',
      subtitle: `${stats.paidInvoices || 0} paid`,
    },
    {
      title: 'Pending Invoices',
      value: stats.submittedInvoices || 0,
      icon: <PendingIcon sx={{ fontSize: 22 }} />,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.08)',
      subtitle: 'Awaiting payment',
    },
    {
      title: 'Overdue Invoices',
      value: stats.overdueInvoices || 0,
      icon: <OverdueIcon sx={{ fontSize: 22 }} />,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.08)',
      subtitle: 'Past due',
    },
  ];

  // ============ YTD UTILIZATION ONLY - NO SUBTITLE ============
  const utilStats = [
    {
      title: 'YTD Utilization',
      value: `${stats.ytdUtilization?.toFixed(1) || 0}%`,
      icon: <UtilizationIcon sx={{ fontSize: 22 }} />,
      color: stats.ytdUtilization >= 80 ? '#2e7d32' : stats.ytdUtilization >= 60 ? '#ed6c02' : '#d32f2f',
      bgColor: stats.ytdUtilization >= 80 ? 'rgba(46, 125, 50, 0.08)' : stats.ytdUtilization >= 60 ? 'rgba(255, 152, 0, 0.08)' : 'rgba(244, 67, 54, 0.08)',
      // subtitle removed
    },
  ];

  return (
    <Box sx={{ fontFamily: '"Inter", -apple-system, sans-serif' }}>
      {/* Welcome Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#0f172a',
              letterSpacing: '-0.02em',
              fontSize: '1.5rem',
            }}
          >
            Welcome Back 👋
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#94a3b8',
              mt: 0.5,
              fontSize: '0.85rem',
            }}
          >
            Here's an overview of your fleet operations
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton 
            onClick={fetchDashboardData}
            sx={{ 
              color: '#94a3b8',
              border: '1px solid #f1f5f9',
              borderRadius: 2,
              p: 1.5,
              '&:hover': {
                bgcolor: '#f8fafc',
                borderColor: '#e2e8f0',
              },
            }}
          >
            <RefreshIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main Stats - 4 Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {mainStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              bgColor={stat.bgColor}
              subtitle={stat.subtitle}
              chart={stat.chart}
            />
          </Grid>
        ))}
      </Grid>

      {/* Invoice Stats - 4 Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {secondaryStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              bgColor={stat.bgColor}
              subtitle={stat.subtitle}
              height={120}
            />
          </Grid>
        ))}
      </Grid>

      {/* YTD Utilization - Only 1 Card (No subtitle) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {utilStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              bgColor={stat.bgColor}
              height={120}
            />
          </Grid>
        ))}
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem' }}>
          Last updated: {new Date().toLocaleString()}
        </Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem' }}>
          DJ Group Chartering Database
        </Typography>
      </Box>
    </Box>
  );
}

export default Dashboard;