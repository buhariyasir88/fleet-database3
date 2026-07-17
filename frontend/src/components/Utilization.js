import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Snackbar,
  Alert,
  Grid,
  Avatar,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  Tooltip,
  Fade,
  alpha,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Speed as UtilizationIcon,
  Save as SaveIcon,
  ViewAgenda as GroupByIcon,
  ViewList as ViewListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  FilterList as FilterListIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const API_URL = 'http://localhost:5005/api';

function Utilization() {
  const [utilizations, setUtilizations] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUtilization, setEditingUtilization] = useState(null);
  const [groupBy, setGroupBy] = useState('none');
  const [filterVessel, setFilterVessel] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [budgetTableOpen, setBudgetTableOpen] = useState(true);
  const [formData, setFormData] = useState({
    vessel: '',
    month: '',
    year: new Date().getFullYear(),
    budgetDays: '',
    actualDays: '',
    remarks: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    fetchData();
  }, [filterYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [utilRes, vesselsRes] = await Promise.all([
        axios.get(`${API_URL}/utilizations`),
        axios.get(`${API_URL}/vessels`),
      ]);
      setUtilizations(utilRes.data);
      setVessels(vesselsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Error fetching data. Make sure backend is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  const handleOpenDialog = (util = null) => {
    if (util) {
      setEditingUtilization(util);
      setFormData({
        vessel: util.vessel?._id || '',
        month: util.month || '',
        year: util.year || new Date().getFullYear(),
        budgetDays: util.budgetDays || '',
        actualDays: util.actualDays || '',
        remarks: util.remarks || '',
      });
      setOpenDialog(true);
      return;
    }
    setEditingUtilization(null);
    setFormData({
      vessel: '',
      month: '',
      year: new Date().getFullYear(),
      budgetDays: '',
      actualDays: '',
      remarks: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUtilization(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      if (!formData.vessel || !formData.month || !formData.year || !formData.budgetDays || !formData.actualDays) {
        showSnackbar('Please fill in all required fields', 'error');
        setSaving(false);
        return;
      }

      const utilizationData = {
        vessel: formData.vessel,
        month: formData.month,
        year: parseInt(formData.year),
        budgetDays: parseFloat(formData.budgetDays),
        actualDays: parseFloat(formData.actualDays),
        remarks: formData.remarks || '',
      };

      if (editingUtilization) {
        await axios.put(`${API_URL}/utilizations/${editingUtilization._id}`, utilizationData);
        showSnackbar('Utilization updated successfully! 🎉');
      } else {
        const existing = utilizations.find(u => 
          u.vessel?._id === formData.vessel && 
          u.month === formData.month && 
          u.year === parseInt(formData.year)
        );
        if (existing) {
          showSnackbar('A record for this vessel and month already exists.', 'warning');
          setSaving(false);
          return;
        }
        await axios.post(`${API_URL}/utilizations`, utilizationData);
        showSnackbar('Utilization record created successfully! 🎉');
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving utilization:', error);
      showSnackbar(error.response?.data?.error || 'Error saving utilization.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`${API_URL}/utilizations/${id}`);
        showSnackbar('Record deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting record:', error);
        showSnackbar('Error deleting record', 'error');
      }
    }
  };

  // ============ Get days in month ============
  const getDaysInMonth = (month, year) => {
    return new Date(year, months.indexOf(month) + 1, 0).getDate();
  };

  // ============ MTD Utilization Calculation ============
  const calculateUtilizationMTD = (actualDays, month, year, vesselCount = 1) => {
    if (!month || !year) return 0;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    
    if (month === currentMonth && year === currentYear) {
      const daysElapsed = today.getDate();
      if (daysElapsed === 0) return 0;
      const totalPossibleDays = vesselCount * daysElapsed;
      if (totalPossibleDays === 0) return 0;
      return Math.min(100, (actualDays / totalPossibleDays) * 100);
    }
    
    const daysInMonth = getDaysInMonth(month, year);
    if (daysInMonth === 0) return 0;
    const totalPossibleDays = vesselCount * daysInMonth;
    if (totalPossibleDays === 0) return 0;
    return Math.min(100, (actualDays / totalPossibleDays) * 100);
  };

  // ============ Single vessel utilization - FIXED ============
  const calculateSingleVesselUtilization = (actualDays, month, year) => {
    if (!month || !year) return 0;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    
    if (month === currentMonth && year === currentYear) {
      const daysElapsed = today.getDate();
      if (daysElapsed === 0) return 0;
      return Math.min(100, (actualDays / daysElapsed) * 100);
    }
    
    const daysInMonth = getDaysInMonth(month, year);
    if (daysInMonth === 0) return 0;
    return Math.min(100, (actualDays / daysInMonth) * 100);
  };

  // ============ Old utilization calculation (for budget comparison only) ============
  const calculateUtilization = (budget, actual) => {
    if (budget === 0) return 0;
    return ((actual / budget) * 100);
  };

  const getUniqueVessels = () => {
    const vesselNames = new Set();
    utilizations.forEach(u => {
      if (u.vessel?.name) {
        vesselNames.add(u.vessel.name);
      }
    });
    return Array.from(vesselNames).sort();
  };

  const getUniqueMonths = () => {
    const monthSet = new Set();
    utilizations.forEach(u => {
      if (u.month && u.year) {
        monthSet.add(`${u.month} ${u.year}`);
      }
    });
    return Array.from(monthSet).sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      if (yearA !== yearB) return yearA - yearB;
      return months.indexOf(monthA) - months.indexOf(monthB);
    });
  };

  const filteredUtilizations = utilizations.filter(u => {
    let matchVessel = true;
    let matchMonth = true;
    let matchYear = true;
    
    if (filterVessel) {
      matchVessel = u.vessel?.name === filterVessel;
    }
    if (filterMonth) {
      matchMonth = `${u.month} ${u.year}` === filterMonth;
    }
    if (filterYear) {
      matchYear = u.year === filterYear;
    }
    
    return matchVessel && matchMonth && matchYear;
  });

  const groupedByVessel = filteredUtilizations.reduce((acc, u) => {
    const vesselName = u.vessel?.name || 'Unknown';
    if (!acc[vesselName]) {
      acc[vesselName] = { budget: 0, actual: 0 };
    }
    acc[vesselName].budget += u.budgetDays || 0;
    acc[vesselName].actual += u.actualDays || 0;
    return acc;
  }, {});

  const groupedByMonth = filteredUtilizations.reduce((acc, u) => {
    const monthKey = `${u.month} ${u.year}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { budget: 0, actual: 0, month: u.month, year: u.year, count: 0 };
    }
    acc[monthKey].budget += u.budgetDays || 0;
    acc[monthKey].actual += u.actualDays || 0;
    acc[monthKey].count += 1;
    return acc;
  }, {});

  const sortedMonthKeys = Object.keys(groupedByMonth).sort((a, b) => {
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    if (yearA !== yearB) return yearA - yearB;
    return months.indexOf(monthA) - months.indexOf(monthB);
  });

  const totalBudget = filteredUtilizations.reduce((sum, u) => sum + (u.budgetDays || 0), 0);
  const totalActual = filteredUtilizations.reduce((sum, u) => sum + (u.actualDays || 0), 0);
  
  // MTD Utilization Calculation
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long' });
  const currentYear = today.getFullYear();
  const daysElapsed = today.getDate();

  // ============ YTD CALCULATION ============
  const yearData = utilizations.filter(u => u.year === filterYear);

  const monthGroups = {};
  yearData.forEach(u => {
    if (!monthGroups[u.month]) {
      monthGroups[u.month] = [];
    }
    monthGroups[u.month].push(u);
  });

  const monthsToInclude = [];
  const currentMonthIndex = today.getMonth();
  const currentMonthName = months[currentMonthIndex];

  for (const month of months) {
    if (filterYear === currentYear) {
      if (months.indexOf(month) < months.indexOf(currentMonthName)) {
        monthsToInclude.push(month);
      }
    } else {
      monthsToInclude.push(month);
    }
  }

  let ytdActual = 0;
  let ytdTotalPossibleDays = 0;

  monthsToInclude.forEach(month => {
    const monthData = monthGroups[month] || [];
    if (monthData.length === 0) return;
    
    const vesselIds = new Set();
    monthData.forEach(u => {
      if (u.vessel) {
        const id = typeof u.vessel === 'string' ? u.vessel : u.vessel._id || u.vessel;
        vesselIds.add(id);
      }
    });
    
    const vesselCount = vesselIds.size || 0;
    if (vesselCount === 0) return;
    
    const daysInMonth = getDaysInMonth(month, filterYear);
    ytdTotalPossibleDays += vesselCount * daysInMonth;
    
    monthData.forEach(u => {
      ytdActual += u.actualDays || 0;
    });
  });

  const ytdUtilization = ytdTotalPossibleDays > 0 
    ? Math.min(100, (ytdActual / ytdTotalPossibleDays) * 100) 
    : 0;

  const ytdVesselSet = new Set();
  yearData.forEach(u => {
    if (u.vessel) {
      const id = typeof u.vessel === 'string' ? u.vessel : u.vessel._id || u.vessel;
      ytdVesselSet.add(id);
    }
  });
  const ytdVesselCount = ytdVesselSet.size;

  // MTD Summary
  const mtdActual = filteredUtilizations
    .filter(u => u.month === currentMonth && u.year === currentYear)
    .reduce((sum, u) => sum + u.actualDays, 0);
  const mtdBudget = filteredUtilizations
    .filter(u => u.month === currentMonth && u.year === currentYear)
    .reduce((sum, u) => sum + u.budgetDays, 0);
  const mtdVariance = mtdActual - mtdBudget;
  const mtdVariancePercent = mtdBudget > 0 ? ((mtdVariance / mtdBudget) * 100) : 0;

  const allMonthsData = months.map(month => {
    const monthKey = `${month} ${filterYear}`;
    const data = groupedByMonth[monthKey] || { budget: 0, actual: 0 };
    const budget = data.budget || 0;
    const actual = data.actual || 0;
    const variance = actual - budget;
    const variancePercent = budget > 0 ? ((variance / budget) * 100) : 0;
    return { month, budget, actual, variance, variancePercent };
  });

  let cumulative = 0;
  const monthlyWithCumulative = allMonthsData.map(item => {
    cumulative += item.actual;
    return { ...item, cumulative };
  });

  const monthlyChartData = {
    labels: sortedMonthKeys,
    datasets: [
      {
        label: 'Budget Days',
        data: sortedMonthKeys.map(k => groupedByMonth[k].budget),
        backgroundColor: 'rgba(25, 118, 210, 0.6)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Actual Days',
        data: sortedMonthKeys.map(k => groupedByMonth[k].actual),
        backgroundColor: 'rgba(76, 175, 80, 0.6)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 11, weight: '600' }, usePointStyle: true, pointStyle: 'circle', padding: 15 },
      },
      title: {
        display: true,
        text: 'Monthly Utilization Trend',
        font: { size: 15, weight: '700' },
        padding: { bottom: 15 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        title: { display: true, text: 'Days', font: { size: 11, weight: '600' } },
      },
      x: { grid: { display: false } },
    },
  };

  const vesselChartData = {
    labels: Object.keys(groupedByVessel),
    datasets: [
      {
        label: 'Budget Days',
        data: Object.values(groupedByVessel).map(d => d.budget),
        backgroundColor: 'rgba(25, 118, 210, 0.6)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Actual Days',
        data: Object.values(groupedByVessel).map(d => d.actual),
        backgroundColor: 'rgba(76, 175, 80, 0.6)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const vesselChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 11, weight: '600' }, usePointStyle: true, pointStyle: 'circle', padding: 15 },
      },
      title: {
        display: true,
        text: 'Vessel Utilization Summary',
        font: { size: 15, weight: '700' },
        padding: { bottom: 15 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        title: { display: true, text: 'Days', font: { size: 11, weight: '600' } },
      },
      x: { grid: { display: false } },
    },
  };

  const uniqueVessels = getUniqueVessels();
  const uniqueMonths = getUniqueMonths();

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ fontFamily: '"Inter", sans-serif' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              color: '#111827', 
              mb: 0.5,
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Utilization
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6B7280',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Monitor vessel utilization performance against budget
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            borderRadius: 2, 
            textTransform: 'none',
            px: 4,
            py: 1.2,
            fontWeight: 600,
            fontFamily: '"Inter", sans-serif',
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
            }
          }}
        >
          Add Utilization
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #f0f2f5',
              p: 2.5,
              height: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                borderColor: 'transparent',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  color: '#1976d2',
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                }}
              >
                <UtilizationIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontSize: '0.6rem',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Total Vessels
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#111827',
                    lineHeight: 1.2,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {Object.keys(groupedByVessel).length}
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
              border: '1px solid #f0f2f5',
              p: 2.5,
              height: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                borderColor: 'transparent',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(46, 125, 50, 0.1)',
                  color: '#2e7d32',
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                }}
              >
                <CalendarIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontSize: '0.6rem',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Total Budget Days
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#2e7d32',
                    lineHeight: 1.2,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {totalBudget.toFixed(1)}d
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
              border: '1px solid #f0f2f5',
              p: 2.5,
              height: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                borderColor: 'transparent',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(230, 81, 0, 0.1)',
                  color: '#e65100',
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontSize: '0.6rem',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Total Actual Days
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#e65100',
                    lineHeight: 1.2,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {totalActual.toFixed(1)}d
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* YTD UTILIZATION CARD */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #f0f2f5',
              p: 2.5,
              height: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                borderColor: 'transparent',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: ytdUtilization >= 80 ? 'rgba(46, 125, 50, 0.1)' : ytdUtilization >= 60 ? 'rgba(255, 152, 0, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                  color: ytdUtilization >= 80 ? '#2e7d32' : ytdUtilization >= 60 ? '#ed6c02' : '#d32f2f',
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                }}
              >
                <CalculateIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontSize: '0.6rem',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  YTD Utilization ({filterYear})
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: ytdUtilization >= 80 ? '#2e7d32' : ytdUtilization >= 60 ? '#ed6c02' : '#d32f2f',
                    lineHeight: 1.2,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {ytdUtilization.toFixed(1)}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    fontSize: '0.55rem',
                    display: 'block',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {ytdActual.toFixed(1)}d / {ytdTotalPossibleDays.toFixed(1)}d days
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* MTD Summary */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid #f0f2f5',
          p: 3,
          mb: 3,
          bgcolor: '#F9FAFB',
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600, 
            color: '#111827', 
            mb: 1.5,
            fontFamily: '"Inter", sans-serif',
          }}
        >
          <CalendarIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />
          MTD (Month-to-Date): {currentMonth} {currentYear} - Day {daysElapsed} of {new Date(currentYear, today.getMonth() + 1, 0).getDate()}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={3}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>Actual Days</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', fontFamily: '"Inter", sans-serif' }}>
              {mtdActual.toFixed(1)}d
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>Budget Days</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', fontFamily: '"Inter", sans-serif' }}>
              {mtdBudget.toFixed(1)}d
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>YTD Utilization</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: ytdUtilization >= 80 ? '#2e7d32' : ytdUtilization >= 60 ? '#ed6c02' : '#d32f2f', fontFamily: '"Inter", sans-serif' }}>
              {ytdUtilization.toFixed(1)}%
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>Variance</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: mtdVariance >= 0 ? '#2e7d32' : '#d32f2f', fontFamily: '"Inter", sans-serif' }}>
                {mtdVariance >= 0 ? '+' : ''}{mtdVariance.toFixed(1)}d
              </Typography>
              <Chip
                label={`${mtdVariancePercent.toFixed(1)}%`}
                size="small"
                color={mtdVariancePercent >= 0 ? 'success' : 'error'}
                sx={{ fontWeight: 600, fontFamily: '"Inter", sans-serif' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Charts Section */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: 3,
        mb: 4,
        '@media (max-width: 900px)': {
          gridTemplateColumns: '1fr',
        }
      }}>
        {Object.keys(groupedByMonth).length > 0 && (
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            height: 380,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                textAlign: 'center', 
                mb: 1, 
                fontFamily: '"Inter", sans-serif',
                color: '#111827',
              }}
            >
              Monthly Utilization Trend
            </Typography>
            <Box sx={{ flex: 1, minHeight: 300, width: '100%' }}>
              <Bar data={monthlyChartData} options={monthlyChartOptions} />
            </Box>
          </Paper>
        )}
        {Object.keys(groupedByVessel).length > 0 && (
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            height: 380,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                textAlign: 'center', 
                mb: 1, 
                fontFamily: '"Inter", sans-serif',
                color: '#111827',
              }}
            >
              Vessel Utilization Summary
            </Typography>
            <Box sx={{ flex: 1, minHeight: 300, width: '100%' }}>
              <Bar data={vesselChartData} options={vesselChartOptions} />
            </Box>
          </Paper>
        )}
      </Box>

      {/* Budget Table - View Only */}
      <Paper sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #f0f2f5' }}>
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            bgcolor: '#F9FAFB',
            borderBottom: budgetTableOpen ? '1px solid #E5E7EB' : 'none',
            '&:hover': { bgcolor: '#F3F4F6' },
          }}
          onClick={() => setBudgetTableOpen(!budgetTableOpen)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', fontFamily: '"Inter", sans-serif' }}>
              Monthly Budget vs Actual Comparison - {filterYear}
            </Typography>
            <Chip 
              label={`${allMonthsData.filter(m => m.budget > 0 || m.actual > 0).length} months active`} 
              size="small" 
              color="primary" 
              sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 100 }} onClick={(e) => e.stopPropagation()}>
              <Select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                sx={{ borderRadius: 2, bgcolor: 'white', fontFamily: '"Inter", sans-serif' }}
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton>
              {budgetTableOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
        
        <Collapse in={budgetTableOpen}>
          <Box sx={{ p: 2 }}>
            <TableContainer sx={{ borderRadius: 2, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Month</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Budget Days</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Actual Days</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Variance (d)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Variance (%)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Cumulative Days</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyWithCumulative.map((item, index) => {
                    const isCurrentMonth = item.month === currentMonth && filterYear === currentYear;
                    return (
                      <TableRow 
                        key={item.month} 
                        hover
                        sx={{ 
                          '&:hover': { bgcolor: '#F9FAFB' },
                          transition: 'background-color 0.2s',
                          borderBottom: index < monthlyWithCumulative.length - 1 ? '1px solid #F3F4F6' : 'none',
                          bgcolor: isCurrentMonth ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                        }}
                      >
                        <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', fontWeight: 500, color: '#111827', fontSize: '0.8rem' }}>
                          {item.month}
                          {isCurrentMonth && <Chip label="MTD" size="small" color="info" sx={{ ml: 1, fontFamily: '"Inter", sans-serif' }} />}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>
                          {item.budget.toFixed(1)}d
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>
                          {item.actual.toFixed(1)}d
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: item.variance >= 0 ? '#2e7d32' : '#d32f2f', fontSize: '0.8rem', fontWeight: 500 }}>
                          {item.variance >= 0 ? '+' : ''}{item.variance.toFixed(1)}d
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none' }}>
                          <Chip
                            label={`${item.variancePercent.toFixed(1)}%`}
                            color={item.variancePercent >= 0 ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#111827', fontSize: '0.8rem', fontWeight: 500 }}>
                          {item.cumulative.toFixed(1)}d
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Collapse>
      </Paper>

      {/* ============ FILTER BAR ============ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ fontFamily: '"Inter", sans-serif' }}>Filter by Month</InputLabel>
            <Select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              label="Filter by Month"
              sx={{ 
                borderRadius: 2,
                bgcolor: '#F9FAFB',
                fontFamily: '"Inter", sans-serif',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&:hover': { bgcolor: '#F3F4F6' },
              }}
            >
              <MenuItem value="">All Months</MenuItem>
              {uniqueMonths.map((month) => (
                <MenuItem key={month} value={month}>{month}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ fontFamily: '"Inter", sans-serif' }}>Filter by Vessel</InputLabel>
            <Select
              value={filterVessel}
              onChange={(e) => setFilterVessel(e.target.value)}
              label="Filter by Vessel"
              sx={{ 
                borderRadius: 2,
                bgcolor: '#F9FAFB',
                fontFamily: '"Inter", sans-serif',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&:hover': { bgcolor: '#F3F4F6' },
              }}
            >
              <MenuItem value="">All Vessels</MenuItem>
              {uniqueVessels.map((vessel) => (
                <MenuItem key={vessel} value={vessel}>{vessel}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {(filterMonth || filterVessel) && (
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => { setFilterMonth(''); setFilterVessel(''); }}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                fontFamily: '"Inter", sans-serif',
                borderColor: '#E5E7EB',
                color: '#6B7280',
                '&:hover': { borderColor: '#1976d2', color: '#1976d2' }
              }}
            >
              Clear Filters
            </Button>
          )}

          <ToggleButtonGroup
            value={groupBy}
            exclusive
            onChange={(e, val) => setGroupBy(val || 'none')}
            size="small"
          >
            <ToggleButton value="none" sx={{ borderRadius: 2, fontFamily: '"Inter", sans-serif' }}>
              <ViewListIcon /> All
            </ToggleButton>
            <ToggleButton value="month" sx={{ borderRadius: 2, fontFamily: '"Inter", sans-serif' }}>
              <GroupByIcon /> Month
            </ToggleButton>
            <ToggleButton value="vessel" sx={{ borderRadius: 2, fontFamily: '"Inter", sans-serif' }}>
              <GroupByIcon /> Vessel
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* ============ GROUP BY VESSEL - FIXED ============ */}
      {groupBy === 'vessel' ? (
        <Box>
          {Object.keys(groupedByVessel).sort().map(vesselName => {
            const vesselData = groupedByVessel[vesselName];
            
            // Calculate average utilization across all months for this vessel
            const vesselMonths = filteredUtilizations.filter(u => u.vessel?.name === vesselName);
            let totalUtilization = 0;
            let monthCount = 0;
            
            vesselMonths.forEach(u => {
              const util = calculateSingleVesselUtilization(u.actualDays, u.month, u.year);
              totalUtilization += util;
              monthCount++;
            });
            
            const averageUtilization = monthCount > 0 ? (totalUtilization / monthCount) : 0;
            
            return (
              <Box key={vesselName} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={`${vesselName} - ${averageUtilization.toFixed(1)}%`}
                    color={averageUtilization >= 80 ? 'success' : averageUtilization >= 60 ? 'warning' : 'error'}
                    sx={{ 
                      fontWeight: 600,
                      fontFamily: '"Inter", sans-serif',
                      borderRadius: 1,
                      py: 1,
                    }}
                  />
                </Box>

                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    borderRadius: 3, 
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    border: 'none',
                  }}
                >
                  <Table sx={{ borderCollapse: 'collapse' }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Month</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Year</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Budget Days</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Actual Days</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Utilization</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Variance</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Remarks</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUtilizations
                        .filter(u => u.vessel?.name === vesselName)
                        .sort((a, b) => {
                          const monthOrder = months.indexOf(a.month) - months.indexOf(b.month);
                          if (monthOrder !== 0) return monthOrder;
                          return a.year - b.year;
                        })
                        .map((u, index) => {
                          const util = calculateSingleVesselUtilization(u.actualDays, u.month, u.year);
                          const variance = u.actualDays - u.budgetDays;
                          const vesselMonthCount = filteredUtilizations.filter(u => u.vessel?.name === vesselName).length;
                          return (
                            <TableRow 
                              key={u._id} 
                              hover
                              sx={{ 
                                '&:hover': { bgcolor: '#F9FAFB' },
                                transition: 'background-color 0.2s',
                                borderBottom: index < vesselMonthCount - 1 ? '1px solid #F3F4F6' : 'none',
                              }}
                            >
                              <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.month}</TableCell>
                              <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.year}</TableCell>
                              <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.budgetDays.toFixed(1)}d</TableCell>
                              <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.actualDays.toFixed(1)}d</TableCell>
                              <TableCell align="right" sx={{ py: 2, border: 'none' }}>
                                <Chip 
                                  label={`${util.toFixed(1)}%`}
                                  color={util >= 80 ? 'success' : util >= 60 ? 'warning' : 'error'}
                                  size="small"
                                  sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: variance >= 0 ? '#2e7d32' : '#d32f2f', fontSize: '0.8rem', fontWeight: 500 }}>
                                {variance >= 0 ? '+' : ''}{variance.toFixed(1)}d
                              </TableCell>
                              <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.remarks || '-'}</TableCell>
                              <TableCell sx={{ py: 2, border: 'none', textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => handleOpenDialog(u)} sx={{ color: '#6B7280', '&:hover': { color: '#1976d2' } }}>
                                      <EditIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton size="small" onClick={() => handleDelete(u._id)} sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}>
                                      <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>
      ) : groupBy === 'month' ? (
        <Box>
          {Object.keys(groupedByMonth).sort().map(monthKey => {
            const monthData = groupedByMonth[monthKey];
            const vesselCount = monthData.count || 1;
            const utilization = calculateUtilizationMTD(monthData.actual, monthData.month, monthData.year, vesselCount);
            
            return (
              <Box key={monthKey} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={`${monthKey} - ${utilization.toFixed(1)}%`}
                    color={utilization >= 80 ? 'success' : utilization >= 60 ? 'warning' : 'error'}
                    sx={{ 
                      fontWeight: 600,
                      fontFamily: '"Inter", sans-serif',
                      borderRadius: 1,
                      py: 1,
                    }}
                  />
                </Box>

                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    borderRadius: 3, 
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    border: 'none',
                  }}
                >
                  <Table sx={{ borderCollapse: 'collapse' }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Vessel</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Year</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Budget Days</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Actual Days</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Utilization</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Variance</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Remarks</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUtilizations
                        .filter(u => `${u.month} ${u.year}` === monthKey)
                        .sort((a, b) => {
                          const vesselA = a.vessel?.name || 'Unknown';
                          const vesselB = b.vessel?.name || 'Unknown';
                          return vesselA.localeCompare(vesselB);
                        })
                        .map((u, index) => {
                          const util = calculateSingleVesselUtilization(u.actualDays, u.month, u.year);
                          const variance = u.actualDays - u.budgetDays;
                          const monthRecords = filteredUtilizations.filter(u => `${u.month} ${u.year}` === monthKey);
                          return (
                            <TableRow 
                              key={u._id} 
                              hover
                              sx={{ 
                                '&:hover': { bgcolor: '#F9FAFB' },
                                transition: 'background-color 0.2s',
                                borderBottom: index < monthRecords.length - 1 ? '1px solid #F3F4F6' : 'none',
                              }}
                            >
                              <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.vessel?.name || 'Unknown'}</TableCell>
                              <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.year}</TableCell>
                              <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.budgetDays.toFixed(1)}d</TableCell>
                              <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.actualDays.toFixed(1)}d</TableCell>
                              <TableCell align="right" sx={{ py: 2, border: 'none' }}>
                                <Chip 
                                  label={`${util.toFixed(1)}%`}
                                  color={util >= 80 ? 'success' : util >= 60 ? 'warning' : 'error'}
                                  size="small"
                                  sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: variance >= 0 ? '#2e7d32' : '#d32f2f', fontSize: '0.8rem', fontWeight: 500 }}>
                                {variance >= 0 ? '+' : ''}{variance.toFixed(1)}d
                              </TableCell>
                              <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.remarks || '-'}</TableCell>
                              <TableCell sx={{ py: 2, border: 'none', textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => handleOpenDialog(u)} sx={{ color: '#6B7280', '&:hover': { color: '#1976d2' } }}>
                                      <EditIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton size="small" onClick={() => handleDelete(u._id)} sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}>
                                      <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 3, 
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            border: 'none',
          }}
        >
          <Table sx={{ borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Vessel</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Month</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Year</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Budget Days</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Actual Days</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Utilization</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Variance</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Remarks</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUtilizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <UtilizationIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                    <Typography color="textSecondary" variant="h6" sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}>
                      No utilization records found
                    </Typography>
                    <Typography color="textSecondary" variant="body2" sx={{ fontFamily: '"Inter", sans-serif' }}>
                      Click "Add Utilization" to get started
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUtilizations
                  .sort((a, b) => {
                    const monthOrder = months.indexOf(a.month) - months.indexOf(b.month);
                    if (monthOrder !== 0) return monthOrder;
                    return a.year - b.year;
                  })
                  .map((u, index) => {
                    const util = calculateSingleVesselUtilization(u.actualDays, u.month, u.year);
                    const variance = u.actualDays - u.budgetDays;
                    return (
                      <TableRow 
                        key={u._id} 
                        hover
                        sx={{ 
                          '&:hover': { bgcolor: '#F9FAFB' },
                          transition: 'background-color 0.2s',
                          borderBottom: index < filteredUtilizations.length - 1 ? '1px solid #F3F4F6' : 'none',
                        }}
                      >
                        <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', fontWeight: 500, color: '#111827', fontSize: '0.8rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: '#1976d2', borderRadius: 1.5 }}>
                              <UtilizationIcon sx={{ fontSize: 12, color: 'white' }} />
                            </Avatar>
                            {u.vessel?.name || 'N/A'}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.month}</TableCell>
                        <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.year}</TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.budgetDays.toFixed(1)}d</TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.actualDays.toFixed(1)}d</TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none' }}>
                          <Chip 
                            label={`${util.toFixed(1)}%`}
                            color={util >= 80 ? 'success' : util >= 60 ? 'warning' : 'error'}
                            size="small"
                            sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: variance >= 0 ? '#2e7d32' : '#d32f2f', fontSize: '0.8rem', fontWeight: 500 }}>
                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}d
                        </TableCell>
                        <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{u.remarks || '-'}</TableCell>
                        <TableCell sx={{ py: 2, border: 'none', textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenDialog(u)} sx={{ color: '#6B7280', '&:hover': { color: '#1976d2' } }}>
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDelete(u._id)} sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}>
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            border: '1px solid #E5E7EB',
          }
        }}
      >
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          pb: 1.5,
          bgcolor: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ 
              bgcolor: '#1976d2', 
              width: 40, 
              height: 40, 
              borderRadius: '12px',
            }}>
              <UtilizationIcon sx={{ color: 'white', fontSize: 22 }} />
            </Avatar>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#111827', 
                  lineHeight: 1.2,
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {editingUtilization ? 'Edit Utilization' : 'Add Utilization'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#6B7280',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {editingUtilization ? 'Update utilization details' : 'Enter utilization details below'}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={handleCloseDialog} 
            sx={{ 
              color: '#6B7280',
              '&:hover': { bgcolor: alpha('#6B7280', 0.08) }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, pt: 2.5 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#6B7280', 
                  display: 'block', 
                  mb: 0.75,
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Vessel <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="vessel"
                  value={formData.vessel}
                  onChange={handleInputChange}
                  displayEmpty
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: '#F9FAFB',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover': { bgcolor: '#F3F4F6' },
                    '&.Mui-focused': { 
                      bgcolor: 'white',
                      boxShadow: '0 0 0 3px rgba(25,118,210,0.15)',
                      '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #1976d2' },
                    },
                    '& .MuiSelect-select': {
                      fontFamily: '"Inter", sans-serif',
                      color: '#111827',
                      fontSize: '0.875rem',
                      py: 1.5,
                    },
                  }}
                >
                  <MenuItem value="">Select Vessel</MenuItem>
                  {vessels.map((vessel) => (
                    <MenuItem key={vessel._id} value={vessel._id}>{vessel.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#6B7280', 
                  display: 'block', 
                  mb: 0.75,
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Month <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  displayEmpty
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: '#F9FAFB',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover': { bgcolor: '#F3F4F6' },
                    '&.Mui-focused': { 
                      bgcolor: 'white',
                      boxShadow: '0 0 0 3px rgba(25,118,210,0.15)',
                      '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #1976d2' },
                    },
                    '& .MuiSelect-select': {
                      fontFamily: '"Inter", sans-serif',
                      color: '#111827',
                      fontSize: '0.875rem',
                      py: 1.5,
                    },
                  }}
                >
                  <MenuItem value="">Select Month</MenuItem>
                  {months.map((month) => (
                    <MenuItem key={month} value={month}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#6B7280', 
                  display: 'block', 
                  mb: 0.75,
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Year <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="year"
                type="number"
                value={formData.year}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: '#F9FAFB',
                    '& fieldset': { border: 'none' },
                    '&:hover': { bgcolor: '#F3F4F6' },
                    '&.Mui-focused': { 
                      bgcolor: 'white',
                      boxShadow: '0 0 0 3px rgba(25,118,210,0.15)',
                      '& fieldset': { border: '1px solid #1976d2' },
                    }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: '"Inter", sans-serif',
                    color: '#111827',
                    fontSize: '0.875rem',
                    py: 1.5,
                  },
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#6B7280', 
                  display: 'block', 
                  mb: 0.75,
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Budget Days <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="budgetDays"
                type="number"
                value={formData.budgetDays}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 30"
                size="small"
                inputProps={{ step: 0.5 }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: '#F9FAFB',
                    '& fieldset': { border: 'none' },
                    '&:hover': { bgcolor: '#F3F4F6' },
                    '&.Mui-focused': { 
                      bgcolor: 'white',
                      boxShadow: '0 0 0 3px rgba(25,118,210,0.15)',
                      '& fieldset': { border: '1px solid #1976d2' },
                    }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: '"Inter", sans-serif',
                    color: '#111827',
                    fontSize: '0.875rem',
                    py: 1.5,
                  },
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#6B7280', 
                  display: 'block', 
                  mb: 0.75,
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Actual Days <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="actualDays"
                type="number"
                value={formData.actualDays}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 25"
                size="small"
                inputProps={{ step: 0.5 }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: '#F9FAFB',
                    '& fieldset': { border: 'none' },
                    '&:hover': { bgcolor: '#F3F4F6' },
                    '&.Mui-focused': { 
                      bgcolor: 'white',
                      boxShadow: '0 0 0 3px rgba(25,118,210,0.15)',
                      '& fieldset': { border: '1px solid #1976d2' },
                    }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: '"Inter", sans-serif',
                    color: '#111827',
                    fontSize: '0.875rem',
                    py: 1.5,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#6B7280', 
                  display: 'block', 
                  mb: 0.75,
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Remarks
              </Typography>
              <TextField
                fullWidth
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="Why vessel not available?"
                size="small"
                multiline
                rows={2}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: '#F9FAFB',
                    '& fieldset': { border: 'none' },
                    '&:hover': { bgcolor: '#F3F4F6' },
                    '&.Mui-focused': { 
                      bgcolor: 'white',
                      boxShadow: '0 0 0 3px rgba(25,118,210,0.15)',
                      '& fieldset': { border: '1px solid #1976d2' },
                    }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: '"Inter", sans-serif',
                    color: '#111827',
                    fontSize: '0.875rem',
                    py: 1.5,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>Utilization</Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700,
                      color: calculateUtilization(
                        parseFloat(formData.budgetDays) || 0,
                        parseFloat(formData.actualDays) || 0
                      ) >= 80 ? '#2e7d32' : 
                      calculateUtilization(
                        parseFloat(formData.budgetDays) || 0,
                        parseFloat(formData.actualDays) || 0
                      ) >= 60 ? '#ed6c02' : '#d32f2f',
                      fontFamily: '"Inter", sans-serif',
                    }}>
                      {calculateUtilization(
                        parseFloat(formData.budgetDays) || 0,
                        parseFloat(formData.actualDays) || 0
                      ).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>Variance (Days)</Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700,
                      color: (parseFloat(formData.actualDays) || 0) - (parseFloat(formData.budgetDays) || 0) >= 0 ? '#2e7d32' : '#d32f2f',
                      fontFamily: '"Inter", sans-serif',
                    }}>
                      {((parseFloat(formData.actualDays) || 0) - (parseFloat(formData.budgetDays) || 0)) >= 0 ? '+' : ''}
                      {((parseFloat(formData.actualDays) || 0) - (parseFloat(formData.budgetDays) || 0)).toFixed(1)}d
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>Variance (%)</Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700,
                      color: (parseFloat(formData.actualDays) || 0) - (parseFloat(formData.budgetDays) || 0) >= 0 ? '#2e7d32' : '#d32f2f',
                      fontFamily: '"Inter", sans-serif',
                    }}>
                      {(((parseFloat(formData.actualDays) || 0) - (parseFloat(formData.budgetDays) || 0)) / (parseFloat(formData.budgetDays) || 1) * 100) >= 0 ? '+' : ''}
                      {(((parseFloat(formData.actualDays) || 0) - (parseFloat(formData.budgetDays) || 0)) / (parseFloat(formData.budgetDays) || 1) * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          pt: 1,
          gap: 2,
          bgcolor: '#F9FAFB',
          borderTop: '1px solid #E5E7EB',
        }}>
          <Button 
            onClick={handleCloseDialog} 
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              borderColor: '#E5E7EB',
              color: '#6B7280',
              fontFamily: '"Inter", sans-serif',
              '&:hover': { borderColor: '#9CA3AF', bgcolor: 'transparent' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={saving}
            startIcon={<SaveIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 4,
              py: 1,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
              }
            }}
          >
            {saving ? 'Saving...' : editingUtilization ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Utilization;