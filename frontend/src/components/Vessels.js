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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  DirectionsBoat as VesselIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  CheckCircle as ActiveIcon,
  Cancel as SoldIcon,
} from '@mui/icons-material';

const API_URL = 'http://localhost:5005/api';

function Vessels() {
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVessel, setEditingVessel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    imoNumber: '',
    indType: '',
    flag: '',
    year: '',
    grt: '',
    speed: '',
    totalSeat: '',
    status: 'Active',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState('Vessel Spec');
  const [saving, setSaving] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusVessel, setStatusVessel] = useState(null);
  const [newStatus, setNewStatus] = useState('Active');

  useEffect(() => {
    fetchVessels();
  }, []);

  const fetchVessels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/vessels`);
      setVessels(response.data);
    } catch (error) {
      console.error('Error fetching vessels:', error);
      showSnackbar('Cannot connect to backend. Please make sure server is running.', 'error');
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

  const handleOpenDialog = (vessel = null) => {
    if (vessel) {
      setEditingVessel(vessel);
      setFormData({
        name: vessel.name || '',
        imoNumber: vessel.imoNumber || '',
        indType: vessel.indType || '',
        flag: vessel.flag || '',
        year: vessel.year || '',
        grt: vessel.grt || '',
        speed: vessel.speed || '',
        totalSeat: vessel.totalSeat || '',
        status: vessel.status || 'Active',
      });
    } else {
      setEditingVessel(null);
      setFormData({
        name: '',
        imoNumber: '',
        indType: '',
        flag: '',
        year: '',
        grt: '',
        speed: '',
        totalSeat: '',
        status: 'Active',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVessel(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      if (!formData.name.trim()) {
        showSnackbar('Vessel name is required', 'error');
        setSaving(false);
        return;
      }

      if (editingVessel) {
        await axios.put(`${API_URL}/vessels/${editingVessel._id}`, formData);
        showSnackbar('Vessel updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/vessels`, formData);
        showSnackbar('Vessel created successfully! 🎉');
      }
      handleCloseDialog();
      fetchVessels();
    } catch (error) {
      console.error('Error saving vessel:', error);
      showSnackbar(error.response?.data?.error || 'Error saving vessel.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vessel?')) {
      try {
        await axios.delete(`${API_URL}/vessels/${id}`);
        showSnackbar('Vessel deleted successfully');
        fetchVessels();
      } catch (error) {
        console.error('Error deleting vessel:', error);
        showSnackbar('Error deleting vessel', 'error');
      }
    }
  };

  const handleUploadDialog = (vessel) => {
    setSelectedVessel(vessel);
    setSelectedFile(null);
    setDocType('Vessel Spec');
    setUploadDialog(true);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showSnackbar('Please select a file', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('name', docType);

    try {
      await axios.post(`${API_URL}/vessels/${selectedVessel._id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showSnackbar('Document uploaded successfully');
      setUploadDialog(false);
      fetchVessels();
    } catch (error) {
      console.error('Error uploading document:', error);
      showSnackbar('Error uploading document', 'error');
    }
  };

  const handleDownload = (doc) => {
    const fileName = doc.filePath.split('\\').pop();
    window.open(`http://localhost:5005/uploads/${fileName}`, '_blank');
  };

  const handleOpenStatusDialog = (vessel) => {
    setStatusVessel(vessel);
    setNewStatus(vessel.status || 'Active');
    setStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setStatusDialog(false);
    setStatusVessel(null);
  };

  const handleStatusUpdate = async () => {
    try {
      await axios.put(`${API_URL}/vessels/${statusVessel._id}`, { status: newStatus });
      showSnackbar(`Status updated to ${newStatus}! 🎉`);
      handleCloseStatusDialog();
      fetchVessels();
    } catch (error) {
      console.error('Error updating status:', error);
      showSnackbar('Error updating status', 'error');
    }
  };

  // ============ STATUS STYLES - PILL SHAPE ============
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Active':
        return {
          bgcolor: alpha('#22c55e', 0.12),
          color: '#15803d',
          borderColor: alpha('#22c55e', 0.2),
        };
      case 'Available':
        return {
          bgcolor: alpha('#3b82f6', 0.12),
          color: '#1d4ed8',
          borderColor: alpha('#3b82f6', 0.2),
        };
      case 'Sold':
        return {
          bgcolor: alpha('#ef4444', 0.12),
          color: '#b91c1c',
          borderColor: alpha('#ef4444', 0.2),
        };
      case 'Under Maintenance':
        return {
          bgcolor: alpha('#f59e0b', 0.12),
          color: '#b45309',
          borderColor: alpha('#f59e0b', 0.2),
        };
      default:
        return {
          bgcolor: alpha('#6b7280', 0.12),
          color: '#4b5563',
          borderColor: alpha('#6b7280', 0.2),
        };
    }
  };

  // ============ FILTER VESSELS ============
  const activeVesselsList = vessels.filter(v => v.status === 'Active' || v.status === 'Available');
  const soldVesselsList = vessels.filter(v => v.status === 'Sold');
  const maintenanceVesselsList = vessels.filter(v => v.status === 'Under Maintenance');

  // ============ STATS ============
  const totalVessels = vessels.length;
  const totalDocuments = vessels.reduce((sum, v) => sum + (v.documents?.length || 0), 0);
  const fleetTypes = new Set(vessels.map(v => v.indType)).size;
  const activeVessels = vessels.filter(v => v.status === 'Active' || v.status === 'Available').length;

  // ============ RENDER TABLE FUNCTION ============
  const renderVesselTable = (vesselList, title, statusType, icon) => {
    if (vesselList.length === 0) {
      return (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {icon}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
              {title}
            </Typography>
            <Chip label="0" size="small" sx={{ bgcolor: '#F3F4F6', fontWeight: 500 }} />
          </Box>
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: '#F9FAFB' }}>
            <Typography color="textSecondary">No {title.toLowerCase()} vessels</Typography>
          </Paper>
        </Box>
      );
    }

    return (
      <Box sx={{ mb: 4 }}>
        {/* Section Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
            {title}
          </Typography>
          <Chip 
            label={vesselList.length} 
            size="small" 
            sx={{ 
              bgcolor: statusType === 'active' ? '#22c55e' : '#ef4444',
              color: 'white',
              fontWeight: 600,
            }} 
          />
        </Box>

        {/* Table */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 3, 
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            border: statusType === 'active' ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <Table sx={{ borderCollapse: 'collapse' }}>
            {/* Header */}
            <TableHead>
              <TableRow sx={{ 
                bgcolor: statusType === 'active' ? '#F0FDF4' : '#FEF2F2',
                borderBottom: '1px solid #E5E7EB',
              }}>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  color: '#111827', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: '"Inter", sans-serif',
                  py: 2.5,
                  border: 'none',
                }}>
                  Vessel
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  color: '#111827', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: '"Inter", sans-serif',
                  py: 2.5,
                  border: 'none',
                }}>
                  IMO
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  color: '#111827', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: '"Inter", sans-serif',
                  py: 2.5,
                  border: 'none',
                }}>
                  Type
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  color: '#111827', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: '"Inter", sans-serif',
                  py: 2.5,
                  border: 'none',
                }}>
                  Flag
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  color: '#111827', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: '"Inter", sans-serif',
                  py: 2.5,
                  border: 'none',
                }}>
                  Year
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  color: '#111827', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: '"Inter", sans-serif',
                  py: 2.5,
                  border: 'none',
                }}>
                  GRT
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  color: '#111827', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: '"Inter", sans-serif',
                  py: 2.5,
                  border: 'none',
                }}>
                  Speed
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  color: '#111827', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: '"Inter", sans-serif',
                  py: 2.5,
                  border: 'none',
                }}>
                  Seats
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  color: '#111827', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: '"Inter", sans-serif',
                  py: 2.5,
                  border: 'none',
                }}>
                  Status
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  color: '#111827', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: '"Inter", sans-serif',
                  py: 2.5,
                  border: 'none',
                }}>
                  Docs
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  color: '#111827', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: '"Inter", sans-serif',
                  py: 2.5,
                  border: 'none',
                }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {vesselList.map((vessel, index) => (
                <TableRow 
                  key={vessel._id} 
                  hover
                  sx={{ 
                    '&:hover': { bgcolor: '#F9FAFB' },
                    transition: 'background-color 0.2s',
                    borderBottom: index < vesselList.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}
                >
                  <TableCell sx={{ py: 3, border: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: statusType === 'active' ? '#22c55e' : '#ef4444',
                          borderRadius: 1.5,
                        }}
                      >
                        <VesselIcon sx={{ fontSize: 16, color: 'white' }} />
                      </Avatar>
                      <Typography sx={{ 
                        fontWeight: 500, 
                        color: '#111827',
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '0.875rem',
                      }}>
                        {vessel.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#6B7280', 
                    fontSize: '0.875rem',
                    fontFamily: '"Inter", sans-serif',
                    py: 3,
                    border: 'none',
                  }}>
                    {vessel.imoNumber || '-'}
                  </TableCell>
                  <TableCell sx={{ py: 3, border: 'none' }}>
                    <Chip 
                      label={vessel.indType || 'N/A'} 
                      size="small" 
                      sx={{ 
                        bgcolor: '#F3F4F6', 
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        color: '#6B7280',
                        borderRadius: 1,
                        fontFamily: '"Inter", sans-serif',
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#6B7280', 
                    fontSize: '0.875rem',
                    fontFamily: '"Inter", sans-serif',
                    py: 3,
                    border: 'none',
                  }}>
                    {vessel.flag || '-'}
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#6B7280', 
                    fontSize: '0.875rem',
                    fontFamily: '"Inter", sans-serif',
                    py: 3,
                    border: 'none',
                  }}>
                    {vessel.year || '-'}
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#6B7280', 
                    fontSize: '0.875rem',
                    fontFamily: '"Inter", sans-serif',
                    py: 3,
                    border: 'none',
                  }}>
                    {vessel.grt || '-'}
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#6B7280', 
                    fontSize: '0.875rem',
                    fontFamily: '"Inter", sans-serif',
                    py: 3,
                    border: 'none',
                  }}>
                    {vessel.speed || '-'}
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#6B7280', 
                    fontSize: '0.875rem',
                    fontFamily: '"Inter", sans-serif',
                    py: 3,
                    border: 'none',
                  }}>
                    {vessel.totalSeat || '-'}
                  </TableCell>
                  
                  {/* Status - Pill Shape */}
                  <TableCell sx={{ py: 3, border: 'none' }}>
                    <Chip
                      label={vessel.status || 'Available'}
                      size="small"
                      onClick={() => handleOpenStatusDialog(vessel)}
                      sx={{ 
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        fontFamily: '"Inter", sans-serif',
                        borderRadius: '9999px',
                        height: 28,
                        px: 1.5,
                        bgcolor: getStatusStyles(vessel.status).bgcolor,
                        color: getStatusStyles(vessel.status).color,
                        border: `1px solid ${getStatusStyles(vessel.status).borderColor}`,
                        '&:hover': {
                          opacity: 0.8,
                        },
                        '& .MuiChip-label': {
                          px: 1.5,
                        }
                      }}
                    />
                  </TableCell>
                  
                  <TableCell sx={{ py: 3, border: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      {vessel.documents?.map((doc, index) => (
                        <Chip
                          key={index}
                          label={doc.name}
                          size="small"
                          onClick={() => handleDownload(doc)}
                          sx={{ 
                            m: 0.2,
                            cursor: 'pointer',
                            bgcolor: '#EEF2FF',
                            color: '#4338CA',
                            fontSize: '0.6rem',
                            height: 20,
                            fontFamily: '"Inter", sans-serif',
                            '&:hover': { bgcolor: '#C7D2FE' }
                          }}
                        />
                      ))}
                      <Tooltip title="Upload Document">
                        <IconButton 
                          size="small" 
                          onClick={() => handleUploadDialog(vessel)}
                          sx={{ 
                            color: '#6B7280',
                            '&:hover': { color: '#1976d2' }
                          }}
                        >
                          <UploadIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 3, border: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Edit Vessel">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDialog(vessel)} 
                          sx={{ 
                            color: '#6B7280',
                            '&:hover': { color: '#1976d2', bgcolor: 'rgba(25,118,210,0.08)' }
                          }}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Vessel">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(vessel._id)}
                          sx={{ 
                            color: '#6B7280',
                            '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' }
                          }}
                        >
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
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ fontFamily: '"Inter", sans-serif' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            color: '#111827', 
            mb: 0.5,
            fontFamily: '"Inter", sans-serif',
          }}
        >
          Fleet Directory
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#6B7280',
            fontFamily: '"Inter", sans-serif',
          }}
        >
          Manage your vessel fleet and documentation
        </Typography>
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
                <VesselIcon sx={{ fontSize: 22 }} />
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
                  {totalVessels}
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
                <UploadIcon sx={{ fontSize: 22 }} />
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
                  Total Documents
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
                  {totalDocuments}
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
                  color: '#22c55e',
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                }}
              >
                <ActiveIcon sx={{ fontSize: 22 }} />
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
                  Active Vessels
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
                  {activeVessels}
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
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                }}
              >
                <SoldIcon sx={{ fontSize: 22 }} />
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
                  Sold Vessels
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
                  {soldVesselsList.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
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
          Add New Vessel
        </Button>
      </Box>

      {/* ============ ACTIVE VESSELS TABLE ============ */}
      {renderVesselTable(
        activeVesselsList, 
        'Active Vessels', 
        'active',
        <ActiveIcon sx={{ color: '#22c55e', fontSize: 28 }} />
      )}

      {/* ============ SOLD VESSELS TABLE ============ */}
      {renderVesselTable(
        soldVesselsList, 
        'Sold Vessels', 
        'sold',
        <SoldIcon sx={{ color: '#ef4444', fontSize: 28 }} />
      )}

      {/* ============ UNDER MAINTENANCE VESSELS TABLE ============ */}
      {maintenanceVesselsList.length > 0 && renderVesselTable(
        maintenanceVesselsList, 
        'Under Maintenance', 
        'maintenance',
        <PendingIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
      )}

      {/* ============ MODALS (unchanged from your original) ============ */}
      
      {/* Add/Edit Dialog */}
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
              <VesselIcon sx={{ color: 'white', fontSize: 22 }} />
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
                {editingVessel ? 'Edit Vessel' : 'Add Vessel'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#6B7280',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {editingVessel ? 'Update vessel information' : 'Enter vessel details below'}
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
                Vessel Name <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., MV Jali Sia"
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
                IMO Number
              </Typography>
              <TextField
                fullWidth
                name="imoNumber"
                value={formData.imoNumber}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., IMO 1234567"
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
                Vessel Type
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="indType"
                  value={formData.indType}
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
                  <MenuItem value="">Select Type</MenuItem>
                  <MenuItem value="FOB">FOB</MenuItem>
                  <MenuItem value="FCB">FCB</MenuItem>
                  <MenuItem value="PSV">PSV</MenuItem>
                  <MenuItem value="AHTS">AHTS</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
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
                Flag
              </Typography>
              <TextField
                fullWidth
                name="flag"
                value={formData.flag}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., Malaysia"
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
                Year Built
              </Typography>
              <TextField
                fullWidth
                name="year"
                type="number"
                value={formData.year}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 2020"
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
                GRT
              </Typography>
              <TextField
                fullWidth
                name="grt"
                type="number"
                value={formData.grt}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 300"
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
                Speed (knots)
              </Typography>
              <TextField
                fullWidth
                name="speed"
                value={formData.speed}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 12.5"
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
                Total Seat / Pax
              </Typography>
              <TextField
                fullWidth
                name="totalSeat"
                type="number"
                value={formData.totalSeat}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., 60"
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
                  <MenuItem value="Active">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 18 }} />
                      <Typography fontFamily='"Inter", sans-serif'>Active</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Available">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon sx={{ color: '#3b82f6', fontSize: 18 }} />
                      <Typography fontFamily='"Inter", sans-serif'>Available</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Sold">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CancelIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                      <Typography fontFamily='"Inter", sans-serif'>Sold</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Under Maintenance">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PendingIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                      <Typography fontFamily='"Inter", sans-serif'>Under Maintenance</Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
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
            {saving ? 'Saving...' : editingVessel ? 'Update Vessel' : 'Create Vessel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog 
        open={statusDialog} 
        onClose={handleCloseStatusDialog} 
        maxWidth="xs" 
        fullWidth
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
          p: 3,
          pb: 1.5,
          bgcolor: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#1976d2', width: 36, height: 36, borderRadius: '12px' }}>
              <VesselIcon sx={{ color: 'white', fontSize: 18 }} />
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
                Update Status
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#6B7280',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {statusVessel?.name || ''}
              </Typography>
            </Box>
          </Box>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <FormControl fullWidth>
            <InputLabel 
              sx={{ 
                fontFamily: '"Inter", sans-serif',
                color: '#6B7280',
              }}
            >
              Status
            </InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Status"
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
              <MenuItem value="Active">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon sx={{ color: '#22c55e' }} />
                  <Box>
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      fontFamily='"Inter", sans-serif'
                    >
                      Active
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="#6B7280"
                      fontFamily='"Inter", sans-serif'
                    >
                      Vessel is currently in operation
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value="Available">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon sx={{ color: '#3b82f6' }} />
                  <Box>
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      fontFamily='"Inter", sans-serif'
                    >
                      Available
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="#6B7280"
                      fontFamily='"Inter", sans-serif'
                    >
                      Vessel is ready for charter
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value="Sold">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CancelIcon sx={{ color: '#ef4444' }} />
                  <Box>
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      fontFamily='"Inter", sans-serif'
                    >
                      Sold
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="#6B7280"
                      fontFamily='"Inter", sans-serif'
                    >
                      Vessel has been sold
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value="Under Maintenance">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PendingIcon sx={{ color: '#f59e0b' }} />
                  <Box>
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      fontFamily='"Inter", sans-serif'
                    >
                      Under Maintenance
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="#6B7280"
                      fontFamily='"Inter", sans-serif'
                    >
                      Vessel is being serviced
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3,
          pt: 1,
          gap: 2,
          bgcolor: '#F9FAFB',
          borderTop: '1px solid #E5E7EB',
        }}>
          <Button 
            onClick={handleCloseStatusDialog} 
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
            onClick={handleStatusUpdate} 
            variant="contained"
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
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              label="Document Type"
            >
              <MenuItem value="Vessel Spec">Vessel Spec</MenuItem>
              <MenuItem value="GA Plan">GA Plan</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <input type="file" onChange={handleFileChange} style={{ width: '100%' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained">Upload</Button>
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

export default Vessels;