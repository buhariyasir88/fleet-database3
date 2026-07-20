import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Grid,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Avatar,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  DirectionsBoat as VesselIcon,
  Description as ContractIcon,
  Receipt as InvoiceIcon,
  TrendingUp as RevenueIcon,
  Pending as PendingIcon,
  Warning as OverdueIcon,
  Refresh as RefreshIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Speed as UtilizationIcon,
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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalVessels: 0,
    activeVessels: 0,
    soldVessels: 0,
    maintenanceVessels: 0,
    totalClients: 0,
    activeContracts: 0,
    totalContracts: 0,
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
      console.log('Full API Response:', response.data);
      
      // Use the response data directly
      const data = response.data;
      
      // Update stats with all values
      setStats({
        totalVessels: data.totalVessels || 0,
        activeVessels: data.activeVessels || 0,
        soldVessels: data.soldVessels || 0,
        maintenanceVessels: data.maintenanceVessels || 0,
        totalClients: data.totalClients || 0,
        activeContracts: data.activeContracts || 0,
        totalContracts: data.totalContracts || 0,  // ← THIS IS THE KEY FIX
        totalInvoices: data.totalInvoices || 0,
        totalRevenue: data.totalRevenue || 0,
        pendingInvoices: data.pendingInvoices || 0,
        overdueInvoices: data.overdueInvoices || 0,
        paidInvoices: data.paidInvoices || 0,
        submittedInvoices: data.submittedInvoices || 0,
        collectionRate: data.collectionRate || 0,
        ytdUtilization: data.ytdUtilization || 0,
        totalVesselsUtil: data.totalVesselsUtil || 0,
        currentMonth: data.currentMonth || '',
        currentYear: data.currentYear || 0
      });
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      setMonthlyData(months.map(() => Math.floor(Math.random() * 1000) + 500));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  console.log('Current stats.totalContracts:', stats.totalContracts);

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
        {/* Total Vessels */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #f1f5f9',
              p: 3,
              height: 120,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)', color: '#1976d2', width: 44, height: 44, borderRadius: 2 }}>
                <VesselIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem' }}>
                  Total Vessels
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.5rem', lineHeight: 1.2 }}>
                  {stats.totalVessels}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                  Total fleet
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Active Vessels */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #f1f5f9',
              p: 3,
              height: 120,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', width: 44, height: 44, borderRadius: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem' }}>
                  Active Vessels
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.5rem', lineHeight: 1.2 }}>
                  {stats.activeVessels}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                  {stats.soldVessels || 0} sold · {stats.maintenanceVessels || 0} in maintenance
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Total Contracts - FIXED */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #f1f5f9',
              p: 3,
              height: 120,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              bgcolor: '#f8f4ff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', width: 44, height: 44, borderRadius: 2 }}>
                <ContractIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem' }}>
                  Total Contracts
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#7c3aed', fontSize: '1.5rem', lineHeight: 1.2 }}>
                  {stats.totalContracts !== undefined ? stats.totalContracts : 0}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Total Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #f1f5f9',
              p: 3,
              height: 120,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32', width: 44, height: 44, borderRadius: 2 }}>
                <RevenueIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem' }}>
                  Total Revenue
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.3rem', lineHeight: 1.2 }}>
                  RM {stats.totalRevenue?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                  All time
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Invoice Stats - 4 Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #f1f5f9',
              p: 2.5,
              height: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: 44, height: 44, borderRadius: 2 }}>
                <InvoiceIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.6rem' }}>
                  Total Invoices
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.5rem', lineHeight: 1.2 }}>
                  {stats.totalInvoices}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem' }}>
                  {stats.paidInvoices || 0} paid · {stats.submittedInvoices || 0} submitted
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #f1f5f9',
              p: 2.5,
              height: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: stats.collectionRate >= 80 ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)', color: stats.collectionRate >= 80 ? '#2e7d32' : '#d32f2f', width: 44, height: 44, borderRadius: 2 }}>
                {stats.collectionRate >= 80 ? <CheckCircleIcon sx={{ fontSize: 22 }} /> : <TrendingDownIcon sx={{ fontSize: 22 }} />}
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.6rem' }}>
                  Collection Rate
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.5rem', lineHeight: 1.2 }}>
                  {stats.collectionRate?.toFixed(1) || 0}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem' }}>
                  {stats.paidInvoices || 0} paid
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #f1f5f9',
              p: 2.5,
              height: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: 44, height: 44, borderRadius: 2 }}>
                <PendingIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.6rem' }}>
                  Pending Invoices
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.5rem', lineHeight: 1.2 }}>
                  {stats.submittedInvoices || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem' }}>
                  Awaiting payment
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #f1f5f9',
              p: 2.5,
              height: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: 44, height: 44, borderRadius: 2 }}>
                <OverdueIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.6rem' }}>
                  Overdue Invoices
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.5rem', lineHeight: 1.2 }}>
                  {stats.overdueInvoices || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem' }}>
                  Past due
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* YTD Utilization */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #f1f5f9',
              p: 2.5,
              height: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: stats.ytdUtilization >= 80 ? 'rgba(46, 125, 50, 0.1)' : stats.ytdUtilization >= 60 ? 'rgba(237, 108, 2, 0.1)' : 'rgba(244, 67, 54, 0.1)', 
                color: stats.ytdUtilization >= 80 ? '#2e7d32' : stats.ytdUtilization >= 60 ? '#ed6c02' : '#d32f2f', 
                width: 44, 
                height: 44, 
                borderRadius: 2 
              }}>
                <UtilizationIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.6rem' }}>
                  YTD Utilization
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.5rem', lineHeight: 1.2 }}>
                  {stats.ytdUtilization?.toFixed(1) || 0}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
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