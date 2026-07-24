import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
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
  Chip,
  LinearProgress,
  Snackbar,
  Alert,
  Avatar,
  Tooltip,
  Fade,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Folder as FolderIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

// Pre-defined folders
const FOLDERS = [
  'Contract Documents',
  'Tender Documents',
  'Vessel Documents',
  'Sale/Purchase Documents',
  'Project Documents',
  'Corporate Documents',
  'Financial Documents',
  'Legal Documents',
  'General Documents',
  'Other Documents'
];

const FOLDER_COLORS = {
  'Contract Documents': '#1976d2',
  'Tender Documents': '#7c3aed',
  'Vessel Documents': '#0d9488',
  'Sale/Purchase Documents': '#dc2626',
  'Project Documents': '#f59e0b',
  'Corporate Documents': '#4f46e5',
  'Financial Documents': '#16a34a',
  'Legal Documents': '#7c3aed',
  'General Documents': '#6b7280',
  'Other Documents': '#9ca3af'
};

const FOLDER_ICONS = {
  'Contract Documents': '📄',
  'Tender Documents': '📊',
  'Vessel Documents': '🚢',
  'Sale/Purchase Documents': '🏷️',
  'Project Documents': '📋',
  'Corporate Documents': '🏢',
  'Financial Documents': '💰',
  'Legal Documents': '⚖️',
  'General Documents': '📎',
  'Other Documents': '📁'
};

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    folderStats: {},
    recent: []
  });
  const [formData, setFormData] = useState({
    title: '',
    folder: 'Contract Documents',
    onedriveLink: '',
    description: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [docsRes, tagsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/documents`),
        axios.get(`${API_URL}/documents/tags/all`),
        axios.get(`${API_URL}/documents/stats`),
      ]);
      setDocuments(docsRes.data);
      setAllTags(tagsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Error fetching documents', 'error');
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

  const handleOpenDialog = (doc = null) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        title: doc.title || '',
        folder: doc.folder || 'Contract Documents',
        onedriveLink: doc.onedriveLink || '',
        description: doc.description || '',
        tags: doc.tags || [],
      });
      setTagInput('');
    } else {
      setEditingDoc(null);
      setFormData({
        title: '',
        folder: 'Contract Documents',
        onedriveLink: '',
        description: '',
        tags: [],
      });
      setTagInput('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDoc(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTag = (event, value) => {
    if (value && !formData.tags.includes(value)) {
      setFormData({ ...formData, tags: [...formData.tags, value] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      if (!formData.title.trim()) {
        showSnackbar('Document title is required', 'error');
        setSaving(false);
        return;
      }
      
      if (!formData.onedriveLink.trim()) {
        showSnackbar('OneDrive link is required', 'error');
        setSaving(false);
        return;
      }

      // Validate URL
      try {
        new URL(formData.onedriveLink);
      } catch (e) {
        showSnackbar('Please enter a valid URL', 'error');
        setSaving(false);
        return;
      }

      const docData = {
        title: formData.title,
        folder: formData.folder,
        onedriveLink: formData.onedriveLink,
        description: formData.description || '',
        tags: formData.tags || [],
      };

      if (editingDoc) {
        await axios.put(`${API_URL}/documents/${editingDoc._id}`, docData);
        showSnackbar('Document updated successfully! 🎉');
      } else {
        await axios.post(`${API_URL}/documents`, docData);
        showSnackbar('Document added successfully! 🎉');
      }
      handleCloseDialog();
      fetchAllData();
    } catch (error) {
      console.error('Error saving document:', error);
      showSnackbar(error.response?.data?.error || 'Error saving document', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`${API_URL}/documents/${id}`);
        showSnackbar('Document deleted successfully');
        fetchAllData();
      } catch (error) {
        console.error('Error deleting document:', error);
        showSnackbar('Error deleting document', 'error');
      }
    }
  };

  const handleOpenLink = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Filter documents
  const getFilteredDocuments = () => {
    let filtered = documents;
    
    if (selectedFolder) {
      filtered = filtered.filter(doc => doc.folder === selectedFolder);
    }
    
    if (selectedTag) {
      filtered = filtered.filter(doc => doc.tags.includes(selectedTag));
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(term) ||
        doc.description.toLowerCase().includes(term) ||
        doc.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  };

  const filteredDocuments = getFilteredDocuments();

  // Get documents by folder for folder view
  const getDocumentsByFolder = () => {
    const folderMap = {};
    FOLDERS.forEach(folder => {
      folderMap[folder] = documents.filter(doc => doc.folder === folder);
    });
    return folderMap;
  };

  const documentsByFolder = getDocumentsByFolder();

  // Get tag count
  const getTagCount = (tag) => {
    return allTags.find(t => t.tag === tag)?.count || 0;
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
            📁 Document Management
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6B7280',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Manage and organize your business documents with OneDrive links
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh">
            <IconButton 
              onClick={fetchAllData}
              sx={{ 
                border: '1px solid #E5E7EB',
                borderRadius: 2,
                color: '#6B7280',
                '&:hover': { bgcolor: '#F3F4F6' }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
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
            Add Document
          </Button>
        </Box>
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
                <DescriptionIcon sx={{ fontSize: 22 }} />
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
                  {stats.total || 0}
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
                  bgcolor: 'rgba(124, 58, 237, 0.1)',
                  color: '#7c3aed',
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                }}
              >
                <FolderIcon sx={{ fontSize: 22 }} />
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
                  Active Folders
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
                  {Object.values(stats.folderStats || {}).filter(count => count > 0).length}
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
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                }}
              >
                <SearchIcon sx={{ fontSize: 22 }} />
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
                  Total Tags
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
                  {allTags.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Search and Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ 
            flex: 1,
            minWidth: 200,
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
              fontSize: '0.875rem',
              py: 1.5,
            },
          }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#9ca3af', mr: 1, fontSize: 20 }} />,
            endAdornment: searchTerm && (
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                <ClearIcon sx={{ fontSize: 16 }} />
              </IconButton>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel sx={{ fontFamily: '"Inter", sans-serif' }}>Filter by Folder</InputLabel>
          <Select
            value={selectedFolder || ''}
            onChange={(e) => setSelectedFolder(e.target.value || null)}
            label="Filter by Folder"
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
                fontSize: '0.875rem',
                py: 1.5,
              },
            }}
          >
            <MenuItem value="">All Folders</MenuItem>
            {FOLDERS.map((folder) => (
              <MenuItem key={folder} value={folder}>
                {FOLDER_ICONS[folder]} {folder} ({stats.folderStats?.[folder] || 0})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ fontFamily: '"Inter", sans-serif' }}>Filter by Tag</InputLabel>
          <Select
            value={selectedTag || ''}
            onChange={(e) => setSelectedTag(e.target.value || null)}
            label="Filter by Tag"
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
                fontSize: '0.875rem',
                py: 1.5,
              },
            }}
          >
            <MenuItem value="">All Tags</MenuItem>
            {allTags.slice(0, 20).map((tag) => (
              <MenuItem key={tag.tag} value={tag.tag}>
                #{tag.tag} ({tag.count})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {(selectedFolder || selectedTag || searchTerm) && (
          <Button
            variant="outlined"
            onClick={() => {
              setSelectedFolder(null);
              setSelectedTag(null);
              setSearchTerm('');
            }}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontFamily: '"Inter", sans-serif',
              borderColor: '#E5E7EB',
              color: '#6B7280',
            }}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {/* Folder View */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            color: '#111827',
            mb: 2,
            fontFamily: '"Inter", sans-serif',
          }}
        >
          📂 Folders
        </Typography>
        <Grid container spacing={3}>
          {FOLDERS.map((folder) => {
            const count = stats.folderStats?.[folder] || 0;
            const color = FOLDER_COLORS[folder] || '#6b7280';
            const icon = FOLDER_ICONS[folder] || '📁';
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={folder}>
                <Card
                  onClick={() => setSelectedFolder(selectedFolder === folder ? null : folder)}
                  sx={{
                    borderRadius: 3,
                    border: selectedFolder === folder 
                      ? `2px solid ${color}` 
                      : '1px solid #f0f2f5',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      borderColor: color,
                      transform: 'translateY(-2px)',
                    },
                    bgcolor: selectedFolder === folder ? alpha(color, 0.05) : 'white',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Typography sx={{ fontSize: 28 }}>{icon}</Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#111827',
                            fontFamily: '"Inter", sans-serif',
                            fontSize: '0.9rem',
                          }}
                        >
                          {folder}
                        </Typography>
                        <Typography 
                          sx={{ 
                            color: '#6B7280',
                            fontFamily: '"Inter", sans-serif',
                            fontSize: '0.75rem',
                          }}
                        >
                          {count} document{count !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          bgcolor: alpha(color, 0.1), 
                          color: color,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          fontFamily: '"Inter", sans-serif',
                        }}
                      >
                        {count}
                      </Box>
                    </Box>
                    {count > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                        {documentsByFolder[folder]?.slice(0, 3).map((doc) => (
                          <Chip
                            key={doc._id}
                            label={doc.title}
                            size="small"
                            sx={{ 
                              fontSize: '0.6rem',
                              height: 20,
                              bgcolor: '#F3F4F6',
                              fontFamily: '"Inter", sans-serif',
                              maxWidth: 80,
                            }}
                          />
                        ))}
                        {count > 3 && (
                          <Chip
                            label={`+${count - 3} more`}
                            size="small"
                            sx={{ 
                              fontSize: '0.6rem',
                              height: 20,
                              bgcolor: '#F3F4F6',
                              fontFamily: '"Inter", sans-serif',
                            }}
                          />
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Recent Documents */}
      <Paper
        sx={{
          borderRadius: 3,
          border: '1px solid #f0f2f5',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ 
          p: 2.5, 
          borderBottom: '1px solid #f0f2f5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: '#111827',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            📄 Recent Documents
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#6B7280',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#111827', fontSize: '0.7rem', textTransform: 'uppercase', fontFamily: '"Inter", sans-serif' }}>
                  Title
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827', fontSize: '0.7rem', textTransform: 'uppercase', fontFamily: '"Inter", sans-serif' }}>
                  Folder
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827', fontSize: '0.7rem', textTransform: 'uppercase', fontFamily: '"Inter", sans-serif' }}>
                  Tags
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827', fontSize: '0.7rem', textTransform: 'uppercase', fontFamily: '"Inter", sans-serif' }}>
                  Date Added
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#111827', fontSize: '0.7rem', textTransform: 'uppercase', fontFamily: '"Inter", sans-serif', textAlign: 'center' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="textSecondary" fontFamily='"Inter", sans-serif'>
                      No documents found. Click "Add Document" to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon sx={{ color: '#6B7280', fontSize: 18 }} />
                        <Typography 
                          sx={{ 
                            fontWeight: 500, 
                            color: '#111827',
                            fontFamily: '"Inter", sans-serif',
                            fontSize: '0.875rem',
                          }}
                        >
                          {doc.title}
                        </Typography>
                      </Box>
                      {doc.description && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#6B7280',
                            fontFamily: '"Inter", sans-serif',
                            display: 'block',
                            mt: 0.5,
                          }}
                        >
                          {doc.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.folder}
                        size="small"
                        sx={{
                          bgcolor: alpha(FOLDER_COLORS[doc.folder] || '#6b7280', 0.1),
                          color: FOLDER_COLORS[doc.folder] || '#6b7280',
                          fontFamily: '"Inter", sans-serif',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {doc.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={`#${tag}`}
                            size="small"
                            onClick={() => setSelectedTag(tag)}
                            sx={{
                              fontSize: '0.6rem',
                              height: 20,
                              bgcolor: '#F3F4F6',
                              fontFamily: '"Inter", sans-serif',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#E5E7EB' },
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        sx={{ 
                          color: '#6B7280',
                          fontFamily: '"Inter", sans-serif',
                          fontSize: '0.8rem',
                        }}
                      >
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Open Link">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenLink(doc.onedriveLink)}
                            sx={{ color: '#1976d2', '&:hover': { bgcolor: 'rgba(25,118,210,0.08)' } }}
                          >
                            <OpenInNewIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(doc)}
                            sx={{ color: '#6B7280', '&:hover': { color: '#1976d2' } }}
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(doc._id)}
                            sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}
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
      </Paper>

      {/* ============ ADD/EDIT DIALOG ============ */}
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
              <DescriptionIcon sx={{ color: 'white', fontSize: 22 }} />
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
                {editingDoc ? 'Edit Document' : 'Add Document'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#6B7280',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {editingDoc ? 'Update document information' : 'Enter document details below'}
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
                Document Title <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g., MV Jati Eight - Sale Agreement"
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
                Folder <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="folder"
                  value={formData.folder}
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
                  {FOLDERS.map((folder) => (
                    <MenuItem key={folder} value={folder}>
                      {FOLDER_ICONS[folder]} {folder}
                    </MenuItem>
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
                OneDrive Link <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                name="onedriveLink"
                value={formData.onedriveLink}
                onChange={handleInputChange}
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
              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 0.5, fontFamily: '"Inter", sans-serif' }}>
                <LinkIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} /> 
                Paste the OneDrive sharing link for your document
              </Typography>
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
                Description
              </Typography>
              <TextField
                fullWidth
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="Brief description of the document..."
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
                Tags
              </Typography>
              <Autocomplete
                multiple
                freeSolo
                options={allTags.map(t => t.tag)}
                value={formData.tags}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, tags: newValue });
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={index}
                      label={`#${option}`}
                      size="small"
                      {...getTagProps({ index })}
                      sx={{
                        fontFamily: '"Inter", sans-serif',
                        bgcolor: '#EEF2FF',
                        color: '#4338CA',
                      }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Type tag and press Enter..."
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
                )}
              />
              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 0.5, fontFamily: '"Inter", sans-serif' }}>
                <SearchIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} /> 
                Type a tag and press Enter to add (e.g., sale, contract, 2026)
              </Typography>
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
            {saving ? 'Saving...' : editingDoc ? 'Update Document' : 'Add Document'}
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

export default Documents;