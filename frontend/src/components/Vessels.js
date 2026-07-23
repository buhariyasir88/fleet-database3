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
  ListItemIcon,
  ListItemText,
  Popover,
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
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  RemoveCircle as RemoveCircleIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Anchor as AnchorIcon,
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

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
    // NEW: Vessel info fields
    currentContract: '',
    location: '',
    charterer: '',
    nextDryDock: '',
    additionalInfo: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [linkDialog, setLinkDialog] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [linkData, setLinkData] = useState({
    name: 'Vessel Spec',
    url: '',
  });
  const [saving, setSaving] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusVessel, setStatusVessel] = useState(null);
  const [newStatus, setNewStatus] = useState('Active');
  const [docMenuAnchor, setDocMenuAnchor] = useState(null);
  const [docMenuData, setDocMenuData] = useState(null);
  // ============ NEW: Popover state ============
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [popoverVessel, setPopoverVessel] = useState(null);

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

  // ============ POPOVER FUNCTIONS ============
  const handlePopoverOpen = (event, vessel) => {
    setPopoverAnchor(event.currentTarget);
    setPopoverVessel(vessel);
  };

  const handlePopoverClose = () => {
    setPopoverAnchor(null);
    setPopoverVessel(null);
  };

  const isPopoverOpen = Boolean(popoverAnchor);

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
        // NEW: Populate vessel info fields
        currentContract: vessel.currentContract || '',
        location: vessel.location || '',
        charterer: vessel.charterer || '',
        nextDryDock: vessel.nextDryDock || '',
        additionalInfo: vessel.additionalInfo || '',
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
        currentContract: '',
        location: '',
        charterer: '',
        nextDryDock: '',
        additionalInfo: '',
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

      // Prepare data with vessel info fields
      const vesselData = {
        name: formData.name,
        imoNumber: formData.imoNumber,
        indType: formData.indType,
        flag: formData.flag,
        year: formData.year,
        grt: formData.grt,
        speed: formData.speed,
        totalSeat: formData.totalSeat,
        status: formData.status,
        currentContract: formData.currentContract,
        location: formData.location,
        charterer: formData.charterer,
        nextDryDock: formData.nextDryDock,
        additionalInfo: formData.additionalInfo,
      };

      if (editingVessel) {
        await axios.put(`${API_URL}/vessels/${editingVessel._id}`, vesselData);
        showSnackbar('Vessel updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/vessels`, vesselData);
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

  // ============ LINK DIALOG FUNCTIONS ============
  const handleLinkDialogOpen = (vessel) => {
    setSelectedVessel(vessel);
    setLinkData({
      name: 'Vessel Spec',
      url: '',
    });
    setLinkDialog(true);
  };

  const handleLinkDialogClose = () => {
    setLinkDialog(false);
    setSelectedVessel(null);
    setLinkData({
      name: 'Vessel Spec',
      url: '',
    });
  };

  const handleLinkInputChange = (e) => {
    setLinkData({ ...linkData, [e.target.name]: e.target.value });
  };

  const handleAddLink = async () => {
    if (!linkData.url.trim()) {
      showSnackbar('Please enter a valid URL', 'error');
      return;
    }

    try {
      new URL(linkData.url);
    } catch (e) {
      showSnackbar('Please enter a valid URL (e.g., https://... )', 'error');
      return;
    }

    setSavingLink(true);
    try {
      await axios.post(
        `${API_URL}/vessels/${selectedVessel._id}/documents`,
        {
          name: linkData.name,
          url: linkData.url,
          isLink: true,
        }
      );
      showSnackbar('Document link added successfully! 🔗');
      handleLinkDialogClose();
      fetchVessels();
    } catch (error) {
      console.error('Error adding link:', error);
      showSnackbar(error.response?.data?.error || 'Error adding link', 'error');
    } finally {
      setSavingLink(false);
    }
  };

  const handleOpenLink = (doc) => {
    if (!doc || !doc.url) {
      showSnackbar('No link available', 'error');
      return;
    }
    window.open(doc.url, '_blank');
  };

  const handleRemoveDocument = async (vesselId, docIndex) => {
    if (!window.confirm('Are you sure you want to remove this document?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/vessels/${vesselId}/documents/${docIndex}`);
      showSnackbar('Document removed successfully! 🗑️');
      fetchVessels();
    } catch (error) {
      console.error('Error removing document:', error);
      showSnackbar(error.response?.data?.error || 'Error removing document', 'error');
    }
    handleDocMenuClose();
  };

  const handleDocMenuOpen = (event, vessel, doc, docIndex) => {
    setDocMenuAnchor(event.currentTarget);
    setDocMenuData({ vessel, doc, docIndex });
  };

  const handleDocMenuClose = () => {
    setDocMenuAnchor(null);
    setDocMenuData(null);
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

  // ============ STATUS STYLES ============
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
  const activeVessels = vessels.filter(v => v.status === 'Active' || v.status === 'Available');
  const soldVessels = vessels.filter(v => v.status === 'Sold');
  const maintenanceVessels = vessels.filter(v => v.status === 'Under Maintenance');

  // ============ STATS ============
  const totalVessels = vessels.length;
  const totalDocuments = vessels.reduce((sum, v) => sum + (v.documents?.length || 0), 0);
  const fleetTypes = new Set(vessels.map(v => v.indType)).size;
  const activeVesselsCount = vessels.filter(v => v.status === 'Active' || v.status === 'Available').length;

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
            <Typography color="textSecondary">No {title.toLowerCase()}</Typography>
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
              bgcolor: statusType === 'active' ? '#22c55e' : statusType === 'sold' ? '#ef4444' : '#f59e0b',
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
            border: statusType === 'active' ? '1px solid rgba(34,197,94,0.2)' : 
                    statusType === 'sold' ? '1px solid rgba(239,68,68,0.2)' : 
                    '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <Table sx={{ borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow sx={{ 
                bgcolor: statusType === 'active' ? '#F0FDF4' : 
                        statusType === 'sold' ? '#FEF2F2' : 
                        '#FFFBEB',
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
                  {/* ============ VESSEL NAME WITH HOVER POPOVER ============ */}
                  <TableCell sx={{ py: 3, border: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: statusType === 'active' ? '#22c55e' : 
                                  statusType === 'sold' ? '#ef4444' : '#f59e0b',
                          borderRadius: 1.5,
                        }}
                      >
                        <VesselIcon sx={{ fontSize: 16, color: 'white' }} />
                      </Avatar>
                      <Typography 
                        sx={{ 
                          fontWeight: 500, 
                          color: '#111827',
                          fontFamily: '"Inter", sans-serif',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textDecorationColor: 'transparent',
                          '&:hover': {
                            textDecorationColor: '#1976d2',
                            color: '#1976d2',
                          }
                        }}
                        onMouseEnter={(e) => handlePopoverOpen(e, vessel)}
                        onMouseLeave={handlePopoverClose}
                      >
                        {vessel.name}
                      </Typography>
                      {/* Info Icon indicator */}
                      {(vessel.currentContract || vessel.location || vessel.charterer) && (
                        <InfoIcon 
                          sx={{ 
                            fontSize: 14, 
                            color: '#94a3b8',
                            cursor: 'help',
                          }}
                          onMouseEnter={(e) => handlePopoverOpen(e, vessel)}
                          onMouseLeave={handlePopoverClose}
                        />
                      )}
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
                  
                  {/* Docs Column with Link Buttons */}
                  <TableCell sx={{ py: 3, border: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      {vessel.documents?.map((doc, docIndex) => (
                        <Box key={docIndex} sx={{ display: 'inline-flex', alignItems: 'center' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<LinkIcon />}
                            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleOpenLink(doc)}
                            sx={{
                              m: 0.2,
                              fontSize: '0.6rem',
                              textTransform: 'none',
                              fontFamily: '"Inter", sans-serif',
                              borderRadius: 1.5,
                              borderColor: '#1976d2',
                              color: '#1976d2',
                              px: 1.5,
                              py: 0.5,
                              minHeight: 24,
                              '&:hover': {
                                bgcolor: 'rgba(25,118,210,0.08)',
                                borderColor: '#1976d2',
                              }
                            }}
                          >
                            {doc.name}
                          </Button>
                          <IconButton
                            size="small"
                            onClick={(e) => handleDocMenuOpen(e, vessel, doc, docIndex)}
                            sx={{ 
                              p: 0.2,
                              m: 0,
                              color: '#6B7280',
                              '&:hover': { color: '#EF4444' }
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      ))}
                      <Tooltip title="Add Document Link">
                        <IconButton 
                          size="small" 
                          onClick={() => handleLinkDialogOpen(vessel)}
                          sx={{ 
                            color: '#6B7280',
                            '&:hover': { color: '#1976d2' }
                          }}
                        >
                          <LinkIcon sx={{ fontSize: 16 }} />
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
                <LinkIcon sx={{ fontSize: 22 }} />
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
                  bgcolor: 'rgba(230, 81, 0, 0.1)',
                  color: '#e65100',
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
                  Fleet Types
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
                  {fleetTypes}
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
                  Active Vessels
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#22c55e',
                    lineHeight: 1.2,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {activeVesselsCount}
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
        activeVessels, 
        'Active Vessels', 
        'active',
        <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 28 }} />
      )}

      {/* ============ SOLD VESSELS TABLE ============ */}
      {renderVesselTable(
        soldVessels, 
        'Sold Vessels', 
        'sold',
        <CancelIcon sx={{ color: '#ef4444', fontSize: 28 }} />
      )}

      {/* ============ UNDER MAINTENANCE VESSELS TABLE ============ */}
      {maintenanceVessels.length > 0 && renderVesselTable(
        maintenanceVessels, 
        'Under Maintenance', 
        'maintenance',
        <PendingIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
      )}

      {/* ============ VESSEL INFO POPOVER ============ */}
      <Popover
        id="vessel-info-popover"
        open={isPopoverOpen}
        anchorEl={popoverAnchor}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
        PaperProps={{
          onMouseEnter: () => {
            // Keep popover open when mouse enters
          },
          onMouseLeave: handlePopoverClose,
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            maxWidth: 320,
            minWidth: 280,
            p: 0,
            overflow: 'hidden',
            border: '1px solid #E5E7EB',
          }
        }}
      >
        {popoverVessel && (
          <Box>
            {/* Header */}
            <Box sx={{ 
              p: 2, 
              bgcolor: '#F8FAFC', 
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}>
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: '#1976d2',
                  borderRadius: 1.5,
                }}
              >
                <VesselIcon sx={{ fontSize: 18, color: 'white' }} />
              </Avatar>
              <Box>
                <Typography 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#111827',
                    fontSize: '0.95rem',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {popoverVessel.name}
                </Typography>
                <Typography 
                  sx={{ 
                    color: '#6B7280',
                    fontSize: '0.7rem',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  IMO: {popoverVessel.imoNumber || 'N/A'} • {popoverVessel.indType || 'N/A'}
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={handlePopoverClose}
                sx={{ 
                  ml: 'auto',
                  color: '#6B7280',
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ p: 2 }}>
              {/* Current Contract */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                <BusinessIcon sx={{ fontSize: 18, color: '#1976d2', mt: 0.2 }} />
                <Box>
                  <Typography 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#6B7280',
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    Current Contract
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: '#111827',
                      fontSize: '0.85rem',
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    {popoverVessel.currentContract || 'No active contract'}
                  </Typography>
                </Box>
              </Box>

              {/* Location */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                <LocationIcon sx={{ fontSize: 18, color: '#22c55e', mt: 0.2 }} />
                <Box>
                  <Typography 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#6B7280',
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    Current Location
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: '#111827',
                      fontSize: '0.85rem',
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    {popoverVessel.location || 'Not specified'}
                  </Typography>
                </Box>
              </Box>

              {/* Charterer */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                <AnchorIcon sx={{ fontSize: 18, color: '#7c3aed', mt: 0.2 }} />
                <Box>
                  <Typography 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#6B7280',
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    Charterer
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: '#111827',
                      fontSize: '0.85rem',
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    {popoverVessel.charterer || 'Not specified'}
                  </Typography>
                </Box>
              </Box>

              {/* Next Dry Dock */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                <CalendarIcon sx={{ fontSize: 18, color: '#f59e0b', mt: 0.2 }} />
                <Box>
                  <Typography 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#6B7280',
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    Next Dry Dock
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: '#111827',
                      fontSize: '0.85rem',
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    {popoverVessel.nextDryDock || 'Not scheduled'}
                  </Typography>
                </Box>
              </Box>

              {/* Additional Info */}
              {popoverVessel.additionalInfo && (
                <Box sx={{ 
                  mt: 1,
                  p: 1.5, 
                  bgcolor: '#F8FAFC', 
                  borderRadius: 1.5,
                  border: '1px solid #E5E7EB',
                }}>
                  <Typography 
                    sx={{ 
                      color: '#6B7280',
                      fontSize: '0.7rem',
                      fontFamily: '"Inter", sans-serif',
                      fontStyle: 'italic',
                    }}
                  >
                    {popoverVessel.additionalInfo}
                  </Typography>
                </Box>
              )}

              {/* Quick Status */}
              <Box sx={{ 
                mt: 1.5, 
                pt: 1.5,
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Typography 
                  sx={{ 
                    color: '#6B7280',
                    fontSize: '0.6rem',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Status: 
                  <Chip 
                    label={popoverVessel.status || 'Available'}
                    size="small"
                    sx={{ 
                      ml: 0.5,
                      fontSize: '0.6rem',
                      height: 18,
                      fontFamily: '"Inter", sans-serif',
                      bgcolor: getStatusStyles(popoverVessel.status).bgcolor,
                      color: getStatusStyles(popoverVessel.status).color,
                      border: `1px solid ${getStatusStyles(popoverVessel.status).borderColor}`,
                    }}
                  />
                </Typography>
                <Typography 
                  sx={{ 
                    color: '#94a3b8',
                    fontSize: '0.55rem',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  GRT: {popoverVessel.grt || '-'} • Seats: {popoverVessel.totalSeat || '-'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Popover>

      {/* ============ DOCUMENT ACTION MENU ============ */}
      <Menu
        anchorEl={docMenuAnchor}
        open={Boolean(docMenuAnchor)}
        onClose={handleDocMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 200,
            py: 1,
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            if (docMenuData) {
              handleOpenLink(docMenuData.doc);
            }
            handleDocMenuClose();
          }}
          sx={{ 
            borderRadius: 1,
            mx: 0.5,
            fontFamily: '"Inter", sans-serif',
          }}
        >
          <ListItemIcon>
            <OpenInNewIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Open Link" />
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (docMenuData) {
              handleRemoveDocument(docMenuData.vessel._id, docMenuData.docIndex);
            }
          }}
          sx={{ 
            borderRadius: 1,
            mx: 0.5,
            fontFamily: '"Inter", sans-serif',
            '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' },
          }}
        >
          <ListItemIcon>
            <RemoveCircleIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Remove" sx={{ color: '#EF4444' }} />
        </MenuItem>
      </Menu>

      {/* ============ ADD LINK DIALOG ============ */}
      <Dialog 
        open={linkDialog} 
        onClose={handleLinkDialogClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: 0,
            overflow: 'hidden',
          }
        }}
      >
        <Box sx={{ 
          p: 2.5, 
          bgcolor: '#F9FAFB', 
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>
            Add Document Link
          </Typography>
          <IconButton onClick={handleLinkDialogClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>
            Add a link for: <strong>{selectedVessel?.name}</strong>
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ fontFamily: '"Inter", sans-serif' }}>Document Type</InputLabel>
            <Select
              name="name"
              value={linkData.name}
              onChange={handleLinkInputChange}
              label="Document Type"
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
              }}
            >
              <MenuItem value="Vessel Spec">Vessel Spec</MenuItem>
              <MenuItem value="GA Plan">GA Plan</MenuItem>
              <MenuItem value="Certificate">Certificate</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            name="url"
            label="Document URL (OneDrive Link)"
            value={linkData.url}
            onChange={handleLinkInputChange}
            variant="outlined"
            placeholder="https://onedrive.live.com/..."
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
          
          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 1.5, fontFamily: '"Inter", sans-serif' }}>
            <LinkIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} /> 
            Paste the OneDrive sharing link. The document will open when clicked.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 2.5, 
          pt: 0,
          gap: 2,
          bgcolor: '#F9FAFB',
          borderTop: '1px solid #E5E7EB',
        }}>
          <Button 
            onClick={handleLinkDialogClose} 
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              borderColor: '#E5E7EB',
              color: '#6B7280',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddLink} 
            variant="contained"
            disabled={!linkData.url.trim() || savingLink}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 4,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
              },
              '&:disabled': {
                opacity: 0.6,
              }
            }}
          >
            {savingLink ? 'Adding...' : 'Add Link'}
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
                  <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 18 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={500} fontFamily='"Inter", sans-serif'>
                      Active
                    </Typography>
                    <Typography variant="caption" color="#6B7280" fontFamily='"Inter", sans-serif'>
                      Vessel is currently in operation
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value="Available">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon sx={{ color: '#3b82f6', fontSize: 18 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={500} fontFamily='"Inter", sans-serif'>
                      Available
                    </Typography>
                    <Typography variant="caption" color="#6B7280" fontFamily='"Inter", sans-serif'>
                      Vessel is ready for charter
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value="Sold">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CancelIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={500} fontFamily='"Inter", sans-serif'>
                      Sold
                    </Typography>
                    <Typography variant="caption" color="#6B7280" fontFamily='"Inter", sans-serif'>
                      Vessel has been sold
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value="Under Maintenance">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PendingIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={500} fontFamily='"Inter", sans-serif'>
                      Under Maintenance
                    </Typography>
                    <Typography variant="caption" color="#6B7280" fontFamily='"Inter", sans-serif'>
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

            {/* ============ NEW: VESSEL INFO FIELDS ============ */}
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
                Current Contract
              </Typography>
              <TextField
                fullWidth
                name="currentContract"
                value={formData.currentContract}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., Petronas Charter 2024-2026"
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
                Current Location
              </Typography>
              <TextField
                fullWidth
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., Offshore Sarawak"
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
                Charterer
              </Typography>
              <TextField
                fullWidth
                name="charterer"
                value={formData.charterer}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., Petronas"
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
                Next Dry Dock
              </Typography>
              <TextField
                fullWidth
                name="nextDryDock"
                value={formData.nextDryDock}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., June 2025"
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
                Additional Info (Optional)
              </Typography>
              <TextField
                fullWidth
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="Any additional notes about the vessel..."
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