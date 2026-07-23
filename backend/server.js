const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5005;

// ============ MIDDLEWARE ============
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://fleet-frontend-cq7u.onrender.com',
    'https://fleet-database3.onrender.com',
    /\.onrender\.com$/
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ CREATE UPLOADS FOLDER (for backward compatibility) ============
const uploadDir = path.join(__dirname, 'uploads');
const parentUploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${uploadDir}`);
}
if (!fs.existsSync(parentUploadDir)) {
  fs.mkdirSync(parentUploadDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${parentUploadDir}`);
}

// ============ SERVE STATIC FILES ============
app.use('/uploads', express.static(uploadDir));
app.use('/uploads', express.static(parentUploadDir));
console.log(`📁 Serving uploads from: ${uploadDir}`);

// ============ MONGODB CONNECTION ============
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleet_database';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.log('❌ MongoDB connection error:', err));

// ============ MULTER SETUP (for file uploads - backward compatibility) ============
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = fs.existsSync(uploadDir) ? uploadDir : parentUploadDir;
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, and Word documents are allowed.'));
    }
  }
});

// ============ SCHEMAS ============

// ===== VESSEL SCHEMA =====
const vesselSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imoNumber: { type: String, default: '' },
  indType: { type: String, default: '' },
  flag: { type: String, default: '' },
  year: { type: Number, default: 0 },
  grt: { type: Number, default: 0 },
  dwt: { type: Number, default: 0 },
  speed: { type: String, default: '' },
  totalSeat: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Active', 'Available', 'Sold', 'Under Maintenance'], 
    default: 'Available' 
  },
  documents: [{
    name: String,
    filePath: String,
    url: String,        // NEW: For link-based documents
    isLink: { type: Boolean, default: false }, // NEW: Flag for link-based documents
    uploadDate: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// ===== CLIENT SCHEMA =====
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// ===== CONTRACT SCHEMA =====
const contractSchema = new mongoose.Schema({
  contractTitle: { type: String, default: '' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel', required: true },
  commencementDate: { type: Date, required: true },
  duration: { type: Number, required: true },
  dcr: { type: Number, required: true },
  mob: { type: Number, default: 0 },
  demob: { type: Number, default: 0 },
  contractValue: { type: Number, default: 0 },
  remarks: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Active', 'Completed', 'Pending'], 
    default: 'Active' 
  },
  createdAt: { type: Date, default: Date.now }
});

// ===== TENDER SCHEMA =====
const tenderSchema = new mongoose.Schema({
  tenderNo: { 
    type: String, 
    default: '' 
  },
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  projectDetails: { 
    type: String, 
    default: '' 
  },
  proposedVessels: [{
    vessel: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Vessel' 
    },
    vesselName: { 
      type: String, 
      default: '' 
    },
    isThirdParty: { 
      type: Boolean, 
      default: false 
    },
    proposedRate: { 
      type: Number, 
      default: 0 
    }
  }],
  commencementDate: { 
    type: Date 
  },
  duration: { 
    type: Number, 
    default: 0 
  },
  completionDate: { 
    type: Date 
  },
  location: { 
    type: String, 
    default: '' 
  },
  status: { 
    type: String, 
    enum: ['Pending Submission', 'Submitted', 'Under Review', 'Awarded', 'Decline', 'Unsuccessful', 'Aborted'],
    default: 'Pending Submission' 
  },
  chances: { 
    type: String, 
    default: '' 
  },
  remarks: { 
    type: String, 
    default: '' 
  },
  submittedDate: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ===== INVOICE SCHEMA =====
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, default: '' },
  billingMonth: { type: String, required: true },
  billingYear: { type: Number, required: true },
  contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel', required: true },
  dcr: { type: Number, required: true, default: 0 },
  duration: { type: Number, required: true, default: 0 },
  mob: { type: Number, default: 0 },
  demob: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  submissionDate: { type: Date, required: true },
  expectedPaymentDate: { type: Date },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Submitted', 'Paid', 'Overdue'],
    default: 'Pending'
  },
  remarks: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// ===== UTILIZATION SCHEMA =====
const utilizationSchema = new mongoose.Schema({
  vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel', required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  budgetDays: { type: Number, required: true },
  actualDays: { type: Number, required: true },
  remarks: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// ===== BUDGET SCHEMA =====
const budgetSchema = new mongoose.Schema({
  month: { type: String, required: true },
  year: { type: Number, required: true },
  budgetedSale: { type: Number, required: true },
  actualSale: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// ============ MODELS ============
const Vessel = mongoose.model('Vessel', vesselSchema);
const Client = mongoose.model('Client', clientSchema);
const Contract = mongoose.model('Contract', contractSchema);
const Tender = mongoose.model('Tender', tenderSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);
const Utilization = mongoose.model('Utilization', utilizationSchema);
const Budget = mongoose.model('Budget', budgetSchema);

// ============ DEBUG ROUTE - List uploads ============
app.get('/api/uploads', (req, res) => {
  const dirToCheck = fs.existsSync(uploadDir) ? uploadDir : parentUploadDir;
  fs.readdir(dirToCheck, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to scan directory', details: err.message });
    }
    res.json({ 
      files: files || [],
      count: files ? files.length : 0,
      uploadDir: dirToCheck
    });
  });
});

// ============ TEST ROUTE ============
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Fleet Database API is running!',
    status: 'online',
    version: '1.0.0',
    uploads: '/uploads',
    endpoints: {
      vessels: '/api/vessels',
      clients: '/api/clients',
      contracts: '/api/contracts',
      tenders: '/api/tenders',
      invoices: '/api/invoices',
      utilizations: '/api/utilizations',
      budgets: '/api/budgets',
      dashboard: '/api/dashboard',
      uploads: '/api/uploads'
    }
  });
});

// ============ DASHBOARD ROUTE ============
app.get('/api/dashboard', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard data...');
    
    const vessels = await Vessel.find({});
    const totalVessels = vessels.length;
    const activeVessels = vessels.filter(v => v.status === 'Active' || v.status === 'Available').length;
    const soldVessels = vessels.filter(v => v.status === 'Sold').length;
    const maintenanceVessels = vessels.filter(v => v.status === 'Under Maintenance').length;

    const totalClients = await Client.countDocuments({});
    const totalContracts = await Contract.countDocuments({});
    const activeContracts = await Contract.countDocuments({ status: 'Active' });
    
    const invoices = await Invoice.find({});
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'Paid').length;
    const submittedInvoices = invoices.filter(inv => inv.paymentStatus === 'Submitted').length;
    const pendingInvoices = invoices.filter(inv => inv.paymentStatus === 'Pending').length;
    const overdueInvoices = invoices.filter(inv => inv.paymentStatus === 'Overdue').length;
    
    const collectionRate = totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100) : 0;
    
    const utilizations = await Utilization.find({});
    const totalVesselsUtil = new Set(utilizations.map(u => u.vessel?.toString())).size;
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthIndex = today.getMonth();
    const monthsToInclude = months.slice(0, currentMonthIndex);
    
    let ytdActual = 0;
    let ytdPossible = 0;
    
    monthsToInclude.forEach(month => {
      const monthData = utilizations.filter(u => u.year === currentYear && u.month === month);
      const vesselIds = new Set();
      monthData.forEach(u => {
        if (u.vessel) {
          const id = typeof u.vessel === 'string' ? u.vessel : u.vessel._id || u.vessel;
          vesselIds.add(id);
        }
      });
      const vesselCount = vesselIds.size || 0;
      if (vesselCount === 0) return;
      
      const monthIndex = months.indexOf(month);
      const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
      ytdPossible += vesselCount * daysInMonth;
      monthData.forEach(u => {
        ytdActual += u.actualDays || 0;
      });
    });
    
    const ytdUtilization = ytdPossible > 0 ? (ytdActual / ytdPossible) * 100 : 0;

    res.json({
      totalVessels,
      activeVessels,
      soldVessels,
      maintenanceVessels,
      totalClients,
      totalContracts,
      activeContracts,
      totalInvoices,
      totalRevenue,
      pendingInvoices,
      overdueInvoices,
      paidInvoices,
      submittedInvoices,
      collectionRate,
      ytdUtilization,
      totalVesselsUtil,
      currentMonth,
      currentYear
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Error fetching dashboard data' });
  }
});

// ============ VESSEL ROUTES ============
app.get('/api/vessels', async (req, res) => {
  try {
    const vessels = await Vessel.find({}).sort({ name: 1 });
    res.json(vessels);
  } catch (error) {
    console.error('Error fetching vessels:', error);
    res.status(500).json({ error: 'Error fetching vessels' });
  }
});

app.post('/api/vessels', async (req, res) => {
  try {
    const vessel = new Vessel(req.body);
    await vessel.save();
    res.status(201).json(vessel);
  } catch (error) {
    console.error('Error creating vessel:', error);
    res.status(500).json({ error: 'Error creating vessel' });
  }
});

app.put('/api/vessels/:id', async (req, res) => {
  try {
    const vessel = await Vessel.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        imoNumber: req.body.imoNumber,
        indType: req.body.indType,
        flag: req.body.flag,
        year: req.body.year,
        grt: req.body.grt,
        dwt: req.body.dwt,
        speed: req.body.speed,
        totalSeat: req.body.totalSeat,
        status: req.body.status || 'Available'
      },
      { new: true, runValidators: true }
    );
    if (!vessel) return res.status(404).json({ error: 'Vessel not found' });
    res.json(vessel);
  } catch (error) {
    console.error('Error updating vessel:', error);
    res.status(500).json({ error: 'Error updating vessel' });
  }
});

app.delete('/api/vessels/:id', async (req, res) => {
  try {
    const vessel = await Vessel.findByIdAndDelete(req.params.id);
    if (!vessel) return res.status(404).json({ error: 'Vessel not found' });
    res.json({ message: 'Vessel deleted successfully' });
  } catch (error) {
    console.error('Error deleting vessel:', error);
    res.status(500).json({ error: 'Error deleting vessel' });
  }
});

// ============ VESSEL DOCUMENT ROUTES ============

// ===== ADD LINK DOCUMENT (NEW) =====
app.post('/api/vessels/:id/documents', async (req, res) => {
  try {
    const vessel = await Vessel.findById(req.params.id);
    if (!vessel) {
      return res.status(404).json({ error: 'Vessel not found' });
    }

    const { name, url, isLink } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Add document link to vessel
    vessel.documents.push({
      name: name,
      url: url,
      isLink: isLink || true,
      uploadDate: new Date()
    });

    await vessel.save();
    
    const uploadedDoc = vessel.documents[vessel.documents.length - 1];
    res.json({ 
      message: 'Document link added successfully',
      document: uploadedDoc
    });
  } catch (error) {
    console.error('Error adding document link:', error);
    res.status(500).json({ error: 'Error adding document link' });
  }
});

// ===== UPLOAD FILE (Backward compatibility) =====
app.post('/api/vessels/:id/upload-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const vessel = await Vessel.findById(req.params.id);
    if (!vessel) {
      return res.status(404).json({ error: 'Vessel not found' });
    }

    vessel.documents.push({
      name: req.body.name || 'Document',
      filePath: `/uploads/${req.file.filename}`,
      isLink: false,
      uploadDate: new Date()
    });

    await vessel.save();
    
    const uploadedDoc = vessel.documents[vessel.documents.length - 1];
    res.json({ 
      message: 'Document uploaded successfully',
      document: uploadedDoc
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Error uploading document' });
  }
});

// ===== DELETE DOCUMENT =====
app.delete('/api/vessels/:id/documents/:docIndex', async (req, res) => {
  try {
    const vessel = await Vessel.findById(req.params.id);
    if (!vessel) {
      return res.status(404).json({ error: 'Vessel not found' });
    }

    const docIndex = parseInt(req.params.docIndex);
    if (docIndex < 0 || docIndex >= vessel.documents.length) {
      return res.status(404).json({ error: 'Document not found' });
    }

    vessel.documents.splice(docIndex, 1);
    await vessel.save();

    res.json({ message: 'Document removed successfully' });
  } catch (error) {
    console.error('Error removing document:', error);
    res.status(500).json({ error: 'Error removing document' });
  }
});

// ============ CLIENT ROUTES ============
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ name: 1 });
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Error fetching clients' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Error creating client' });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        contactPerson: req.body.contactPerson,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address
      },
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Error updating client' });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Error deleting client' });
  }
});

// ============ CONTRACT ROUTES ============
app.get('/api/contracts', async (req, res) => {
  try {
    const contracts = await Contract.find({})
      .populate('client')
      .populate('vessel')
      .sort({ createdAt: -1 });
    res.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Error fetching contracts' });
  }
});

app.post('/api/contracts', async (req, res) => {
  try {
    const contract = new Contract(req.body);
    await contract.save();
    res.status(201).json(contract);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Error creating contract' });
  }
});

app.put('/api/contracts/:id', async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json(contract);
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ error: 'Error updating contract' });
  }
});

app.delete('/api/contracts/:id', async (req, res) => {
  try {
    const contract = await Contract.findByIdAndDelete(req.params.id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ error: 'Error deleting contract' });
  }
});

// ============ TENDER ROUTES ============
app.get('/api/tenders', async (req, res) => {
  try {
    const tenders = await Tender.find({})
      .populate('client')
      .populate('proposedVessels.vessel')
      .sort({ createdAt: -1 });
    res.json(tenders);
  } catch (error) {
    console.error('Error fetching tenders:', error);
    res.status(500).json({ error: 'Error fetching tenders' });
  }
});

app.get('/api/tenders/:id', async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .populate('client')
      .populate('proposedVessels.vessel');
    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    res.json(tender);
  } catch (error) {
    console.error('Error fetching tender:', error);
    res.status(500).json({ error: 'Error fetching tender' });
  }
});

app.post('/api/tenders', async (req, res) => {
  try {
    if (!req.body.client || !req.body.commencementDate || !req.body.duration) {
      return res.status(400).json({ error: 'Client, commencement date, and duration are required' });
    }

    const validVessels = req.body.proposedVessels?.filter(v => {
      if (v.isThirdParty) {
        return v.vesselName && v.vesselName.trim() !== '' && v.proposedRate;
      } else {
        return v.vessel && v.proposedRate;
      }
    });

    if (!validVessels || validVessels.length === 0) {
      return res.status(400).json({ 
        error: 'At least one valid vessel with rate is required.' 
      });
    }

    let tenderNo = req.body.tenderNo;
    if (!tenderNo) {
      const year = new Date().getFullYear();
      const count = await Tender.countDocuments({
        tenderNo: { $regex: `^${year}-` }
      });
      const seq = String(count + 1).padStart(3, '0');
      tenderNo = `${year}-${seq}`;
    }

    const tender = new Tender({
      tenderNo,
      client: req.body.client,
      projectDetails: req.body.projectDetails || '',
      proposedVessels: validVessels.map(v => ({
        vessel: v.isThirdParty ? undefined : v.vessel,
        vesselName: v.isThirdParty ? v.vesselName : '',
        isThirdParty: v.isThirdParty || false,
        proposedRate: v.proposedRate || 0
      })),
      commencementDate: req.body.commencementDate,
      duration: req.body.duration,
      completionDate: req.body.completionDate || null,
      location: req.body.location || '',
      status: req.body.status || 'Pending Submission',
      chances: req.body.chances || '',
      remarks: req.body.remarks || '',
      submittedDate: req.body.submittedDate || new Date(),
    });

    await tender.save();
    res.status(201).json(tender);
  } catch (error) {
    console.error('Error creating tender:', error);
    res.status(500).json({ error: 'Error creating tender', details: error.message });
  }
});

app.put('/api/tenders/:id', async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    const validVessels = req.body.proposedVessels?.filter(v => {
      if (v.isThirdParty) {
        return v.vesselName && v.vesselName.trim() !== '' && v.proposedRate;
      } else {
        return v.vessel && v.proposedRate;
      }
    });

    if (!validVessels || validVessels.length === 0) {
      return res.status(400).json({ 
        error: 'At least one valid vessel with rate is required.' 
      });
    }

    tender.tenderNo = req.body.tenderNo || tender.tenderNo;
    tender.client = req.body.client || tender.client;
    tender.projectDetails = req.body.projectDetails || '';
    tender.proposedVessels = validVessels.map(v => ({
      vessel: v.isThirdParty ? undefined : v.vessel,
      vesselName: v.isThirdParty ? v.vesselName : '',
      isThirdParty: v.isThirdParty || false,
      proposedRate: v.proposedRate || 0
    }));
    tender.commencementDate = req.body.commencementDate || tender.commencementDate;
    tender.duration = req.body.duration || tender.duration;
    tender.completionDate = req.body.completionDate || null;
    tender.location = req.body.location || '';
    tender.status = req.body.status || 'Pending Submission';
    tender.chances = req.body.chances || '';
    tender.remarks = req.body.remarks || '';
    tender.submittedDate = req.body.submittedDate || tender.submittedDate;

    await tender.save();
    res.json(tender);
  } catch (error) {
    console.error('Error updating tender:', error);
    res.status(500).json({ error: 'Error updating tender', details: error.message });
  }
});

app.delete('/api/tenders/:id', async (req, res) => {
  try {
    const tender = await Tender.findByIdAndDelete(req.params.id);
    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    res.json({ message: 'Tender deleted successfully' });
  } catch (error) {
    console.error('Error deleting tender:', error);
    res.status(500).json({ error: 'Error deleting tender' });
  }
});

// ============ INVOICE ROUTES ============
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find({})
      .populate('client')
      .populate('vessel')
      .populate('contract')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Error fetching invoices' });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Error creating invoice' });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Error updating invoice' });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Error deleting invoice' });
  }
});

// ============ UTILIZATION ROUTES ============
app.get('/api/utilizations', async (req, res) => {
  try {
    const utilizations = await Utilization.find({})
      .populate('vessel')
      .sort({ year: -1, month: 1 });
    res.json(utilizations);
  } catch (error) {
    console.error('Error fetching utilizations:', error);
    res.status(500).json({ error: 'Error fetching utilizations' });
  }
});

app.post('/api/utilizations', async (req, res) => {
  try {
    const utilization = new Utilization(req.body);
    await utilization.save();
    res.status(201).json(utilization);
  } catch (error) {
    console.error('Error creating utilization:', error);
    res.status(500).json({ error: 'Error creating utilization' });
  }
});

app.put('/api/utilizations/:id', async (req, res) => {
  try {
    const utilization = await Utilization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!utilization) return res.status(404).json({ error: 'Utilization not found' });
    res.json(utilization);
  } catch (error) {
    console.error('Error updating utilization:', error);
    res.status(500).json({ error: 'Error updating utilization' });
  }
});

app.delete('/api/utilizations/:id', async (req, res) => {
  try {
    const utilization = await Utilization.findByIdAndDelete(req.params.id);
    if (!utilization) return res.status(404).json({ error: 'Utilization not found' });
    res.json({ message: 'Utilization deleted successfully' });
  } catch (error) {
    console.error('Error deleting utilization:', error);
    res.status(500).json({ error: 'Error deleting utilization' });
  }
});

// ============ BUDGET ROUTES ============
app.get('/api/budgets', async (req, res) => {
  try {
    const budgets = await Budget.find({}).sort({ year: -1, month: 1 });
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Error fetching budgets' });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const budget = new Budget(req.body);
    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Error creating budget' });
  }
});

app.put('/api/budgets/:id', async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Error updating budget' });
  }
});

app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Error deleting budget' });
  }
});

// ============ GENERAL FILE UPLOAD ROUTE ============
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
      message: 'File uploaded successfully',
      filePath: `/uploads/${req.file.filename}`,
      fileName: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    message: 'The API endpoint you are looking for does not exist'
  });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api/dashboard`);
  console.log(`📁 Uploads directory: ${uploadDir}`);
  console.log(`📁 Serving uploads at: http://localhost:${PORT}/uploads/`);
});