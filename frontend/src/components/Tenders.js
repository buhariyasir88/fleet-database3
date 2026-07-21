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
  Collapse,
  Checkbox,
  Fade,
  alpha,
  Divider,
  Menu,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  RequestQuote as TenderIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Numbers as NumbersIcon,
  DirectionsBoat as VesselIcon,
  AddCircle as AddCircleIcon,
  Business as BusinessIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

function Tenders() {
  const [tenders, setTenders] = useState([]);
  const [clients, setClients] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTender, setEditingTender] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [showGantt, setShowGantt] = useState(true);
  const [showTable, setShowTable] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    tenderNo: true,
    client: true,
    projectDetails: true,
    proposedVessel: true,
    vesselType: true,
    proposedRate: true,
    period: true,
    duration: true,
    status: true,
    chances: true,
    remarks: true,
    submittedDate: true,
    actions: true,
  });
  const [formData, setFormData] = useState({
    tenderNo: '',
    client: '',
    projectDetails: '',
    proposedVessels: [{ 
      vessel: '', 
      vesselName: '',
      isThirdParty: false,
      proposedRate: '' 
    }],
    commencementDate: '',
    duration: '',
    location: '',
    status: 'Pending Submission',
    chances: '',
    remarks: '',
    submittedDate: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  const statusOptions = [
    'Pending Submission',
    'Submitted',
    'Under Review',
    'Awarded',
    'Decline',
    'Unsuccessful',
    'Aborted'
  ];

  const statusColors = {
    'Awarded': 'success',
    'Under Review': 'warning',
    'Submitted': 'info',
    'Pending Submission': 'secondary',
    'Decline': 'error',
    'Unsuccessful': 'error',
    'Aborted': 'error'
  };

  const statusIconMap = {
    'Awarded': <CheckCircleIcon sx={{ fontSize: 14 }} />,
    'Pending Submission': <PendingIcon sx={{ fontSize: 14 }} />,
    'Decline': <CancelIcon sx={{ fontSize: 14 }} />,
    'Unsuccessful': <CancelIcon sx={{ fontSize: 14 }} />,
    'Aborted': <CancelIcon sx={{ fontSize: 14 }} />,
  };

  const chancesOptions = ['High', 'Medium', 'Low', 'Very Low'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tendersRes, clientsRes, vesselsRes] = await Promise.all([
        axios.get(`${API_URL}/tenders`),
        axios.get(`${API_URL}/clients`),
        axios.get(`${API_URL}/vessels`),
      ]);
      setTenders(tendersRes.data);
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

  // Generate auto tender number suggestion
  const generateTenderNo = () => {
    const year = new Date().getFullYear();
    const count = tenders.filter(t => {
      const tYear = t.tenderNo ? parseInt(t.tenderNo.substring(0, 4)) : 0;
      return tYear === year;
    }).length;
    const seq = String(count + 1).padStart(3, '0');
    return `${year}-${seq}`;
  };

  const handleOpenDialog = (tender = null) => {
    if (tender) {
      setEditingTender(tender);
      setFormData({
        tenderNo: tender.tenderNo || '',
        client: tender.client?._id || tender.client || '',
        projectDetails: tender.projectDetails || '',
        proposedVessels: tender.proposedVessels || [{ 
          vessel: '', 
          vesselName: '',
          isThirdParty: false,
          proposedRate: '' 
        }],
        commencementDate: tender.commencementDate?.split('T')[0] || '',
        duration: tender.duration || '',
        location: tender.location || '',
        status: tender.status || 'Pending Submission',
        chances: tender.chances || '',
        remarks: tender.remarks || '',
        submittedDate: tender.submittedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingTender(null);
      setFormData({
        tenderNo: generateTenderNo(),
        client: '',
        projectDetails: '',
        proposedVessels: [{ 
          vessel: '', 
          vesselName: '',
          isThirdParty: false,
          proposedRate: '' 
        }],
        commencementDate: '',
        duration: '',
        location: '',
        status: 'Pending Submission',
        chances: '',
        remarks: '',
        submittedDate: new Date().toISOString().split('T')[0],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTender(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVesselChange = (index, field, value) => {
    const updatedVessels = [...formData.proposedVessels];
    updatedVessels[index][field] = value;
    setFormData({ ...formData, proposedVessels: updatedVessels });
  };

  const handleVesselTypeToggle = (index, isThirdParty) => {
    const updatedVessels = [...formData.proposedVessels];
    updatedVessels[index].isThirdParty = isThirdParty;
    updatedVessels[index].vessel = ''; // Reset vessel selection
    updatedVessels[index].vesselName = ''; // Reset name
    setFormData({ ...formData, proposedVessels: updatedVessels });
  };

  const addVesselRow = () => {
    setFormData({
      ...formData,
      proposedVessels: [...formData.proposedVessels, { 
        vessel: '', 
        vesselName: '',
        isThirdParty: false,
        proposedRate: '' 
      }]
    });
  };

  const removeVesselRow = (index) => {
    if (formData.proposedVessels.length > 1) {
      const updatedVessels = formData.proposedVessels.filter((_, i) => i !== index);
      setFormData({ ...formData, proposedVessels: updatedVessels });
    }
  };

  const toggleRow = (id) => {
    setExpandedRows({ ...expandedRows, [id]: !expandedRows[id] });
  };

  const toggleGantt = () => {
    setShowGantt(!showGantt);
  };

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  const calculateCompletionDate = (startDate, duration) => {
    if (!startDate || !duration) return null;
    const date = new Date(startDate);
    date.setDate(date.getDate() + parseInt(duration));
    return date.toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    return statusColors[status] || 'default';
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

  // FIXED: Get vessel display name for both owned and 3rd party
  const getVesselDisplayName = (vesselData) => {
    if (!vesselData) return 'N/A';
    
    // If it's a 3rd party vessel (has vesselName)
    if (vesselData.isThirdParty && vesselData.vesselName) {
      return `${vesselData.vesselName} (3rd Party)`;
    }
    
    // If it's from our fleet
    if (vesselData.vessel) {
      if (typeof vesselData.vessel === 'object' && vesselData.vessel.name) {
        return vesselData.vessel.name;
      }
      if (typeof vesselData.vessel === 'string') {
        const found = vessels.find(v => v._id === vesselData.vessel);
        return found?.name || 'N/A';
      }
    }
    
    // Handle case where vesselData might be just a string (old data)
    if (typeof vesselData === 'string') {
      const found = vessels.find(v => v._id === vesselData);
      return found?.name || vesselData;
    }
    
    return 'N/A';
  };

  // FIXED: Get vessel type
  const getVesselType = (vesselData) => {
    if (!vesselData) return 'N/A';
    if (vesselData.isThirdParty) return '3rd Party';
    return 'Owned';
  };

  // FIXED: Handle submit with proper validation for 3rd party vessels
  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      if (!formData.client || !formData.commencementDate || !formData.duration) {
        showSnackbar('Please fill in all required fields', 'error');
        setSaving(false);
        return;
      }

      // Validate vessels - handle both owned and 3rd party
      const validVessels = formData.proposedVessels.filter(v => {
        if (v.isThirdParty) {
          // 3rd party: need vesselName and proposedRate
          return v.vesselName && v.vesselName.trim() !== '' && v.proposedRate;
        } else {
          // Owned: need vessel (ObjectId) and proposedRate
          return v.vessel && v.proposedRate;
        }
      });
      
      if (validVessels.length === 0) {
        showSnackbar('Please add at least one vessel with rate', 'error');
        setSaving(false);
        return;
      }

      const completionDate = calculateCompletionDate(formData.commencementDate, formData.duration);

      // Clean up the data before sending
      const tenderData = {
        tenderNo: formData.tenderNo || generateTenderNo(),
        client: formData.client,
        projectDetails: formData.projectDetails || '',
        proposedVessels: validVessels.map(v => {
          if (v.isThirdParty) {
            // 3rd party: send vesselName and isThirdParty, no vessel (ObjectId)
            return {
              vesselName: v.vesselName,
              isThirdParty: true,
              proposedRate: parseFloat(v.proposedRate) || 0
            };
          } else {
            // Owned: send vessel (ObjectId), no vesselName
            return {
              vessel: v.vessel,
              isThirdParty: false,
              proposedRate: parseFloat(v.proposedRate) || 0
            };
          }
        }),
        commencementDate: formData.commencementDate,
        duration: parseFloat(formData.duration),
        completionDate: completionDate,
        location: formData.location || '',
        status: formData.status,
        chances: formData.chances || '',
        remarks: formData.remarks || '',
        submittedDate: formData.submittedDate || new Date().toISOString().split('T')[0],
      };

      console.log('📤 Sending tender data:', tenderData);

      if (editingTender) {
        await axios.put(`${API_URL}/tenders/${editingTender._id}`, tenderData);
        showSnackbar('Tender updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/tenders`, tenderData);
        showSnackbar('Tender created successfully! 🎉');
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving tender:', error);
      console.error('Error details:', error.response?.data);
      showSnackbar(error.response?.data?.error || 'Error saving tender. Make sure backend is running.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tender?')) {
      try {
        await axios.delete(`${API_URL}/tenders/${id}`);
        showSnackbar('Tender deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting tender:', error);
        showSnackbar('Error deleting tender', 'error');
      }
    }
  };

  // Calculate stats
  const totalTenders = tenders.length;
  const awardedCount = tenders.filter(t => t.status === 'Awarded').length;
  const underReviewCount = tenders.filter(t => t.status === 'Under Review').length;
  const submittedCount = tenders.filter(t => t.status === 'Submitted').length;
  const pendingCount = tenders.filter(t => t.status === 'Pending Submission').length;
  const unsuccessfulCount = tenders.filter(t => t.status === 'Unsuccessful' || t.status === 'Decline' || t.status === 'Aborted').length;

  const statCards = [
    { title: 'Total Tenders', value: totalTenders, icon: <TenderIcon sx={{ fontSize: 22 }} />, color: '#1976d2', bgColor: 'rgba(25, 118, 210, 0.1)' },
    { title: 'Awarded', value: awardedCount, icon: <CheckCircleIcon sx={{ fontSize: 22 }} />, color: '#4caf50', bgColor: 'rgba(76, 175, 80, 0.1)' },
    { title: 'Under Review', value: underReviewCount, icon: <PendingIcon sx={{ fontSize: 22 }} />, color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.1)' },
    { title: 'Submitted', value: submittedCount, icon: <TenderIcon sx={{ fontSize: 22 }} />, color: '#2196f3', bgColor: 'rgba(33, 150, 243, 0.1)' },
    { title: 'Pending', value: pendingCount, icon: <PendingIcon sx={{ fontSize: 22 }} />, color: '#9c27b0', bgColor: 'rgba(156, 39, 176, 0.1)' },
    { title: 'Unsuccessful', value: unsuccessfulCount, icon: <CancelIcon sx={{ fontSize: 22 }} />, color: '#f44336', bgColor: 'rgba(244, 67, 54, 0.1)' },
  ];

  // Group tenders by year
  const getYear = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).getFullYear();
  };

  const groupedTenders = tenders.reduce((acc, tender) => {
    const year = getYear(tender.submittedDate || tender.commencementDate);
    if (!acc[year]) acc[year] = [];
    acc[year].push(tender);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedTenders).sort((a, b) => b - a);

  // Gantt Chart Data
  const ganttData = tenders
    .filter(t => t.commencementDate && t.duration)
    .map(t => {
      const start = new Date(t.commencementDate);
      const end = new Date(start);
      end.setDate(end.getDate() + parseInt(t.duration));
      return {
        ...t,
        start: start,
        end: end,
        clientName: getClientName(t.client),
        vesselNames: t.proposedVessels?.map(v => getVesselDisplayName(v)).join(', ') || 'N/A',
        rates: t.proposedVessels?.map(v => v.proposedRate).join(', ') || 'N/A',
      };
    })
    .sort((a, b) => a.start - b.start);

  const minDate = ganttData.length > 0 ? ganttData[0].start : new Date();
  const maxDate = ganttData.length > 0 ? ganttData[ganttData.length - 1].end : new Date();
  const totalDays = Math.max((maxDate - minDate) / (1000 * 60 * 60 * 24), 1);

  // Handle column visibility
  const handleColumnToggle = (column) => {
    setVisibleColumns({ ...visibleColumns, [column]: !visibleColumns[column] });
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const columnDefs = [
    { key: 'tenderNo', label: 'Tender No' },
    { key: 'client', label: 'Client/Job' },
    { key: 'projectDetails', label: 'Project Details' },
    { key: 'proposedVessel', label: 'Proposed Vessel' },
    { key: 'vesselType', label: 'Vessel Type' },
    { key: 'proposedRate', label: 'Proposed Rate' },
    { key: 'period', label: 'Period' },
    { key: 'duration', label: 'Duration' },
    { key: 'status', label: 'Status' },
    { key: 'chances', label: 'Chances' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'submittedDate', label: 'Submitted Date' },
    { key: 'actions', label: 'Actions' },
  ];

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
            Tenders
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6B7280',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Manage your tender submissions and track progress
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
          Add Tender
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
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
                    bgcolor: stat.bgColor,
                    color: stat.color,
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                  }}
                >
                  {stat.icon}
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
                    {stat.title}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: stat.color,
                      lineHeight: 1.2,
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Gantt Chart */}
      <Paper 
        sx={{ 
          borderRadius: 3, 
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', 
          mb: 3, 
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
            borderBottom: showGantt ? '1px solid #E5E7EB' : 'none',
            '&:hover': { bgcolor: '#F3F4F6' },
          }}
          onClick={toggleGantt}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: '#111827',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Tender Timeline (Gantt Chart)
          </Typography>
          <IconButton>
            {showGantt ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={showGantt}>
          <Box sx={{ p: 3, pt: 2 }}>
            {ganttData.length === 0 ? (
              <Typography color="textSecondary" align="center" sx={{ py: 4, fontFamily: '"Inter", sans-serif' }}>
                No tenders with dates to display
              </Typography>
            ) : (
              <Box sx={{ width: '100%', overflow: 'hidden' }}>
                <Box sx={{ width: '100%', position: 'relative' }}>
                  {/* Header Row */}
                  <Box sx={{ display: 'flex', borderBottom: '2px solid #E5E7EB', mb: 1 }}>
                    <Box sx={{ width: 180, flexShrink: 0, py: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif' }}>
                        Client / Vessel
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, py: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', textAlign: 'center', display: 'block' }}>
                        Timeline
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Gantt bars */}
                  {ganttData.map((item, index) => {
                    const startOffset = Math.max((item.start - minDate) / (1000 * 60 * 60 * 24), 0);
                    const barWidth = Math.max((item.duration / totalDays) * 100, 3);
                    const leftPos = (startOffset / totalDays) * 100;
                    const color = statusColors[item.status] === 'success' ? '#4caf50' :
                                  statusColors[item.status] === 'warning' ? '#ff9800' :
                                  statusColors[item.status] === 'info' ? '#2196f3' :
                                  statusColors[item.status] === 'secondary' ? '#9c27b0' : '#f44336';
                    
                    return (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Box sx={{ width: 180, flexShrink: 0, pr: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip 
                              label={item.tenderNo || 'N/A'} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.5rem', 
                                height: 18, 
                                bgcolor: '#E5E7EB',
                                fontFamily: '"Inter", sans-serif',
                                fontWeight: 600,
                              }} 
                            />
                          </Box>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: '0.75rem', fontFamily: '"Inter", sans-serif', color: '#111827' }}>
                            {item.clientName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" noWrap sx={{ fontSize: '0.6rem', fontFamily: '"Inter", sans-serif' }}>
                            {item.vesselNames}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1, height: 28, bgcolor: '#F3F4F6', borderRadius: 1, position: 'relative' }}>
                          <Tooltip
                            title={
                              <Box sx={{ p: 1.5, minWidth: 200 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff', mb: 0.5, fontFamily: '"Inter", sans-serif' }}>
                                  #{item.tenderNo || 'N/A'} - {item.clientName || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block', fontFamily: '"Inter", sans-serif' }}>
                                  <strong>Vessel:</strong> {item.vesselNames || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block', fontFamily: '"Inter", sans-serif' }}>
                                  <strong>Rate:</strong> RM {item.rates || '0'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block', fontFamily: '"Inter", sans-serif' }}>
                                  <strong>Period:</strong> {item.start?.toLocaleDateString() || 'N/A'} - {item.end?.toLocaleDateString() || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block', fontFamily: '"Inter", sans-serif' }}>
                                  <strong>Duration:</strong> {item.duration || 0} days
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem', display: 'block', fontFamily: '"Inter", sans-serif' }}>
                                  <strong>Status:</strong> {item.status || 'N/A'}
                                </Typography>
                              </Box>
                            }
                            arrow
                            placement="top"
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                left: `${leftPos}%`,
                                width: `${barWidth}%`,
                                height: '100%',
                                bgcolor: color,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.5rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                minWidth: barWidth > 5 ? 'auto' : '4px',
                                fontFamily: '"Inter", sans-serif',
                                '&:hover': {
                                  opacity: 0.8,
                                  transform: 'scaleY(1.1)',
                                }
                              }}
                            >
                              {barWidth > 12 ? `${item.duration}d` : ''}
                            </Box>
                          </Tooltip>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Column Visibility */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
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
            {columnDefs.map((col) => (
              <MenuItem key={col.key} dense onClick={() => handleColumnToggle(col.key)}>
                <Checkbox checked={visibleColumns[col.key]} size="small" />
                <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif', textTransform: 'capitalize' }}>
                  {col.label}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      {/* Tenders List */}
      <Paper 
        sx={{ 
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
            borderBottom: showTable ? '1px solid #E5E7EB' : 'none',
            '&:hover': { bgcolor: '#F3F4F6' },
          }}
          onClick={toggleTable}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: '#111827',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Tenders List
          </Typography>
          <IconButton>
            {showTable ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={showTable}>
          <Box sx={{ p: 2, pt: 0 }}>
            {sortedYears.length === 0 ? (
              <Typography color="textSecondary" align="center" sx={{ py: 4, fontFamily: '"Inter", sans-serif' }}>
                No tenders found. Click "Add Tender" to get started.
              </Typography>
            ) : (
              sortedYears.map((year) => (
                <Box key={year} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Chip
                      label={`${year} (${groupedTenders[year].length} tenders)`}
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
                      borderRadius: 2, 
                      boxShadow: 'none', 
                      border: '1px solid #E5E7EB',
                      overflowX: 'auto',
                    }}
                  >
                    <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                          {visibleColumns.tenderNo && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Tender No</TableCell>}
                          {visibleColumns.client && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Client/Job</TableCell>}
                          {visibleColumns.projectDetails && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Project Details</TableCell>}
                          {visibleColumns.proposedVessel && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Proposed Vessel</TableCell>}
                          {visibleColumns.vesselType && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Type</TableCell>}
                          {visibleColumns.proposedRate && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Proposed Rate</TableCell>}
                          {visibleColumns.period && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Period</TableCell>}
                          {visibleColumns.duration && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Duration</TableCell>}
                          {visibleColumns.status && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Status</TableCell>}
                          {visibleColumns.chances && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Chances</TableCell>}
                          {visibleColumns.remarks && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Remarks</TableCell>}
                          {visibleColumns.submittedDate && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none' }}>Submitted Date</TableCell>}
                          {visibleColumns.actions && <TableCell sx={{ fontWeight: 700, color: '#111827', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Inter", sans-serif', py: 2, border: 'none', textAlign: 'center' }}>Actions</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupedTenders[year].map((tender) => {
                          const clientName = getClientName(tender.client);
                          const vesselNames = tender.proposedVessels?.map(v => getVesselDisplayName(v)).join(', ') || 'N/A';
                          const vesselTypes = tender.proposedVessels?.map(v => getVesselType(v)).join(', ') || 'N/A';
                          const rates = tender.proposedVessels?.map(v => `RM ${v.proposedRate}`).join(', ') || 'N/A';
                          const completionDate = calculateCompletionDate(tender.commencementDate, tender.duration);
                          
                          return (
                            <React.Fragment key={tender._id}>
                              <TableRow 
                                hover
                                sx={{ 
                                  '&:hover': { bgcolor: '#F9FAFB' },
                                  transition: 'background-color 0.2s',
                                }}
                              >
                                {visibleColumns.tenderNo && (
                                  <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif' }}>
                                    <Chip 
                                      label={tender.tenderNo || 'N/A'} 
                                      size="small"
                                      sx={{ 
                                        fontWeight: 600, 
                                        bgcolor: '#E5E7EB',
                                        fontFamily: '"Inter", sans-serif',
                                        fontSize: '0.7rem',
                                      }}
                                    />
                                  </TableCell>
                                )}
                                {visibleColumns.client && (
                                  <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', fontWeight: 500, color: '#111827', fontSize: '0.8rem' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Avatar sx={{ width: 24, height: 24, bgcolor: '#1976d2', borderRadius: 1.5 }}>
                                        <TenderIcon sx={{ fontSize: 12, color: 'white' }} />
                                      </Avatar>
                                      {clientName}
                                    </Box>
                                  </TableCell>
                                )}
                                {visibleColumns.projectDetails && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{tender.projectDetails || '-'}</TableCell>}
                                {visibleColumns.proposedVessel && (
                                  <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>
                                    {tender.proposedVessels?.map((v, i) => (
                                      <Chip 
                                        key={i} 
                                        label={getVesselDisplayName(v)} 
                                        size="small" 
                                        sx={{ 
                                          m: 0.2, 
                                          fontFamily: '"Inter", sans-serif',
                                          bgcolor: v.isThirdParty ? '#FEF3C7' : '#D1FAE5',
                                          color: v.isThirdParty ? '#92400E' : '#065F46',
                                          border: v.isThirdParty ? '1px solid #F59E0B' : '1px solid #10B981',
                                        }}
                                      />
                                    ))}
                                  </TableCell>
                                )}
                                {visibleColumns.vesselType && (
                                  <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.75rem' }}>
                                    {tender.proposedVessels?.map((v, i) => (
                                      <Chip 
                                        key={i} 
                                        label={getVesselType(v)} 
                                        size="small"
                                        sx={{ 
                                          m: 0.2, 
                                          fontFamily: '"Inter", sans-serif',
                                          bgcolor: v.isThirdParty ? '#FEF3C7' : '#D1FAE5',
                                          color: v.isThirdParty ? '#92400E' : '#065F46',
                                          fontSize: '0.6rem',
                                          height: 20,
                                        }}
                                      />
                                    ))}
                                  </TableCell>
                                )}
                                {visibleColumns.proposedRate && (
                                  <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>
                                    {tender.proposedVessels?.map((v, i) => (
                                      <Chip key={i} label={`RM ${v.proposedRate}`} size="small" variant="outlined" sx={{ m: 0.2, fontFamily: '"Inter", sans-serif' }} />
                                    ))}
                                  </TableCell>
                                )}
                                {visibleColumns.period && (
                                  <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.75rem' }}>
                                    {tender.commencementDate ? new Date(tender.commencementDate).toLocaleDateString() : 'N/A'} to{' '}
                                    <span style={{ opacity: 0.6 }}>
                                      {completionDate ? new Date(completionDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                  </TableCell>
                                )}
                                {visibleColumns.duration && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{tender.duration || '-'} days</TableCell>}
                                {visibleColumns.status && (
                                  <TableCell sx={{ py: 2, border: 'none' }}>
                                    <Chip 
                                      label={tender.status} 
                                      color={getStatusColor(tender.status)} 
                                      size="small"
                                      icon={statusIconMap[tender.status] || null}
                                      sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif', borderRadius: '9999px' }}
                                    />
                                  </TableCell>
                                )}
                                {visibleColumns.chances && (
                                  <TableCell sx={{ py: 2, border: 'none' }}>
                                    <Chip 
                                      label={tender.chances || 'N/A'} 
                                      size="small" 
                                      variant="outlined"
                                      sx={{
                                        borderColor: tender.chances === 'High' ? '#4caf50' :
                                                   tender.chances === 'Medium' ? '#ff9800' :
                                                   tender.chances === 'Low' ? '#f44336' : '#9e9e9e',
                                        color: tender.chances === 'High' ? '#4caf50' :
                                               tender.chances === 'Medium' ? '#ff9800' :
                                               tender.chances === 'Low' ? '#f44336' : '#9e9e9e',
                                        fontFamily: '"Inter", sans-serif',
                                        fontWeight: 500,
                                      }}
                                    />
                                  </TableCell>
                                )}
                                {visibleColumns.remarks && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>{tender.remarks || '-'}</TableCell>}
                                {visibleColumns.submittedDate && <TableCell sx={{ py: 2, border: 'none', fontFamily: '"Inter", sans-serif', color: '#6B7280', fontSize: '0.8rem' }}>
                                  {tender.submittedDate ? new Date(tender.submittedDate).toLocaleDateString() : 'N/A'}
                                </TableCell>}
                                {visibleColumns.actions && (
                                  <TableCell sx={{ py: 2, border: 'none', textAlign: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                                      <Tooltip title="Edit">
                                        <IconButton size="small" onClick={() => handleOpenDialog(tender)} sx={{ color: '#6B7280', '&:hover': { color: '#1976d2' } }}>
                                          <EditIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Delete">
                                        <IconButton size="small" onClick={() => handleDelete(tender._id)} sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}>
                                          <DeleteIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Expand Details">
                                        <IconButton size="small" onClick={() => toggleRow(tender._id)} sx={{ color: '#6B7280' }}>
                                          {expandedRows[tender._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </TableCell>
                                )}
                              </TableRow>
                              {visibleColumns.actions && (
                                <TableRow>
                                  <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} style={{ paddingBottom: 0, paddingTop: 0 }}>
                                    <Collapse in={expandedRows[tender._id]} timeout="auto" unmountOnExit>
                                      <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 2, m: 1 }}>
                                        <Grid container spacing={2}>
                                          <Grid item xs={6}>
                                            <Typography variant="subtitle2" sx={{ color: '#6B7280', fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Tender No:</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif', color: '#111827' }}>{tender.tenderNo || 'N/A'}</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="subtitle2" sx={{ color: '#6B7280', fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Project Details:</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif', color: '#111827' }}>{tender.projectDetails || 'N/A'}</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="subtitle2" sx={{ color: '#6B7280', fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Location:</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif', color: '#111827' }}>{tender.location || 'N/A'}</Typography>
                                          </Grid>
                                          <Grid item xs={12}>
                                            <Typography variant="subtitle2" sx={{ color: '#6B7280', fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Proposed Vessels & Rates:</Typography>
                                            {tender.proposedVessels?.map((v, i) => (
                                              <Typography key={i} variant="body2" sx={{ fontFamily: '"Inter", sans-serif', color: '#111827' }}>
                                                {getVesselDisplayName(v)} [{getVesselType(v)}]: RM {v.proposedRate}
                                              </Typography>
                                            ))}
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="subtitle2" sx={{ color: '#6B7280', fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Commencement Date:</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif', color: '#111827' }}>
                                              {tender.commencementDate ? new Date(tender.commencementDate).toLocaleDateString() : 'N/A'}
                                            </Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="subtitle2" sx={{ color: '#6B7280', fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Completion Date:</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif', color: '#111827' }}>
                                              {completionDate ? new Date(completionDate).toLocaleDateString() : 'N/A'}
                                            </Typography>
                                          </Grid>
                                        </Grid>
                                      </Box>
                                    </Collapse>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* ============ DIALOG WITH VESSEL TYPE TOGGLE ============ */}
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
              <TenderIcon sx={{ color: 'white', fontSize: 22 }} />
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
                {editingTender ? 'Edit Tender' : 'Add Tender'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#6B7280',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {editingTender ? 'Update tender information' : 'Enter tender details below'}
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
            {/* Tender Number - Manual Entry */}
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
                Tender Number
              </Typography>
              <TextField
                fullWidth
                name="tenderNo"
                value={formData.tenderNo}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 2026-001"
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

            {/* Client */}
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

            {/* Project Details */}
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
                Project Details (Vessel Speed & Seat Capacity)
              </Typography>
              <TextField
                fullWidth
                name="projectDetails"
                value={formData.projectDetails}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., FCB 25KNT/80PAX"
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

            {/* Location */}
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
                Location
              </Typography>
              <TextField
                fullWidth
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., Offshore Malaysia"
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

            {/* Proposed Vessels with Type Toggle */}
            <Grid item xs={12}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#6B7280', 
                  display: 'block', 
                  mb: 1,
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Proposed Vessels <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              
              {formData.proposedVessels.map((item, index) => (
                <Box key={index} sx={{ 
                  mb: 2, 
                  p: 2, 
                  bgcolor: '#F9FAFB', 
                  borderRadius: 2,
                  border: '1px solid #E5E7EB',
                }}>
                  {/* Vessel Type Toggle */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>
                      Vessel #{index + 1}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontFamily: '"Inter", sans-serif', color: item.isThirdParty ? '#6B7280' : '#1976d2' }}>
                        Owned Fleet
                      </Typography>
                      <Switch
                        checked={item.isThirdParty}
                        onChange={(e) => handleVesselTypeToggle(index, e.target.checked)}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#F59E0B',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#F59E0B',
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ fontFamily: '"Inter", sans-serif', color: item.isThirdParty ? '#F59E0B' : '#6B7280' }}>
                        3rd Party
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    {item.isThirdParty ? (
                      // 3rd Party Vessel - Manual Entry
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Vessel Name"
                          value={item.vesselName}
                          onChange={(e) => handleVesselChange(index, 'vesselName', e.target.value)}
                          variant="outlined"
                          placeholder="Enter 3rd party vessel name"
                          size="small"
                          sx={{ 
                            '& .MuiOutlinedInput-root': { 
                              borderRadius: 2,
                              bgcolor: 'white',
                              '& fieldset': { border: '1px solid #E5E7EB' },
                              '&:hover': { borderColor: '#F59E0B' },
                              '&.Mui-focused': { 
                                boxShadow: '0 0 0 3px rgba(245,158,11,0.15)',
                                '& fieldset': { border: '1px solid #F59E0B' },
                              }
                            },
                            '& .MuiInputBase-input': {
                              fontFamily: '"Inter", sans-serif',
                              fontSize: '0.875rem',
                              py: 1.5,
                            },
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#F59E0B', display: 'block', mt: 0.5, fontFamily: '"Inter", sans-serif' }}>
                          <PersonAddIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} /> 3rd Party Vessel
                        </Typography>
                      </Grid>
                    ) : (
                      // Owned Vessel - From Vessel List
                      <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                          <InputLabel sx={{ fontFamily: '"Inter", sans-serif' }}>Select Vessel</InputLabel>
                          <Select
                            value={item.vessel}
                            onChange={(e) => handleVesselChange(index, 'vessel', e.target.value)}
                            label="Select Vessel"
                            sx={{ 
                              borderRadius: 2,
                              bgcolor: 'white',
                              '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #E5E7EB' },
                              '&:hover': { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' } },
                              '&.Mui-focused': { 
                                boxShadow: '0 0 0 3px rgba(25,118,210,0.15)',
                                '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #1976d2' },
                              },
                              '& .MuiSelect-select': {
                                fontFamily: '"Inter", sans-serif',
                                fontSize: '0.875rem',
                                py: 1.5,
                              },
                            }}
                          >
                            <MenuItem value="">Select from Fleet</MenuItem>
                            {vessels.map((vessel) => (
                              <MenuItem key={vessel._id} value={vessel._id}>{vessel.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Typography variant="caption" sx={{ color: '#1976d2', display: 'block', mt: 0.5, fontFamily: '"Inter", sans-serif' }}>
                          <BusinessIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} /> From your fleet
                        </Typography>
                      </Grid>
                    )}

                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Rate (RM)"
                        type="number"
                        value={item.proposedRate}
                        onChange={(e) => handleVesselChange(index, 'proposedRate', e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            borderRadius: 2,
                            bgcolor: 'white',
                            '& fieldset': { border: '1px solid #E5E7EB' },
                            '&:hover': { '& fieldset': { borderColor: '#1976d2' } },
                            '&.Mui-focused': { 
                              boxShadow: '0 0 0 3px rgba(25,118,210,0.15)',
                              '& fieldset': { border: '1px solid #1976d2' },
                            }
                          },
                          '& .MuiInputBase-input': {
                            fontFamily: '"Inter", sans-serif',
                            fontSize: '0.875rem',
                            py: 1.5,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => removeVesselRow(index)}
                        disabled={formData.proposedVessels.length === 1}
                        fullWidth
                        sx={{ 
                          borderRadius: 2, 
                          textTransform: 'none', 
                          fontFamily: '"Inter", sans-serif',
                          borderColor: '#E5E7EB',
                          color: '#6B7280',
                          height: '100%',
                          '&:hover': { borderColor: '#ef4444', color: '#ef4444', bgcolor: 'rgba(239,68,68,0.04)' },
                        }}
                      >
                        Remove
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ))}

              <Button 
                variant="outlined" 
                onClick={addVesselRow} 
                sx={{ 
                  mt: 1, 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontFamily: '"Inter", sans-serif',
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': { bgcolor: 'rgba(25,118,210,0.04)' },
                }}
                startIcon={<AddIcon />}
              >
                Add Vessel
              </Button>
            </Grid>

            {/* Dates */}
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
                Submitted Date
              </Typography>
              <TextField
                fullWidth
                name="submittedDate"
                type="date"
                value={formData.submittedDate}
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
                Completion Date (Auto-calculated)
              </Typography>
              <TextField
                fullWidth
                value={calculateCompletionDate(formData.commencementDate, formData.duration) || ''}
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
                Status
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="status"
                  value={formData.status}
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
                Chances
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="chances"
                  value={formData.chances}
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
                  <MenuItem value="">Select Chances</MenuItem>
                  {chancesOptions.map((option) => (
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
            {saving ? 'Saving...' : editingTender ? 'Update Tender' : 'Create Tender'}
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

export default Tenders;