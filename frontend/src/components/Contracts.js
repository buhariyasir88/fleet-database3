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
  Tooltip,
  Fade,
  alpha,
  Menu,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as ContractIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Business as BusinessIcon,
  DirectionsBoat as VesselIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formData, setFormData] = useState({
    contractTitle: '',
    client: '',
    vessel: '',
    commencementDate: '',
    duration: '',
    dcr: '',
    mob: '',
    demob: '',
    remarks: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);
  const [filterVessel, setFilterVessel] = useState('All');
  const [anchorEl, setAnchorEl] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    title: true,
    client: true,
    vessel: true,
    period: true,
    duration: true,
    dcr: true,
    mob: true,
    demob: true,
    contractValue: true,
    balanceValue: true,
    progress: true,
    status: true,
    actions: true,
  });

  const colors = {
    primary: '#0a1628',
    gold: '#c9a84c',
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractsRes, clientsRes, vesselsRes] = await Promise.all([
        axios.get(`${API_URL}/contracts`),
        axios.get(`${API_URL}/clients`),
        axios.get(`${API_URL}/vessels`),
      ]);
      setContracts(contractsRes.data);
      setClients(clientsRes.data);
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

  const handleOpenDialog = (contract = null) => {
    if (contract) {
      setEditingContract(contract);
      setFormData({
        contractTitle: contract.contractTitle || '',
        client: contract.client?._id || contract.client || '',
        vessel: contract.vessel?._id || contract.vessel || '',
        commencementDate: contract.commencementDate?.split('T')[0] || '',
        duration: contract.duration || '',
        dcr: contract.dcr || '',
        mob: contract.mob || '',
        demob: contract.demob || '',
        remarks: contract.remarks || '',
      });
    } else {
      setEditingContract(null);
      setFormData({
        contractTitle: '',
        client: '',
        vessel: '',
        commencementDate: '',
        duration: '',
        dcr: '',
        mob: '',
        demob: '',
        remarks: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingContract(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateContractValue = (dcr, duration, mob = 0, demob = 0) => {
    const dcrNum = parseFloat(dcr) || 0;
    const durationNum = parseFloat(duration) || 0;
    const mobNum = parseFloat(mob) || 0;
    const demobNum = parseFloat(demob) || 0;
    return (dcrNum * durationNum) + mobNum + demobNum;
  };

  // FIXED: Balance calculation WITHOUT MOB (MOB already collected)
  const calculateBalanceValue = (dcr, commencementDate, duration, mob = 0, demob = 0) => {
    if (!commencementDate || !duration) return 0;
    try {
      const start = new Date(commencementDate);
      const now = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + parseInt(duration));
      
      if (now > end) return 0;
      const remainingDays = Math.max(Math.ceil((end - now) / (1000 * 60 * 60 * 24)), 0);
      const dcrNum = parseFloat(dcr) || 0;
      const demobNum = parseFloat(demob) || 0;
      // MOB is NOT included - it has already been collected
      return (dcrNum * remainingDays) + demobNum;
    } catch (error) {
      console.error('Error calculating balance:', error);
      return 0;
    }
  };

  const calculateProgress = (commencementDate, duration) => {
    if (!commencementDate || !duration) return 0;
    try {
      const start = new Date(commencementDate);
      const now = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + parseInt(duration));
      
      if (now > end) return 100;
      const total = parseInt(duration);
      const passed = Math.max(Math.floor((now - start) / (1000 * 60 * 60 * 24)), 0);
      return Math.min(Math.round((passed / total) * 100), 100);
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  };

  const isCompleted = (commencementDate, duration) => {
    if (!commencementDate || !duration) return false;
    try {
      const start = new Date(commencementDate);
      const end = new Date(start);
      end.setDate(end.getDate() + parseInt(duration));
      return new Date() > end;
    } catch (error) {
      return false;
    }
  };

  const getCompletionDate = (commencementDate, duration) => {
    if (!commencementDate || !duration) return null;
    try {
      const start = new Date(commencementDate);
      const end = new Date(start);
      end.setDate(end.getDate() + parseInt(duration));
      return end;
    } catch (error) {
      return null;
    }
  };

  const getClientName = (client) => {
    if (!client) return 'N/A';
    if (client.name) return client.name;
    if (typeof client === 'string') {
      const found = clients.find(c => c._id === client);
      return found?.name || 'N/A';
    }
    return 'N/A';
  };

  const getVesselName = (vessel) => {
    if (!vessel) return 'N/A';
    if (vessel.name) return vessel.name;
    if (typeof vessel === 'string') {
      const found = vessels.find(v => v._id === vessel);
      return found?.name || 'N/A';
    }
    return 'N/A';
  };

  // SAFE date formatter
  const safeFormatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      if (!formData.client || !formData.vessel || !formData.commencementDate || !formData.duration || !formData.dcr) {
        showSnackbar('Please fill in all required fields', 'error');
        setSaving(false);
        return;
      }

      const dcrNum = parseFloat(formData.dcr) || 0;
      const durationNum = parseFloat(formData.duration) || 0;
      const mobNum = parseFloat(formData.mob) || 0;
      const demobNum = parseFloat(formData.demob) || 0;
      const contractValue = (dcrNum * durationNum) + mobNum + demobNum;

      const contractData = {
        contractTitle: formData.contractTitle || '',
        client: formData.client,
        vessel: formData.vessel,
        commencementDate: formData.commencementDate,
        duration: durationNum,
        dcr: dcrNum,
        mob: mobNum,
        demob: demobNum,
        remarks: formData.remarks || '',
        contractValue: contractValue,
        status: 'Active',
      };

      if (editingContract) {
        await axios.put(`${API_URL}/contracts/${editingContract._id}`, contractData);
        showSnackbar('Contract updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/contracts`, contractData);
        showSnackbar('Contract created successfully! 🎉');
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving contract:', error);
      showSnackbar(error.response?.data?.error || 'Error saving contract. Make sure backend is running.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      try {
        await axios.delete(`${API_URL}/contracts/${id}`);
        showSnackbar('Contract deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting contract:', error);
        showSnackbar('Error deleting contract', 'error');
      }
    }
  };

  // Column visibility toggle
  const handleColumnToggle = (column) => {
    setVisibleColumns({ ...visibleColumns, [column]: !visibleColumns[column] });
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // ============ STATS ============
  const totalContracts = contracts.length;

  const filteredContracts = contracts.filter(c => {
    if (filterVessel === 'All') return true;
    const vesselId = typeof c.vessel === 'string' ? c.vessel : c.vessel?._id;
    return vesselId === filterVessel;
  });

  const activeContracts = filteredContracts.filter(c => !isCompleted(c.commencementDate, c.duration));
  const completedContracts = filteredContracts.filter(c => isCompleted(c.commencementDate, c.duration));

  const totalValue = contracts.reduce((sum, c) => sum + (c.contractValue || 0), 0);

  let totalRemainingValue = 0;
  contracts.forEach(c => {
    if (!isCompleted(c.commencementDate, c.duration)) {
      totalRemainingValue += calculateBalanceValue(
        c.dcr,
        c.commencementDate,
        c.duration,
        c.mob,
        c.demob
      );
    }
  });

  const activeTotalValue = activeContracts.reduce((sum, c) => sum + (c.contractValue || 0), 0);
  const remainingPercent = activeTotalValue > 0 ? ((totalRemainingValue / activeTotalValue) * 100).toFixed(1) : 0;

  // ============ PDF EXPORT - FIXED ============
  const handlePrint = () => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(10, 22, 40);
      doc.text('Contract Report - DJ Group', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
      
      if (filterVessel !== 'All') {
        const vesselName = vessels.find(v => v._id === filterVessel)?.name || 'Selected Vessel';
        doc.text(`Filter: ${vesselName}`, 14, 34);
      }

      let startY = 45;

      // Build headers based on visible columns
      const getActiveHeaders = () => {
        const headers = [];
        if (visibleColumns.title) headers.push('Title');
        if (visibleColumns.client) headers.push('Client');
        if (visibleColumns.vessel) headers.push('Vessel');
        if (visibleColumns.period) headers.push('Period');
        if (visibleColumns.duration) headers.push('Duration');
        if (visibleColumns.dcr) headers.push('DCR');
        if (visibleColumns.mob) headers.push('MOB');
        if (visibleColumns.demob) headers.push('DEMOB');
        if (visibleColumns.contractValue) headers.push('Total Value');
        if (visibleColumns.balanceValue) headers.push('Balance');
        if (visibleColumns.progress) headers.push('Progress');
        return headers;
      };

      const getCompletedHeaders = () => {
        const headers = [];
        if (visibleColumns.title) headers.push('Title');
        if (visibleColumns.client) headers.push('Client');
        if (visibleColumns.vessel) headers.push('Vessel');
        if (visibleColumns.period) headers.push('Period');
        if (visibleColumns.duration) headers.push('Duration');
        if (visibleColumns.dcr) headers.push('DCR');
        if (visibleColumns.mob) headers.push('MOB');
        if (visibleColumns.demob) headers.push('DEMOB');
        if (visibleColumns.contractValue) headers.push('Total Value');
        if (visibleColumns.status) headers.push('Status');
        return headers;
      };

      // Build active data based on visible columns
      const getActiveRow = (c) => {
        const row = [];
        if (visibleColumns.title) row.push(c.contractTitle || '-');
        if (visibleColumns.client) row.push(getClientName(c.client));
        if (visibleColumns.vessel) row.push(getVesselName(c.vessel));
        if (visibleColumns.period) {
          const startDate = safeFormatDate(c.commencementDate);
          const endDate = getCompletionDate(c.commencementDate, c.duration);
          row.push(`${startDate} to ${endDate ? safeFormatDate(endDate) : 'N/A'}`);
        }
        if (visibleColumns.duration) row.push(`${c.duration || 0} days`);
        if (visibleColumns.dcr) row.push(`RM ${(c.dcr || 0).toFixed(2)}`);
        if (visibleColumns.mob) row.push(`RM ${(c.mob || 0).toFixed(2)}`);
        if (visibleColumns.demob) row.push(`RM ${(c.demob || 0).toFixed(2)}`);
        if (visibleColumns.contractValue) row.push(`RM ${(c.contractValue || 0).toFixed(2)}`);
        if (visibleColumns.balanceValue) {
          const balance = calculateBalanceValue(c.dcr, c.commencementDate, c.duration, c.mob, c.demob);
          row.push(`RM ${balance.toFixed(2)}`);
        }
        if (visibleColumns.progress) {
          const progress = calculateProgress(c.commencementDate, c.duration);
          row.push(`${Math.min(progress, 100)}%`);
        }
        return row;
      };

      const getCompletedRow = (c) => {
        const row = [];
        if (visibleColumns.title) row.push(c.contractTitle || '-');
        if (visibleColumns.client) row.push(getClientName(c.client));
        if (visibleColumns.vessel) row.push(getVesselName(c.vessel));
        if (visibleColumns.period) {
          const startDate = safeFormatDate(c.commencementDate);
          const endDate = getCompletionDate(c.commencementDate, c.duration);
          row.push(`${startDate} to ${endDate ? safeFormatDate(endDate) : 'N/A'}`);
        }
        if (visibleColumns.duration) row.push(`${c.duration || 0} days`);
        if (visibleColumns.dcr) row.push(`RM ${(c.dcr || 0).toFixed(2)}`);
        if (visibleColumns.mob) row.push(`RM ${(c.mob || 0).toFixed(2)}`);
        if (visibleColumns.demob) row.push(`RM ${(c.demob || 0).toFixed(2)}`);
        if (visibleColumns.contractValue) row.push(`RM ${(c.contractValue || 0).toFixed(2)}`);
        if (visibleColumns.status) row.push('Completed');
        return row;
      };

      // Active Contracts Table
      const activeToPrint = activeContracts;
      const activeHeaders = getActiveHeaders();
      if (activeToPrint.length > 0 && activeHeaders.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(10, 22, 40);
        doc.text(`Active Contracts (${activeToPrint.length})`, 14, startY);
        
        const activeData = activeToPrint.map(c => getActiveRow(c));

        doc.autoTable({
          startY: startY + 5,
          head: [activeHeaders],
          body: activeData,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [10, 22, 40], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 14, right: 14 },
        });
        
        startY = doc.lastAutoTable.finalY + 10;
      }

      // Completed Contracts Table
      const completedToPrint = completedContracts;
      const completedHeaders = getCompletedHeaders();
      if (completedToPrint.length > 0 && completedHeaders.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(10, 22, 40);
        doc.text(`Completed Contracts (${completedToPrint.length})`, 14, startY + 5);
        
        const completedData = completedToPrint.map(c => getCompletedRow(c));

        doc.autoTable({
          startY: startY + 10,
          head: [completedHeaders],
          body: completedData,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [10, 22, 40], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 14, right: 14 },
        });
      }

      // If no contracts found
      if (activeToPrint.length === 0 && completedToPrint.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text('No contracts found matching the current filter.', 14, 50);
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`DJ Group - Contract Report`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
      }

      doc.save('contract-report.pdf');
      showSnackbar('PDF exported successfully! 🎉', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showSnackbar('Error generating PDF. Please check console.', 'error');
    }
  };

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
            Contracts
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6B7280',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Manage your vessel contracts and track progress
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontFamily: '"Inter", sans-serif',
              borderColor: '#E5E7EB',
              color: '#6B7280',
              '&:hover': { borderColor: '#1976d2', color: '#1976d2' }
            }}
          >
            Export PDF
          </Button>
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
            Add Contract
          </Button>
        </Box>
      </Box>

      {/* ============ STATS CARDS ============ */}
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
                <ContractIcon sx={{ fontSize: 22 }} />
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
                  Total Contracts
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
                  {totalContracts}
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
                <CheckCircleIcon sx={{ fontSize: 22 }} />
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
                  Active Contracts
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
                  {activeContracts.length}
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
                  Total Contract Value
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
                  RM {totalValue.toLocaleString()}
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
                  bgcolor: 'rgba(201, 168, 76, 0.15)',
                  color: colors.gold,
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
                  Remaining Balance (RM)
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: colors.gold,
                    lineHeight: 1.2,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  RM {totalRemainingValue.toLocaleString()}
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
                  bgcolor: 'rgba(34, 197, 94, 0.1)',
                  color: '#15803d',
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
                  Remaining Balance (%)
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#15803d',
                    lineHeight: 1.2,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {remainingPercent}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ============ FILTERS ============ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
              <MenuItem value="All">All Vessels</MenuItem>
              {vessels.map((v) => (
                <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Toggle Columns">
            <Button
              variant="outlined"
              onClick={handleMenuOpen}
              startIcon={<VisibilityIcon />}
              endIcon={<ArrowDropDownIcon />}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                fontFamily: '"Inter", sans-serif',
                borderColor: '#E5E7EB',
                color: '#6B7280',
                '&:hover': { borderColor: '#1976d2', color: '#1976d2' }
              }}
            >
              Columns
            </Button>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                p: 1,
                minWidth: 180,
              }
            }}
          >
            <Typography variant="caption" sx={{ px: 1, py: 0.5, color: '#6B7280', fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>
              Show/Hide Columns
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            {Object.keys(visibleColumns).map((key) => (
              <MenuItem key={key} dense onClick={() => handleColumnToggle(key)}>
                <Checkbox checked={visibleColumns[key]} size="small" />
                <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif', textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      {/* ============ ACTIVE CONTRACTS ============ */}
      {activeContracts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip
              label={`Active Contracts (${activeContracts.length})`}
              color="success"
              sx={{ 
                fontWeight: 600,
                fontFamily: '"Inter", sans-serif',
                borderRadius: 1,
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
                  {visibleColumns.title && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Title</TableCell>}
                  {visibleColumns.client && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Client</TableCell>}
                  {visibleColumns.vessel && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Vessel</TableCell>}
                  {visibleColumns.period && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Period</TableCell>}
                  {visibleColumns.duration && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Duration</TableCell>}
                  {visibleColumns.dcr && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>DCR</TableCell>}
                  {visibleColumns.mob && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>MOB</TableCell>}
                  {visibleColumns.demob && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>DEMOB</TableCell>}
                  {visibleColumns.contractValue && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Contract Value</TableCell>}
                  {visibleColumns.balanceValue && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Balance</TableCell>}
                  {visibleColumns.progress && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Progress</TableCell>}
                  {visibleColumns.actions && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none', textAlign: 'center' }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {activeContracts.map((contract, index) => {
                  const progress = calculateProgress(contract.commencementDate, contract.duration);
                  const clientName = getClientName(contract.client);
                  const vesselName = getVesselName(contract.vessel);
                  const endDate = getCompletionDate(contract.commencementDate, contract.duration);
                  const balanceValue = calculateBalanceValue(
                    contract.dcr,
                    contract.commencementDate,
                    contract.duration,
                    contract.mob,
                    contract.demob
                  );

                  return (
                    <TableRow 
                      key={contract._id} 
                      hover
                      sx={{ 
                        '&:hover': { bgcolor: '#F9FAFB' },
                        transition: 'background-color 0.2s',
                        borderBottom: index < activeContracts.length - 1 ? '1px solid #F3F4F6' : 'none',
                      }}
                    >
                      {visibleColumns.title && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', fontWeight: 500, color: '#111827', fontSize: '0.8rem' }}>{contract.contractTitle || '-'}</TableCell>}
                      {visibleColumns.client && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{clientName}</TableCell>}
                      {visibleColumns.vessel && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{vesselName}</TableCell>}
                      {visibleColumns.period && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.75rem' }}>
                        {safeFormatDate(contract.commencementDate)} to{' '}
                        {endDate ? safeFormatDate(endDate) : 'N/A'}
                      </TableCell>}
                      {visibleColumns.duration && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{contract.duration} days</TableCell>}
                      {visibleColumns.dcr && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>RM {parseFloat(contract.dcr).toLocaleString()}</TableCell>}
                      {visibleColumns.mob && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>RM {parseFloat(contract.mob || 0).toLocaleString()}</TableCell>}
                      {visibleColumns.demob && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>RM {parseFloat(contract.demob || 0).toLocaleString()}</TableCell>}
                      {visibleColumns.contractValue && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#111827', fontSize: '0.8rem', fontWeight: 500 }}>RM {contract.contractValue?.toLocaleString() || 0}</TableCell>}
                      {visibleColumns.balanceValue && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>RM {balanceValue.toLocaleString()}</TableCell>}
                      {visibleColumns.progress && (
                        <TableCell sx={{ py: 2, border: 'none' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 60, height: 5, bgcolor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                              <Box sx={{ width: `${Math.min(progress, 100)}%`, height: '100%', bgcolor: progress > 80 ? '#22c55e' : progress > 50 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
                            </Box>
                            <Typography variant="caption" sx={{ fontFamily: '"Inter", sans-serif', color: '#6B7280', fontWeight: 500, fontSize: '0.7rem' }}>
                              {Math.min(progress, 100)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell sx={{ py: 2, border: 'none', textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenDialog(contract)} sx={{ color: '#6B7280', '&:hover': { color: '#1976d2' } }}>
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDelete(contract._id)} sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}>
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ============ COMPLETED CONTRACTS ============ */}
      {completedContracts.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip
              label={`Completed Contracts (${completedContracts.length})`}
              color="info"
              sx={{ 
                fontWeight: 600,
                fontFamily: '"Inter", sans-serif',
                borderRadius: 1,
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
                  {visibleColumns.title && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Title</TableCell>}
                  {visibleColumns.client && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Client</TableCell>}
                  {visibleColumns.vessel && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Vessel</TableCell>}
                  {visibleColumns.period && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Period</TableCell>}
                  {visibleColumns.duration && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Duration</TableCell>}
                  {visibleColumns.dcr && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>DCR</TableCell>}
                  {visibleColumns.mob && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>MOB</TableCell>}
                  {visibleColumns.demob && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>DEMOB</TableCell>}
                  {visibleColumns.contractValue && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Contract Value</TableCell>}
                  {visibleColumns.status && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Status</TableCell>}
                  {visibleColumns.actions && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none', textAlign: 'center' }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {completedContracts.map((contract, index) => {
                  const clientName = getClientName(contract.client);
                  const vesselName = getVesselName(contract.vessel);
                  const endDate = getCompletionDate(contract.commencementDate, contract.duration);

                  return (
                    <TableRow 
                      key={contract._id} 
                      hover
                      sx={{ 
                        '&:hover': { bgcolor: '#F9FAFB' },
                        transition: 'background-color 0.2s',
                        borderBottom: index < completedContracts.length - 1 ? '1px solid #F3F4F6' : 'none',
                      }}
                    >
                      {visibleColumns.title && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', fontWeight: 500, color: '#111827', fontSize: '0.8rem' }}>{contract.contractTitle || '-'}</TableCell>}
                      {visibleColumns.client && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{clientName}</TableCell>}
                      {visibleColumns.vessel && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{vesselName}</TableCell>}
                      {visibleColumns.period && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.75rem' }}>
                        {safeFormatDate(contract.commencementDate)} to{' '}
                        {endDate ? safeFormatDate(endDate) : 'N/A'}
                      </TableCell>}
                      {visibleColumns.duration && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{contract.duration} days</TableCell>}
                      {visibleColumns.dcr && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>RM {parseFloat(contract.dcr).toLocaleString()}</TableCell>}
                      {visibleColumns.mob && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>RM {parseFloat(contract.mob || 0).toLocaleString()}</TableCell>}
                      {visibleColumns.demob && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>RM {parseFloat(contract.demob || 0).toLocaleString()}</TableCell>}
                      {visibleColumns.contractValue && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#111827', fontSize: '0.8rem', fontWeight: 500 }}>RM {contract.contractValue?.toLocaleString() || 0}</TableCell>}
                      {visibleColumns.status && (
                        <TableCell sx={{ py: 2, border: 'none' }}>
                          <Chip
                            label="Completed"
                            color="info"
                            size="small"
                            icon={<CheckCircleIcon />}
                            sx={{ 
                              fontWeight: 500,
                              fontFamily: '"Inter", sans-serif',
                              borderRadius: '9999px',
                            }}
                          />
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell sx={{ py: 2, border: 'none', textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenDialog(contract)} sx={{ color: '#6B7280', '&:hover': { color: '#1976d2' } }}>
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDelete(contract._id)} sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}>
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {contracts.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <ContractIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
          <Typography color="textSecondary" variant="h6" sx={{ fontWeight: 500 }}>
            No contracts found
          </Typography>
          <Typography color="textSecondary" variant="body2">
            Click "Add Contract" to get started
          </Typography>
        </Paper>
      )}

      {/* ============ DIALOG ============ */}
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
              <ContractIcon sx={{ color: 'white', fontSize: 22 }} />
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
                {editingContract ? 'Edit Contract' : 'Add Contract'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#6B7280',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {editingContract ? 'Update contract information' : 'Enter contract details below'}
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
                Contract Title
              </Typography>
              <TextField
                fullWidth
                name="contractTitle"
                value={formData.contractTitle}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., PCSB Charter Agreement"
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
                Commencement Date <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="commencementDate"
                type="date"
                value={formData.commencementDate}
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
                Duration (days) <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 30"
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
                DCR (Daily Charter Rate) RM <span style={{ color: '#EF4444' }}>*</span>
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
                MOB Rate (RM)
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
                DEMOB Rate (RM)
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
            {saving ? 'Saving...' : editingContract ? 'Update Contract' : 'Create Contract'}
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

export default Contracts;