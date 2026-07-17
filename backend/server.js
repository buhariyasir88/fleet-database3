const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ MONGODB CONNECTION ============
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleet_database';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.log('❌ MongoDB connection error:', err));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ============ SCHEMAS ============

// Vessel Schema
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
    uploadDate: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Client Schema
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: String,
  email: String,
  phone: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});

// Contract Schema
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

// Tender Schema
const tenderSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  projectDetails: { type: String, default: '' },
  proposedVessels: [{
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel' },
    proposedRate: Number
  }],
  commencementDate: { type: Date },
  duration: Number,
  completionDate: Date,
  location: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Pending Submission', 'Submitted', 'Under Review', 'Awarded', 'Decline', 'Unsuccessful', 'Aborted'], 
    default: 'Pending Submission' 
  },
  chances: { type: String, default: '' },
  remarks: { type: String, default: '' },
  submittedDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Invoice Schema
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

// Utilization Schema
const utilizationSchema = new mongoose.Schema({
  vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel', required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  budgetDays: { type: Number, required: true },
  actualDays: { type: Number, required: true },
  remarks: String,
  createdAt: { type: Date, default: Date.now }
});

// Budget Schema
const budgetSchema = new mongoose.Schema({
  month: { type: String, required: true },
  year: { type: Number, required: true },
  budgetedSale: { type: Number, required: true },
  actualSale: Number,
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

// ============ API ROUTES ============

// ---------- VESSEL ROUTES ----------
app.get('/api/vessels', async (req, res) => {
  try {
    const vessels = await Vessel.find().sort({ name: 1 });
    res.json(vessels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vessels', async (req, res) => {
  try {
    const vessel = new Vessel(req.body);
    await vessel.save();
    res.status(201).json(vessel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vessels/:id', async (req, res) => {
  try {
    const vessel = await Vessel.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!vessel) return res.status(404).json({ error: 'Vessel not found' });
    res.json(vessel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vessels/:id', async (req, res) => {
  try {
    const vessel = await Vessel.findByIdAndDelete(req.params.id);
    if (!vessel) return res.status(404).json({ error: 'Vessel not found' });
    res.json({ message: 'Vessel deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vessels/:id/documents', upload.single('document'), async (req, res) => {
  try {
    const vessel = await Vessel.findById(req.params.id);
    if (!vessel) return res.status(404).json({ error: 'Vessel not found' });

    vessel.documents.push({
      name: req.body.name || req.file.originalname,
      filePath: req.file.filename // Store only filename
    });
    await vessel.save();
    res.json(vessel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vessels/:vesselId/documents/:docId', async (req, res) => {
  try {
    const vessel = await Vessel.findById(req.params.vesselId);
    if (!vessel) return res.status(404).json({ error: 'Vessel not found' });

    vessel.documents = vessel.documents.filter(
      doc => doc._id.toString() !== req.params.docId
    );
    await vessel.save();
    res.json(vessel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- CLIENT ROUTES ----------
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- CONTRACT ROUTES ----------
app.get('/api/contracts', async (req, res) => {
  try {
    const contracts = await Contract.find()
      .populate('client')
      .populate('vessel')
      .sort({ createdAt: -1 });
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contracts', async (req, res) => {
  try {
    const contract = new Contract(req.body);
    await contract.save();
    const populatedContract = await Contract.findById(contract._id)
      .populate('client')
      .populate('vessel');
    res.status(201).json(populatedContract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contracts/:id', async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('client')
      .populate('vessel');
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contracts/:id', async (req, res) => {
  try {
    const contract = await Contract.findByIdAndDelete(req.params.id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json({ message: 'Contract deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- TENDER ROUTES ----------
app.get('/api/tenders', async (req, res) => {
  try {
    const tenders = await Tender.find()
      .populate('client')
      .populate('proposedVessels.vessel')
      .sort({ createdAt: -1 });
    res.json(tenders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenders', async (req, res) => {
  try {
    const tender = new Tender(req.body);
    await tender.save();
    const populatedTender = await Tender.findById(tender._id)
      .populate('client')
      .populate('proposedVessels.vessel');
    res.status(201).json(populatedTender);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tenders/:id', async (req, res) => {
  try {
    const tender = await Tender.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('client')
      .populate('proposedVessels.vessel');
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    res.json(tender);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tenders/:id', async (req, res) => {
  try {
    const tender = await Tender.findByIdAndDelete(req.params.id);
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    res.json({ message: 'Tender deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- INVOICE ROUTES ----------
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('contract')
      .populate('client')
      .populate('vessel')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('contract')
      .populate('client')
      .populate('vessel');
    res.status(201).json(populatedInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('contract')
      .populate('client')
      .populate('vessel');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- UTILIZATION ROUTES ----------
app.get('/api/utilizations', async (req, res) => {
  try {
    const utilizations = await Utilization.find()
      .populate('vessel')
      .sort({ year: -1, month: 1 });
    res.json(utilizations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/utilizations', async (req, res) => {
  try {
    const utilization = new Utilization(req.body);
    await utilization.save();
    const populatedUtilization = await Utilization.findById(utilization._id).populate('vessel');
    res.status(201).json(populatedUtilization);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/utilizations/:id', async (req, res) => {
  try {
    const utilization = await Utilization.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('vessel');
    if (!utilization) return res.status(404).json({ error: 'Utilization record not found' });
    res.json(utilization);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/utilizations/:id', async (req, res) => {
  try {
    const utilization = await Utilization.findByIdAndDelete(req.params.id);
    if (!utilization) return res.status(404).json({ error: 'Utilization record not found' });
    res.json({ message: 'Utilization record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- BUDGET ROUTES ----------
app.get('/api/budgets', async (req, res) => {
  try {
    const budgets = await Budget.find().sort({ year: -1, month: 1 });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const budget = new Budget(req.body);
    await budget.save();
    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/budgets/:id', async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ DASHBOARD ROUTE - FIXED ============
app.get('/api/dashboard', async (req, res) => {
  try {
    // Get ALL vessels to calculate status-based counts
    const allVessels = await Vessel.find({});
    const totalVessels = allVessels.length;
    
    // Count vessels by status
    const activeVessels = allVessels.filter(v => 
      v.status === 'Active' || v.status === 'Available'
    ).length;
    const soldVessels = allVessels.filter(v => 
      v.status === 'Sold'
    ).length;
    const maintenanceVessels = allVessels.filter(v => 
      v.status === 'Under Maintenance'
    ).length;
    
    // Get total clients
    const totalClients = await Client.countDocuments({});
    
    // Get total contracts (ALL contracts)
    const totalContracts = await Contract.countDocuments({});
    
    // Count ACTIVE contracts (based on status field)
    const activeContracts = await Contract.countDocuments({ status: 'Active' });
    
    // Get ALL invoices and calculate stats correctly
    const invoices = await Invoice.find({});
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    
    // Count by payment status
    const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'Paid').length;
    const submittedInvoices = invoices.filter(inv => inv.paymentStatus === 'Submitted').length;
    
    // FIXED: Overdue = expectedPaymentDate < today AND not Paid
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueInvoices = invoices.filter(inv => {
      if (inv.paymentStatus === 'Paid') return false;
      if (!inv.expectedPaymentDate) return false;
      const expectedDate = new Date(inv.expectedPaymentDate);
      expectedDate.setHours(0, 0, 0, 0);
      return expectedDate < today;
    }).length;
    
    // Pending = all non-paid, non-overdue invoices
    const pendingInvoices = invoices.filter(inv => {
      if (inv.paymentStatus === 'Paid') return false;
      if (inv.expectedPaymentDate) {
        const expectedDate = new Date(inv.expectedPaymentDate);
        expectedDate.setHours(0, 0, 0, 0);
        if (expectedDate < today) return false;
      }
      return true;
    }).length;
    
    const collectionRate = totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100) : 0;

    // ============ UTILIZATION DATA ============
    const utilizations = await Utilization.find({});
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthName = months[currentMonthIndex];
    
    // Get all utilizations for the current year
    const yearData = utilizations.filter(u => u.year === currentYear);
    
    // Get months to include (up to previous month)
    const monthsToInclude = [];
    for (const month of months) {
      if (months.indexOf(month) < months.indexOf(currentMonthName)) {
        monthsToInclude.push(month);
      }
    }
    
    // Calculate YTD utilization
    let ytdActual = 0;
    let ytdTotalPossibleDays = 0;
    
    // Track unique vessels across all months
    const allVesselIds = new Set();
    
    monthsToInclude.forEach(month => {
      const monthData = yearData.filter(u => u.month === month);
      if (monthData.length === 0) return;
      
      // Count unique vessels in this month
      const vesselIds = new Set();
      monthData.forEach(u => {
        if (u.vessel) {
          const id = typeof u.vessel === 'string' ? u.vessel : u.vessel._id || u.vessel;
          vesselIds.add(id);
          allVesselIds.add(id);
        }
      });
      
      const vesselCount = vesselIds.size || 0;
      if (vesselCount === 0) return;
      
      // Get days in month
      const daysInMonth = new Date(currentYear, months.indexOf(month) + 1, 0).getDate();
      ytdTotalPossibleDays += vesselCount * daysInMonth;
      
      monthData.forEach(u => {
        ytdActual += u.actualDays || 0;
      });
    });
    
    const ytdUtilization = ytdTotalPossibleDays > 0 
      ? Math.min(100, (ytdActual / ytdTotalPossibleDays) * 100) 
      : 0;
    
    // Count unique vessels with utilization data (NOT records)
    const totalVesselsUtil = allVesselIds.size;

    res.json({
      totalVessels,
      activeVessels,
      soldVessels,
      maintenanceVessels,
      totalClients,
      activeContracts,
      totalContracts,      // ← ADDED: Total contracts count
      totalInvoices,
      totalRevenue,
      pendingInvoices,
      overdueInvoices,
      paidInvoices,
      submittedInvoices,
      collectionRate,
      // Utilization data
      ytdUtilization,
      totalVesselsUtil,
      currentMonth: currentMonthName,
      currentYear
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads folder: ${path.join(__dirname, 'uploads')}`);
});