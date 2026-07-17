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
  Tooltip,
  Fade,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as ClientIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

const API_URL = 'http://localhost:5005/api';

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/clients`);
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
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

  const handleOpenDialog = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name || '',
        contactPerson: client.contactPerson || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingClient(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      if (!formData.name.trim()) {
        showSnackbar('Company name is required', 'error');
        setSaving(false);
        return;
      }

      if (editingClient) {
        await axios.put(`${API_URL}/clients/${editingClient._id}`, formData);
        showSnackbar('Client updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/clients`, formData);
        showSnackbar('Client created successfully! 🎉');
      }
      handleCloseDialog();
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      showSnackbar(error.response?.data?.error || 'Error saving client.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await axios.delete(`${API_URL}/clients/${id}`);
        showSnackbar('Client deleted successfully');
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        showSnackbar('Error deleting client', 'error');
      }
    }
  };

  // Calculate stats
  const totalClients = clients.length;
  const activeClients = clients.length;
  const totalContacts = clients.filter(c => c.contactPerson).length;

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
          Clients
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#6B7280',
            fontFamily: '"Inter", sans-serif',
          }}
        >
          Manage your client database
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
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
                <ClientIcon sx={{ fontSize: 22 }} />
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
                  Total Clients
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
                  {totalClients}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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
                <BusinessIcon sx={{ fontSize: 22 }} />
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
                  Active Clients
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
                  {activeClients}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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
                <PersonIcon sx={{ fontSize: 22 }} />
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
                  Total Contacts
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
                  {totalContacts}
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
          Add New Client
        </Button>
      </Box>

      {/* ============ UPDATED TABLE ============ */}
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
            <TableRow sx={{ 
              bgcolor: '#F9FAFB',
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
                Company
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
                Contact Person
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
                Email
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
                Phone
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
                Address
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
                textAlign: 'center',
              }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <ClientIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                  <Typography color="textSecondary" variant="h6" sx={{ fontWeight: 500 }}>
                    No clients found
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    Click "Add New Client" to get started
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client, index) => (
                <TableRow 
                  key={client._id} 
                  hover
                  sx={{ 
                    '&:hover': { bgcolor: '#F9FAFB' },
                    transition: 'background-color 0.2s',
                    borderBottom: index < clients.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}
                >
                  <TableCell sx={{ 
                    py: 3,
                    border: 'none',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: '#1976d2',
                          borderRadius: 1.5,
                        }}
                      >
                        <ClientIcon sx={{ fontSize: 16, color: 'white' }} />
                      </Avatar>
                      <Typography sx={{ 
                        fontWeight: 500, 
                        color: '#111827',
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '0.875rem',
                      }}>
                        {client.name}
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
                    {client.contactPerson || '-'}
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#6B7280', 
                    fontSize: '0.875rem',
                    fontFamily: '"Inter", sans-serif',
                    py: 3,
                    border: 'none',
                  }}>
                    {client.email ? (
                      <Chip 
                        label={client.email} 
                        size="small" 
                        sx={{ 
                          bgcolor: '#F3F4F6', 
                          fontWeight: 400,
                          fontSize: '0.7rem',
                          color: '#6B7280',
                          borderRadius: 1,
                          fontFamily: '"Inter", sans-serif',
                        }} 
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#6B7280', 
                    fontSize: '0.875rem',
                    fontFamily: '"Inter", sans-serif',
                    py: 3,
                    border: 'none',
                  }}>
                    {client.phone || '-'}
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#6B7280', 
                    fontSize: '0.875rem',
                    fontFamily: '"Inter", sans-serif',
                    py: 3,
                    border: 'none',
                  }}>
                    {client.address || '-'}
                  </TableCell>
                  <TableCell sx={{ 
                    py: 3, 
                    border: 'none',
                    textAlign: 'center',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Edit Client">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDialog(client)} 
                          sx={{ 
                            color: '#6B7280',
                            '&:hover': { color: '#1976d2', bgcolor: 'rgba(25,118,210,0.08)' }
                          }}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Client">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(client._id)}
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ============ UPDATED MODAL ============ */}
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
              <ClientIcon sx={{ color: 'white', fontSize: 22 }} />
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
                {editingClient ? 'Edit Client' : 'Add Client'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#6B7280',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {editingClient ? 'Update client information' : 'Enter client details below'}
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
                Company Name <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., Jali Marine Sdn Bhd"
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
                Contact Person
              </Typography>
              <TextField
                fullWidth
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., John Doe"
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
                Email
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., john@jali.com"
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
                Phone
              </Typography>
              <TextField
                fullWidth
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., +60 12 345 6789"
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
                Address
              </Typography>
              <TextField
                fullWidth
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., Kuala Lumpur, Malaysia"
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
                  '& .MuiInputBase-multiline': {
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
            {saving ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
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

export default Clients;