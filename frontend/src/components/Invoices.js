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
  ViewAgenda as GroupByIcon,
  ViewList as ViewListIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Receipt as InvoiceIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const API_URL = 'http://localhost:5005/api';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [groupBy, setGroupBy] = useState('none');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterVessel, setFilterVessel] = useState('');
  const [monthlyBudgets, setMonthlyBudgets] = useState([]);
  const [savingBudget, setSavingBudget] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [budgetTableOpen, setBudgetTableOpen] = useState(true);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    billingMonth: '',
    billingYear: new Date().getFullYear(),
    contract: '',
    client: '',
    vessel: '',
    dcr: '',
    duration: '',
    mob: '',
    demob: '',
    submissionDate: '',
    paymentStatus: 'Pending',
    remarks: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  const colors = {
    primary: '#0a1628',
    gold: '#c9a84c',
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const statusOptions = ['Pending', 'Submitted', 'Paid', 'Overdue'];

  const getUniqueMonths = () => {
    const monthsSet = new Set();
    invoices.forEach(inv => {
      if (inv.billingMonth && inv.billingYear) {
        const monthKey = `${inv.billingMonth} ${inv.billingYear}`;
        monthsSet.add(monthKey);
      }
    });
    return Array.from(monthsSet).sort();
  };

  const getUniqueVessels = () => {
    const vesselNames = new Set();
    invoices.forEach(inv => {
      if (inv.vessel?.name) {
        vesselNames.add(inv.vessel.name);
      }
    });
    return Array.from(vesselNames).sort();
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, contractsRes, clientsRes, vesselsRes, budgetsRes] = await Promise.all([
        axios.get(`${API_URL}/invoices`),
        axios.get(`${API_URL}/contracts`),
        axios.get(`${API_URL}/clients`),
        axios.get(`${API_URL}/vessels`),
        axios.get(`${API_URL}/budgets`),
      ]);
      setInvoices(invoicesRes.data);
      setContracts(contractsRes.data);
      setClients(clientsRes.data);
      setVessels(vesselsRes.data);
      setMonthlyBudgets(budgetsRes.data);
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

  const handleOpenDialog = (invoice = null) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        invoiceNumber: invoice.invoiceNumber || '',
        billingMonth: invoice.billingMonth || '',
        billingYear: invoice.billingYear || new Date().getFullYear(),
        contract: invoice.contract?._id || '',
        client: invoice.client?._id || '',
        vessel: invoice.vessel?._id || '',
        dcr: invoice.dcr || '',
        duration: invoice.duration || '',
        mob: invoice.mob || '',
        demob: invoice.demob || '',
        submissionDate: invoice.submissionDate?.split('T')[0] || '',
        paymentStatus: invoice.paymentStatus || 'Pending',
        remarks: invoice.remarks || '',
      });
    } else {
      setEditingInvoice(null);
      setFormData({
        invoiceNumber: '',
        billingMonth: '',
        billingYear: new Date().getFullYear(),
        contract: '',
        client: '',
        vessel: '',
        dcr: '',
        duration: '',
        mob: '',
        demob: '',
        submissionDate: '',
        paymentStatus: 'Pending',
        remarks: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingInvoice(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateTotal = () => {
    const dcr = parseFloat(formData.dcr) || 0;
    const duration = parseFloat(formData.duration) || 0;
    const mob = parseFloat(formData.mob) || 0;
    const demob = parseFloat(formData.demob) || 0;
    return (dcr * duration) + mob + demob;
  };

  const calculateExpectedPayment = () => {
    if (!formData.submissionDate) return '';
    const date = new Date(formData.submissionDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      if (!formData.client || !formData.vessel || !formData.dcr || !formData.duration || !formData.submissionDate || !formData.billingMonth) {
        showSnackbar('Please fill in all required fields', 'error');
        setSaving(false);
        return;
      }

      const totalAmount = calculateTotal();
      const expectedPaymentDate = calculateExpectedPayment();

      const invoiceData = {
        invoiceNumber: formData.invoiceNumber || `INV-${Date.now()}`,
        billingMonth: formData.billingMonth,
        billingYear: parseInt(formData.billingYear),
        contract: formData.contract || null,
        client: formData.client,
        vessel: formData.vessel,
        dcr: parseFloat(formData.dcr),
        duration: parseFloat(formData.duration),
        mob: parseFloat(formData.mob) || 0,
        demob: parseFloat(formData.demob) || 0,
        totalAmount: totalAmount,
        submissionDate: formData.submissionDate,
        expectedPaymentDate: expectedPaymentDate,
        paymentStatus: formData.paymentStatus,
        remarks: formData.remarks || '',
      };

      if (editingInvoice) {
        await axios.put(`${API_URL}/invoices/${editingInvoice._id}`, invoiceData);
        showSnackbar('Invoice updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/invoices`, invoiceData);
        showSnackbar('Invoice created successfully! 🎉');
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      showSnackbar(error.response?.data?.error || 'Error saving invoice. Make sure backend is running.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await axios.delete(`${API_URL}/invoices/${id}`);
        showSnackbar('Invoice deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        showSnackbar('Error deleting invoice', 'error');
      }
    }
  };

  // ========== BUDGET FUNCTIONS ==========
  const getBudgetForMonth = (month, year) => {
    const budget = monthlyBudgets.find(b => b.month === month && b.year === year);
    return budget?.budgetedSale || 0;
  };

  const getActualForMonth = (month, year) => {
    const monthKey = `${month} ${year}`;
    let total = 0;
    invoices.forEach(inv => {
      if (`${inv.billingMonth} ${inv.billingYear}` === monthKey) {
        total += inv.totalAmount || 0;
      }
    });
    return total;
  };

  const handleBudgetChange = (month, year, value) => {
    const existingIndex = monthlyBudgets.findIndex(b => b.month === month && b.year === year);
    const updatedBudgets = [...monthlyBudgets];
    
    if (existingIndex !== -1) {
      updatedBudgets[existingIndex].budgetedSale = parseFloat(value) || 0;
    } else {
      updatedBudgets.push({ month, year, budgetedSale: parseFloat(value) || 0 });
    }
    setMonthlyBudgets(updatedBudgets);
  };

  const saveBudget = async (month, year) => {
    try {
      setSavingBudget(true);
      const budget = monthlyBudgets.find(b => b.month === month && b.year === year);
      
      if (!budget || budget.budgetedSale === 0) {
        showSnackbar('Please enter a budget value first', 'error');
        setSavingBudget(false);
        return;
      }

      if (budget._id) {
        await axios.put(`${API_URL}/budgets/${budget._id}`, budget);
      } else {
        await axios.post(`${API_URL}/budgets`, budget);
      }
      showSnackbar('Budget saved successfully! 🎉');
      fetchData();
    } catch (error) {
      console.error('Error saving budget:', error);
      showSnackbar('Error saving budget. Make sure backend is running.', 'error');
    } finally {
      setSavingBudget(false);
    }
  };

  // Calculate totals
  const totalActual = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalBudgeted = monthlyBudgets.reduce((sum, b) => sum + (b.budgetedSale || 0), 0);
  const totalVariance = totalActual - totalBudgeted;
  const totalVariancePercent = totalBudgeted > 0 ? ((totalVariance / totalBudgeted) * 100).toFixed(2) : 0;

  // Get current month for MTD
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  const mtdActual = getActualForMonth(currentMonth, currentYear);
  const mtdBudget = getBudgetForMonth(currentMonth, currentYear);
  const mtdVariance = mtdActual - mtdBudget;
  const mtdVariancePercent = mtdBudget > 0 ? ((mtdVariance / mtdBudget) * 100).toFixed(2) : 0;

  // Generate all 12 months for budget table
  const allMonthsData = months.map(month => {
    const actual = getActualForMonth(month, selectedYear);
    const budget = getBudgetForMonth(month, selectedYear);
    const variance = actual - budget;
    const variancePercent = budget > 0 ? ((variance / budget) * 100).toFixed(2) : 0;
    return { month, actual, budget, variance, variancePercent };
  });

  // Calculate cumulative
  let cumulative = 0;
  const monthlyWithCumulative = allMonthsData.map(item => {
    cumulative += item.actual;
    return { ...item, cumulative };
  });

  const groupedByMonth = invoices.reduce((acc, inv) => {
    const monthKey = `${inv.billingMonth} ${inv.billingYear}`;
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(inv);
    return acc;
  }, {});

  const groupedByVessel = invoices.reduce((acc, inv) => {
    const vesselName = inv.vessel?.name || 'Unknown';
    if (!acc[vesselName]) acc[vesselName] = [];
    acc[vesselName].push(inv);
    return acc;
  }, {});

  const getPaymentStatusColor = (status) => {
    const colors = {
      'Paid': 'success',
      'Pending': 'warning',
      'Overdue': 'error',
      'Submitted': 'info'
    };
    return colors[status] || 'default';
  };

  const filteredInvoices = invoices.filter(inv => {
    const monthKey = `${inv.billingMonth} ${inv.billingYear}`;
    const vesselName = inv.vessel?.name || '';
    
    let matchMonth = true;
    let matchVessel = true;
    
    if (filterMonth) {
      matchMonth = monthKey === filterMonth;
    }
    if (filterVessel) {
      matchVessel = vesselName === filterVessel;
    }
    
    return matchMonth && matchVessel;
  });

  const uniqueMonths = getUniqueMonths();
  const uniqueVessels = getUniqueVessels();

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
            Invoices
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6B7280',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Manage your invoices and track collections
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
          Add Invoice
        </Button>
      </Box>

      {/* ============ STANDARDIZED STATS CARDS ============ */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Invoices */}
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
                <InvoiceIcon sx={{ fontSize: 22 }} />
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
                  Total Invoices
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
                  {invoices.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Total Actual Sale */}
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
                <MoneyIcon sx={{ fontSize: 22 }} />
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
                  Total Actual Sale
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
                  RM {totalActual.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Annual Budget */}
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
                  Annual Budget
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
                  RM {totalBudgeted.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Total Variance - RM */}
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
                  bgcolor: totalVariance >= 0 ? 'rgba(46, 125, 50, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: totalVariance >= 0 ? '#2e7d32' : '#d32f2f',
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                }}
              >
                {totalVariance >= 0 ? <TrendingUpIcon sx={{ fontSize: 22 }} /> : <TrendingDownIcon sx={{ fontSize: 22 }} />}
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
                  Total Variance (RM)
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: totalVariance >= 0 ? '#2e7d32' : '#d32f2f',
                    lineHeight: 1.2,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  RM {totalVariance.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Total Variance - % */}
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
                  bgcolor: totalVariancePercent >= 0 ? 'rgba(46, 125, 50, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: totalVariancePercent >= 0 ? '#2e7d32' : '#d32f2f',
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
                  Total Variance (%)
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: totalVariancePercent >= 0 ? '#2e7d32' : '#d32f2f',
                    lineHeight: 1.2,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {totalVariancePercent}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* MTD Summary - Modern Style */}
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
          MTD (Month-to-Date): {currentMonth} {currentYear}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={4}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>Actual Sale</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', fontFamily: '"Inter", sans-serif' }}>
              RM {mtdActual.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>Budget</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', fontFamily: '"Inter", sans-serif' }}>
              RM {mtdBudget.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>Variance</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: mtdVariance >= 0 ? '#2e7d32' : '#d32f2f', fontFamily: '"Inter", sans-serif' }}>
                RM {mtdVariance.toLocaleString()}
              </Typography>
              <Chip
                label={`${mtdVariancePercent}%`}
                size="small"
                color={mtdVariancePercent >= 0 ? 'success' : 'error'}
                sx={{ fontWeight: 600, fontFamily: '"Inter", sans-serif' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Collapsible Monthly Budget vs Actual Comparison - Modern Style */}
      <Paper 
        sx={{ 
          mb: 3, 
          borderRadius: 3, 
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', 
          overflow: 'hidden',
          border: '1px solid #f0f2f5',
        }}
      >
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
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: '#111827',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Monthly Budget vs Actual Comparison - {selectedYear}
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
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                sx={{ 
                  borderRadius: 2,
                  bgcolor: 'white',
                  fontFamily: '"Inter", sans-serif',
                }}
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
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Budgeted Sale</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Actual Sale</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Variance ($)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Variance (%)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Cumulative Sale</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyWithCumulative.map((item, index) => {
                    const isCurrentMonth = item.month === currentMonth && selectedYear === currentYear;
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
                        <TableCell align="right" sx={{ py: 2, border: 'none' }}>
                          <TextField
                            size="small"
                            type="number"
                            value={item.budget}
                            onChange={(e) => handleBudgetChange(item.month, selectedYear, e.target.value)}
                            sx={{ 
                              width: 120,
                              '& .MuiOutlinedInput-root': { 
                                borderRadius: 2,
                                bgcolor: '#F9FAFB',
                                '& fieldset': { border: 'none' },
                                '&:hover': { bgcolor: '#F3F4F6' },
                              },
                              '& .MuiInputBase-input': {
                                fontFamily: '"Inter", sans-serif',
                                fontSize: '0.8rem',
                                py: 1,
                              },
                            }}
                            inputProps={{ min: 0, step: 100 }}
                            placeholder="Enter budget"
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>
                          RM {item.actual.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: item.variance >= 0 ? '#2e7d32' : '#d32f2f', fontSize: '0.8rem', fontWeight: 500 }}>
                          RM {item.variance.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none' }}>
                          <Chip
                            label={`${item.variancePercent}%`}
                            color={item.variancePercent >= 0 ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#111827', fontSize: '0.8rem', fontWeight: 500 }}>
                          RM {item.cumulative.toLocaleString()}
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2, border: 'none' }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => saveBudget(item.month, selectedYear)}
                            disabled={savingBudget}
                            startIcon={<SaveIcon />}
                            sx={{ 
                              textTransform: 'none', 
                              borderRadius: 2,
                              fontFamily: '"Inter", sans-serif',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              py: 0.5,
                            }}
                          >
                            {savingBudget ? 'Saving...' : 'Save Budget'}
                          </Button>
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

      {/* Filter Bar - Modern Style */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ fontFamily: '"Inter", sans-serif' }}>Month</InputLabel>
            <Select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              label="Month"
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
            <InputLabel sx={{ fontFamily: '"Inter", sans-serif' }}>Vessel</InputLabel>
            <Select
              value={filterVessel}
              onChange={(e) => setFilterVessel(e.target.value)}
              label="Vessel"
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

      {/* ============ MODERN TABLE ============ */}
      {groupBy === 'month' ? (
        <Box>
          {Object.keys(groupedByMonth).sort().map(monthKey => {
            let filteredItems = groupedByMonth[monthKey];
            if (filterVessel) {
              filteredItems = filteredItems.filter(inv => inv.vessel?.name === filterVessel);
            }
            if (filteredItems.length === 0) return null;
            
            return (
              <Box key={monthKey} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={`${monthKey} - Total: RM ${filteredItems.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toLocaleString()}`}
                    sx={{ 
                      fontWeight: 600,
                      fontFamily: '"Inter", sans-serif',
                      borderRadius: 1,
                      bgcolor: '#F9FAFB',
                      color: '#111827',
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
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Invoice #</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Vessel</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>DCR</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Duration</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Total Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Submission Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Expected Payment</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none', textAlign: 'center' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredItems.map((inv, index) => (
                        <TableRow 
                          key={inv._id} 
                          hover
                          sx={{ 
                            '&:hover': { bgcolor: '#F9FAFB' },
                            transition: 'background-color 0.2s',
                            borderBottom: index < filteredItems.length - 1 ? '1px solid #F3F4F6' : 'none',
                          }}
                        >
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', fontWeight: 500, color: '#111827', fontSize: '0.8rem' }}>{inv.invoiceNumber || '-'}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.vessel?.name || 'N/A'}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.client?.name || 'N/A'}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>RM {inv.dcr?.toLocaleString() || 0}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.duration} days</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#111827', fontSize: '0.8rem', fontWeight: 500 }}>RM {inv.totalAmount?.toLocaleString() || 0}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.submissionDate ? new Date(inv.submissionDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.expectedPaymentDate ? new Date(inv.expectedPaymentDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none' }}>
                            <Chip 
                              label={inv.paymentStatus} 
                              color={getPaymentStatusColor(inv.paymentStatus)} 
                              size="small"
                              sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif', borderRadius: '9999px' }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2, border: 'none', textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => handleOpenDialog(inv)} sx={{ color: '#6B7280', '&:hover': { color: '#1976d2' } }}>
                                  <EditIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => handleDelete(inv._id)} sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}>
                                  <DeleteIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>
      ) : groupBy === 'vessel' ? (
        <Box>
          {Object.keys(groupedByVessel).sort().map(vesselName => {
            let filteredItems = groupedByVessel[vesselName];
            if (filterMonth) {
              filteredItems = filteredItems.filter(inv => {
                const monthKey = `${inv.billingMonth} ${inv.billingYear}`;
                return monthKey === filterMonth;
              });
            }
            if (filteredItems.length === 0) return null;
            
            return (
              <Box key={vesselName} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={`${vesselName} - Total: RM ${filteredItems.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toLocaleString()}`}
                    sx={{ 
                      fontWeight: 600,
                      fontFamily: '"Inter", sans-serif',
                      borderRadius: 1,
                      bgcolor: '#F9FAFB',
                      color: '#111827',
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
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Invoice #</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Billing Month</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>DCR</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Duration</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Total Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Submission Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Expected Payment</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none', textAlign: 'center' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredItems.map((inv, index) => (
                        <TableRow 
                          key={inv._id} 
                          hover
                          sx={{ 
                            '&:hover': { bgcolor: '#F9FAFB' },
                            transition: 'background-color 0.2s',
                            borderBottom: index < filteredItems.length - 1 ? '1px solid #F3F4F6' : 'none',
                          }}
                        >
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', fontWeight: 500, color: '#111827', fontSize: '0.8rem' }}>{inv.invoiceNumber || '-'}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.client?.name || 'N/A'}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.billingMonth} {inv.billingYear}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>RM {inv.dcr?.toLocaleString() || 0}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.duration} days</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#111827', fontSize: '0.8rem', fontWeight: 500 }}>RM {inv.totalAmount?.toLocaleString() || 0}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.submissionDate ? new Date(inv.submissionDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.expectedPaymentDate ? new Date(inv.expectedPaymentDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell sx={{ py: 2, border: 'none' }}>
                            <Chip 
                              label={inv.paymentStatus} 
                              color={getPaymentStatusColor(inv.paymentStatus)} 
                              size="small"
                              sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif', borderRadius: '9999px' }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2, border: 'none', textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => handleOpenDialog(inv)} sx={{ color: '#6B7280', '&:hover': { color: '#1976d2' } }}>
                                  <EditIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => handleDelete(inv._id)} sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}>
                                  <DeleteIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
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
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Billing Month</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Vessel</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>DCR</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Submission Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Expected Payment</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Remarks</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                    <InvoiceIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                    <Typography color="textSecondary" variant="h6" sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}>
                      No invoices found
                    </Typography>
                    <Typography color="textSecondary" variant="body2" sx={{ fontFamily: '"Inter", sans-serif' }}>
                      Click "Add Invoice" to get started
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv, index) => (
                  <TableRow 
                    key={inv._id} 
                    hover
                    sx={{ 
                      '&:hover': { bgcolor: '#F9FAFB' },
                      transition: 'background-color 0.2s',
                      borderBottom: index < filteredInvoices.length - 1 ? '1px solid #F3F4F6' : 'none',
                    }}
                  >
                    <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', fontWeight: 500, color: '#111827', fontSize: '0.8rem' }}>{inv.invoiceNumber || '-'}</TableCell>
                    <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.billingMonth} {inv.billingYear}</TableCell>
                    <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.client?.name || 'N/A'}</TableCell>
                    <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.vessel?.name || 'N/A'}</TableCell>
                    <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>RM {inv.dcr?.toLocaleString() || 0}</TableCell>
                    <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.duration} days</TableCell>
                    <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#111827', fontSize: '0.8rem', fontWeight: 500 }}>RM {inv.totalAmount?.toLocaleString() || 0}</TableCell>
                    <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.submissionDate ? new Date(inv.submissionDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.expectedPaymentDate ? new Date(inv.expectedPaymentDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell sx={{ py: 2, border: 'none' }}>
                      <Chip 
                        label={inv.paymentStatus} 
                        color={getPaymentStatusColor(inv.paymentStatus)} 
                        size="small"
                        sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif', borderRadius: '9999px' }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{inv.remarks || '-'}</TableCell>
                    <TableCell sx={{ py: 2, border: 'none', textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(inv)} sx={{ color: '#6B7280', '&:hover': { color: '#1976d2' } }}>
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(inv._id)} sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}>
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ============ MODERN DIALOG ============ */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
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
              <InvoiceIcon sx={{ color: 'white', fontSize: 22 }} />
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
                {editingInvoice ? 'Edit Invoice' : 'Add Invoice'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#6B7280',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {editingInvoice ? 'Update invoice information' : 'Enter invoice details below'}
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
                Invoice Number
              </Typography>
              <TextField
                fullWidth
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., INV-2026-001"
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
                Billing Month <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="billingMonth"
                  value={formData.billingMonth}
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
                Billing Year <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="billingYear"
                type="number"
                value={formData.billingYear}
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
                Client <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="client"
                  value={formData.client}
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
                  <MenuItem value="">Select Client</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client._id} value={client._id}>{client.name}</MenuItem>
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
                DCR (RM) <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="dcr"
                type="number"
                value={formData.dcr}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 1000"
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
                Duration (days) <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 30.5"
                size="small"
                inputProps={{ step: 0.001 }}
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
                MOB Fee (RM)
              </Typography>
              <TextField
                fullWidth
                name="mob"
                type="number"
                value={formData.mob}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 5000"
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
                DEMOB Fee (RM)
              </Typography>
              <TextField
                fullWidth
                name="demob"
                type="number"
                value={formData.demob}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 5000"
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
                Total Invoice (Auto-calculated)
              </Typography>
              <TextField
                fullWidth
                value={`RM ${calculateTotal().toLocaleString()}`}
                variant="outlined"
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2, 
                    bgcolor: '#F3F4F6',
                    '& fieldset': { border: 'none' },
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: '"Inter", sans-serif',
                    color: '#111827',
                    fontSize: '0.875rem',
                    py: 1.5,
                    fontWeight: 600,
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
                Submission Date <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="submissionDate"
                type="date"
                value={formData.submissionDate}
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
                InputLabelProps={{ shrink: true }}
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
                Expected Payment (Auto: +30 days)
              </Typography>
              <TextField
                fullWidth
                value={calculateExpectedPayment() || ''}
                variant="outlined"
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2, 
                    bgcolor: '#F3F4F6',
                    '& fieldset': { border: 'none' },
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
                Payment Status
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
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
                  {statusOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                placeholder="Additional notes..."
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
            {saving ? 'Saving...' : editingInvoice ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default Invoices;