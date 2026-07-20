import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Avatar,
  Zoom,
  Alert,
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Description as ContractIcon,
  RequestQuote as TenderIcon,
  Speed as UtilizationIcon,
  Receipt as InvoiceIcon,
  TrendingUp as RevenueIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import html2canvas from 'html2canvas';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [utilizations, setUtilizations] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [clients, setClients] = useState([]);
  const [vessels, setVessels] = useState([]);
  const printRef = useRef();
  const [isPrinting, setIsPrinting] = useState(false);

  // ============ YTD UTILIZATION CALCULATION ============
  const calculateYTDUtilization = (utilizations, year) => {
    if (!utilizations || utilizations.length === 0) return 0;
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Filter utilizations for the given year
    const yearData = utilizations.filter(u => u.year === year);
    
    if (yearData.length === 0) return 0;
    
    // Determine which months to include
    let monthsToInclude = [];
    if (year === currentYear) {
      monthsToInclude = months.slice(0, currentMonthIndex);
    } else {
      const monthsWithData = [...new Set(yearData.map(u => u.month).filter(m => m))];
      monthsToInclude = months.filter(m => monthsWithData.includes(m));
    }
    
    if (monthsToInclude.length === 0) return 0;
    
    let totalActual = 0;
    let totalPossibleDays = 0;
    
    monthsToInclude.forEach(month => {
      const monthData = yearData.filter(u => u.month === month);
      if (monthData.length === 0) return;
      
      // Count unique vessels
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
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      totalPossibleDays += vesselCount * daysInMonth;
      
      monthData.forEach(u => {
        totalActual += u.actualDays || 0;
      });
    });
    
    if (totalPossibleDays === 0) return 0;
    return Math.min(100, (totalActual / totalPossibleDays) * 100);
  };

  // ============ Get YTD days for display ============
  const getYTDDays = (utilizations, year) => {
    if (!utilizations || utilizations.length === 0) return { actual: 0, possible: 0 };
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const yearData = utilizations.filter(u => u.year === year);
    if (yearData.length === 0) return { actual: 0, possible: 0 };
    
    let monthsToInclude = [];
    if (year === currentYear) {
      monthsToInclude = months.slice(0, currentMonthIndex);
    } else {
      const monthsWithData = [...new Set(yearData.map(u => u.month).filter(m => m))];
      monthsToInclude = months.filter(m => monthsWithData.includes(m));
    }
    
    if (monthsToInclude.length === 0) return { actual: 0, possible: 0 };
    
    let totalActual = 0;
    let totalPossible = 0;
    
    monthsToInclude.forEach(month => {
      const monthData = yearData.filter(u => u.month === month);
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
      
      const monthIndex = months.indexOf(month);
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      totalPossible += vesselCount * daysInMonth;
      
      monthData.forEach(u => {
        totalActual += u.actualDays || 0;
      });
    });
    
    return { actual: totalActual, possible: totalPossible };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching report data...');
      
      const [invoicesRes, contractsRes, tendersRes, utilRes, budgetsRes, clientsRes, vesselsRes] = await Promise.all([
        axios.get(`${API_URL}/invoices`),
        axios.get(`${API_URL}/contracts`),
        axios.get(`${API_URL}/tenders`),
        axios.get(`${API_URL}/utilizations`),
        axios.get(`${API_URL}/budgets`),
        axios.get(`${API_URL}/clients`),
        axios.get(`${API_URL}/vessels`),
      ]);
      
      console.log('📊 Data fetched:', {
        invoices: invoicesRes.data?.length || 0,
        contracts: contractsRes.data?.length || 0,
        tenders: tendersRes.data?.length || 0,
        utilizations: utilRes.data?.length || 0,
        budgets: budgetsRes.data?.length || 0,
        clients: clientsRes.data?.length || 0,
        vessels: vesselsRes.data?.length || 0,
      });
      
      setInvoices(invoicesRes.data || []);
      setContracts(contractsRes.data || []);
      setTenders(tendersRes.data || []);
      setUtilizations(utilRes.data || []);
      setBudgets(budgetsRes.data || []);
      setClients(clientsRes.data || []);
      setVessels(vesselsRes.data || []);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError(`Failed to load report data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId) => {
    if (!clientId) return 'Unknown';
    if (typeof clientId === 'object' && clientId.name) return clientId.name;
    const client = clients.find(c => c._id === clientId);
    return client?.name || 'Unknown';
  };

  const getVesselName = (vesselData) => {
    if (!vesselData) return 'Unknown';
    if (typeof vesselData === 'object' && vesselData.name) return vesselData.name;
    if (typeof vesselData === 'string') {
      const found = vessels.find(v => v._id === vesselData);
      return found?.name || 'Unknown';
    }
    if (vesselData._id) {
      const found = vessels.find(v => v._id === vesselData._id);
      return found?.name || 'Unknown';
    }
    return 'Unknown';
  };

  const filteredInvoices = invoices.filter(inv => inv.billingYear === selectedYear);
  const filteredBudgets = budgets.filter(b => b.year === selectedYear);
  const filteredUtilizations = utilizations.filter(u => u.year === selectedYear);

  const monthsOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getContractStatus = (contract) => {
    if (!contract.commencementDate || !contract.duration) return 'Pending';
    const start = new Date(contract.commencementDate);
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(contract.duration));
    const now = new Date();
    if (now > end) return 'Completed';
    if (now >= start && now <= end) return 'Active';
    return 'Pending';
  };

  const contractStatusCounts = { Active: 0, Completed: 0, Pending: 0 };
  contracts.forEach(c => {
    const status = getContractStatus(c);
    if (status === 'Active') contractStatusCounts.Active++;
    else if (status === 'Completed') contractStatusCounts.Completed++;
    else contractStatusCounts.Pending++;
  });

  // ============ VESSEL COLORS ============
  const colors = [
    'rgba(25,118,210,0.7)',
    'rgba(46,125,50,0.7)',
    'rgba(237,108,2,0.7)',
    'rgba(156,39,176,0.7)',
    'rgba(211,47,47,0.7)',
    'rgba(121,85,72,0.7)',
    'rgba(233,30,99,0.7)',
    'rgba(255,193,7,0.7)',
    'rgba(96,125,139,0.7)',
    'rgba(139,195,74,0.7)',
  ];

  const borderColors = [
    'rgba(25,118,210,1)',
    'rgba(46,125,50,1)',
    'rgba(237,108,2,1)',
    'rgba(156,39,176,1)',
    'rgba(211,47,47,1)',
    'rgba(121,85,72,1)',
    'rgba(233,30,99,1)',
    'rgba(255,193,7,1)',
    'rgba(96,125,139,1)',
    'rgba(139,195,74,1)',
  ];

  // ============ INVOICE CHART ============
  const invVesselSet = new Set();
  filteredInvoices.forEach(inv => {
    const name = getVesselName(inv.vessel);
    if (name !== 'Unknown') invVesselSet.add(name);
  });
  const invVessels = Array.from(invVesselSet);
  
  const invData = {};
  const invBudgetData = {};
  
  filteredInvoices.forEach(inv => {
    const month = inv.billingMonth;
    const vessel = getVesselName(inv.vessel);
    if (!invData[month]) invData[month] = {};
    if (!invData[month][vessel]) invData[month][vessel] = 0;
    invData[month][vessel] += inv.totalAmount || 0;
  });
  
  filteredBudgets.forEach(b => {
    if (b.month) {
      if (!invBudgetData[b.month]) invBudgetData[b.month] = 0;
      invBudgetData[b.month] += b.budgetedSale || 0;
    }
  });

  const allMonthsSet = new Set();
  Object.keys(invData).forEach(m => allMonthsSet.add(m));
  Object.keys(invBudgetData).forEach(m => allMonthsSet.add(m));
  
  // If no data, show current months
  let finalMonths = Array.from(allMonthsSet).sort((a, b) => monthsOrder.indexOf(a) - monthsOrder.indexOf(b));
  if (finalMonths.length === 0) {
    const currentMonth = new Date().getMonth();
    finalMonths = monthsOrder.slice(0, currentMonth + 1);
  }

  const invDatasets = invVessels.map((vessel, i) => ({
    label: vessel,
    data: finalMonths.map(m => invData[m]?.[vessel] || 0),
    backgroundColor: colors[i % colors.length],
    borderColor: borderColors[i % borderColors.length],
    borderWidth: 1,
    borderRadius: 2,
  }));

  const invBudgetLine = finalMonths.map(m => invBudgetData[m] || 0);

  const invoiceStackedData = {
    labels: finalMonths,
    datasets: [
      ...invDatasets,
      {
        label: 'Total Budget',
        data: invBudgetLine,
        type: 'line',
        borderColor: '#d32f2f',
        backgroundColor: 'rgba(211,47,47,0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#d32f2f',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
        order: 0,
      }
    ],
  };

  const invoiceStackedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 11, weight: '600' }, usePointStyle: true, pointStyle: 'circle', padding: 15 },
      },
      title: {
        display: true,
        text: 'Monthly Invoice by Vessel (Stacked)',
        font: { size: 15, weight: '700' },
        padding: { bottom: 15 },
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            const label = ctx.dataset.label || '';
            const value = ctx.parsed.y || 0;
            if (label === 'Total Budget') return 'Total Budget: RM ' + value.toLocaleString();
            return label + ': RM ' + value.toLocaleString();
          }
        }
      }
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Amount (RM)', font: { size: 11, weight: '600' } } },
    },
  };

  // Cumulative Sales
  let cumTotal = 0;
  const cumData = finalMonths.map(m => {
    let total = 0;
    invVessels.forEach(v => { total += invData[m]?.[v] || 0; });
    cumTotal += total;
    return cumTotal;
  });
  let cumBudget = 0;
  const cumBudgetData = finalMonths.map(m => {
    cumBudget += invBudgetData[m] || 0;
    return cumBudget;
  });

  const cumulativeLineData = {
    labels: finalMonths,
    datasets: [
      {
        label: 'Cumulative Actual Sale',
        data: cumData,
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25,118,210,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#1976d2',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Cumulative Budget',
        data: cumBudgetData,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76,175,80,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#4caf50',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderDash: [5, 5],
      },
    ],
  };

  const cumulativeLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 11, weight: '600' }, usePointStyle: true, pointStyle: 'circle' },
      },
      title: {
        display: true,
        text: 'Cumulative Sales vs Budget',
        font: { size: 15, weight: '700' },
        padding: { bottom: 15 },
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            return ctx.dataset.label + ': RM ' + (ctx.parsed.y || 0).toLocaleString();
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Amount (RM)', font: { size: 11, weight: '600' } } },
    },
  };

  // Payment Status
  const paymentStatusCounts = {
    Paid: filteredInvoices.filter(i => i.paymentStatus === 'Paid').length,
    Pending: filteredInvoices.filter(i => i.paymentStatus === 'Pending').length,
    Overdue: filteredInvoices.filter(i => i.paymentStatus === 'Overdue').length,
    Submitted: filteredInvoices.filter(i => i.paymentStatus === 'Submitted').length,
  };

  const paymentDoughnutData = {
    labels: ['Paid', 'Pending', 'Overdue', 'Submitted'],
    datasets: [{
      data: [paymentStatusCounts.Paid, paymentStatusCounts.Pending, paymentStatusCounts.Overdue, paymentStatusCounts.Submitted],
      backgroundColor: ['#4caf50', '#ff9800', '#f44336', '#2196f3'],
      borderWidth: 2,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 11, weight: '600' }, usePointStyle: true, pointStyle: 'circle', padding: 12 },
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
            return ctx.label + ': ' + ctx.parsed + ' (' + pct + '%)';
          }
        }
      }
    },
  };

  // ============ CONTRACT ============
  const contractDoughnutData = {
    labels: ['Active', 'Completed', 'Pending'],
    datasets: [{
      data: [contractStatusCounts.Active, contractStatusCounts.Completed, contractStatusCounts.Pending],
      backgroundColor: ['#4caf50', '#2196f3', '#ff9800'],
      borderWidth: 2,
    }],
  };

  const contractValueByClient = {};
  contracts.forEach(c => {
    const name = getClientName(c.client);
    if (!contractValueByClient[name]) contractValueByClient[name] = 0;
    contractValueByClient[name] += c.contractValue || 0;
  });
  const sortedClients = Object.keys(contractValueByClient).sort((a, b) => contractValueByClient[b] - contractValueByClient[a]);
  const topClients = sortedClients.slice(0, 8);

  const contractBarData = {
    labels: topClients.length > 0 ? topClients : ['No Data'],
    datasets: [{
      label: 'Contract Value (RM)',
      data: topClients.length > 0 ? topClients.map(c => contractValueByClient[c]) : [0],
      backgroundColor: 'rgba(25,118,210,0.7)',
      borderColor: 'rgba(25,118,210,1)',
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  const contractBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top Clients by Contract Value',
        font: { size: 15, weight: '700' },
        padding: { bottom: 15 },
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            return 'RM ' + (ctx.parsed.y || 0).toLocaleString();
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Value (RM)', font: { size: 11, weight: '600' } } },
    },
  };

  // ============ TENDER ============
  const tenderStatusCounts = {
    Awarded: tenders.filter(t => t.status === 'Awarded').length,
    'Under Review': tenders.filter(t => t.status === 'Under Review').length,
    Submitted: tenders.filter(t => t.status === 'Submitted').length,
    'Pending Submission': tenders.filter(t => t.status === 'Pending Submission').length,
    Decline: tenders.filter(t => t.status === 'Decline').length,
    Unsuccessful: tenders.filter(t => t.status === 'Unsuccessful').length,
    Aborted: tenders.filter(t => t.status === 'Aborted').length,
  };

  const tenderDoughnutData = {
    labels: ['Awarded', 'Under Review', 'Submitted', 'Pending Submission', 'Decline', 'Unsuccessful', 'Aborted'],
    datasets: [{
      data: [
        tenderStatusCounts.Awarded,
        tenderStatusCounts['Under Review'],
        tenderStatusCounts.Submitted,
        tenderStatusCounts['Pending Submission'],
        tenderStatusCounts.Decline,
        tenderStatusCounts.Unsuccessful,
        tenderStatusCounts.Aborted,
      ],
      backgroundColor: ['#4caf50', '#ff9800', '#2196f3', '#9c27b0', '#f44336', '#795548', '#607d8b'],
      borderWidth: 2,
    }],
  };

  const tenderByClient = {};
  tenders.forEach(t => {
    const name = getClientName(t.client);
    if (!tenderByClient[name]) tenderByClient[name] = 0;
    tenderByClient[name]++;
  });
  const sortedTenderClients = Object.keys(tenderByClient).sort((a, b) => tenderByClient[b] - tenderByClient[a]);
  const topTenderClients = sortedTenderClients.slice(0, 8);

  const tenderBarData = {
    labels: topTenderClients.length > 0 ? topTenderClients : ['No Data'],
    datasets: [{
      label: 'Number of Tenders',
      data: topTenderClients.length > 0 ? topTenderClients.map(c => tenderByClient[c]) : [0],
      backgroundColor: 'rgba(156,39,176,0.7)',
      borderColor: 'rgba(156,39,176,1)',
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  const tenderBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top Clients by Tender Submissions',
        font: { size: 15, weight: '700' },
        padding: { bottom: 15 },
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            const v = ctx.parsed.y || 0;
            return v + ' tender' + (v > 1 ? 's' : '');
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Number of Tenders', font: { size: 11, weight: '600' } } },
    },
  };

  // ============ GANTT CHART ============
  const ganttData = tenders
    .filter(t => t.commencementDate && t.duration)
    .map(t => {
      const start = new Date(t.commencementDate);
      const end = new Date(start);
      end.setDate(end.getDate() + parseInt(t.duration));
      return {
        ...t,
        start,
        end,
        clientName: getClientName(t.client),
        vesselNames: t.proposedVessels?.map(v => getVesselName(v.vessel)).join(', ') || 'N/A',
        rates: t.proposedVessels?.map(v => v.proposedRate).join(', ') || 'N/A',
        duration: parseInt(t.duration)
      };
    })
    .sort((a, b) => a.start - b.start);

  let chartStartDate, chartEndDate;
  if (ganttData.length > 0) {
    chartStartDate = new Date(ganttData[0].start);
    chartEndDate = new Date(ganttData[ganttData.length - 1].end);
    chartStartDate.setDate(1);
    chartEndDate.setMonth(chartEndDate.getMonth() + 1);
    chartEndDate.setDate(0);
  } else {
    const now = new Date();
    chartStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    chartEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  const totalDaysInChart = Math.max(
    (chartEndDate - chartStartDate) / (1000 * 60 * 60 * 24),
    1
  );

  const ganttBars = ganttData.map(item => {
    const startOffset = Math.max(
      (item.start - chartStartDate) / (1000 * 60 * 60 * 24),
      0
    );
    const barWidth = Math.max(
      (item.duration / totalDaysInChart) * 100,
      2
    );
    const leftPos = (startOffset / totalDaysInChart) * 100;
    return { ...item, leftPos, barWidth };
  });

  const getStatusColor = (status) => {
    const colors = {
      'Awarded': '#4caf50',
      'Under Review': '#ff9800',
      'Submitted': '#2196f3',
      'Pending Submission': '#9c27b0',
      'Decline': '#f44336',
      'Unsuccessful': '#795548',
      'Aborted': '#607d8b'
    };
    return colors[status] || '#9e9e9e';
  };

  // ============ UTILIZATION ============
  const utilVesselSet = new Set();
  filteredUtilizations.forEach(u => {
    const name = getVesselName(u.vessel);
    if (name !== 'Unknown') utilVesselSet.add(name);
  });
  const utilVessels = Array.from(utilVesselSet);

  const utilData = {};
  const utilBudgetData = {};

  filteredUtilizations.forEach(u => {
    const month = u.month;
    const vessel = getVesselName(u.vessel);
    if (!utilData[month]) utilData[month] = {};
    if (!utilData[month][vessel]) utilData[month][vessel] = 0;
    utilData[month][vessel] += u.actualDays || 0;
    if (!utilBudgetData[month]) utilBudgetData[month] = 0;
    utilBudgetData[month] += u.budgetDays || 0;
  });

  const utilMonths = Object.keys(utilData).sort((a, b) => monthsOrder.indexOf(a) - monthsOrder.indexOf(b));

  const utilColors = [
    'rgba(25,118,210,0.7)',
    'rgba(46,125,50,0.7)',
    'rgba(237,108,2,0.7)',
    'rgba(156,39,176,0.7)',
    'rgba(211,47,47,0.7)',
    'rgba(121,85,72,0.7)',
    'rgba(233,30,99,0.7)',
    'rgba(255,193,7,0.7)',
    'rgba(96,125,139,0.7)',
    'rgba(139,195,74,0.7)',
  ];

  const utilBorderColors = [
    'rgba(25,118,210,1)',
    'rgba(46,125,50,1)',
    'rgba(237,108,2,1)',
    'rgba(156,39,176,1)',
    'rgba(211,47,47,1)',
    'rgba(121,85,72,1)',
    'rgba(233,30,99,1)',
    'rgba(255,193,7,1)',
    'rgba(96,125,139,1)',
    'rgba(139,195,74,1)',
  ];

  const utilDatasets = utilVessels.map((vessel, i) => ({
    label: vessel,
    data: utilMonths.map(m => utilData[m]?.[vessel] || 0),
    backgroundColor: utilColors[i % utilColors.length],
    borderColor: utilBorderColors[i % utilBorderColors.length],
    borderWidth: 1,
    borderRadius: 2,
  }));

  const utilBudgetLine = utilMonths.map(m => utilBudgetData[m] || 0);

  const utilizationStackedData = {
    labels: utilMonths,
    datasets: [
      ...utilDatasets,
      {
        label: 'Total Budget',
        data: utilBudgetLine,
        type: 'line',
        borderColor: '#d32f2f',
        backgroundColor: 'rgba(211,47,47,0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#d32f2f',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
        order: 0,
      }
    ],
  };

  const utilizationStackedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 11, weight: '600' }, usePointStyle: true, pointStyle: 'circle', padding: 10 },
      },
      title: {
        display: true,
        text: 'Monthly Utilization by Vessel (Stacked)',
        font: { size: 15, weight: '700' },
        padding: { bottom: 15 },
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            const label = ctx.dataset.label || '';
            const value = ctx.parsed.y || 0;
            if (label === 'Total Budget') return 'Total Budget: ' + value.toFixed(1) + ' days';
            return label + ': ' + value.toFixed(1) + ' days';
          }
        }
      }
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Days', font: { size: 11, weight: '600' } } },
    },
  };

  // ============ STATS ============
  const totalContracts = contracts.length;
  const totalContractValue = contracts.reduce((sum, c) => sum + (c.contractValue || 0), 0);
  const remainingContractValue = contracts.filter(c => getContractStatus(c) === 'Active').reduce((sum, c) => sum + (c.contractValue || 0), 0);
  const remainingPercent = totalContractValue > 0 ? ((remainingContractValue / totalContractValue) * 100).toFixed(1) : 0;
  
  const overallUtilization = calculateYTDUtilization(utilizations, selectedYear);
  const ytdDays = getYTDDays(utilizations, selectedYear);
  const ytdActualDays = ytdDays.actual;
  const ytdPossibleDays = ytdDays.possible;

  const totalInvoiceAmount = filteredInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalBudgetAmount = filteredBudgets.reduce((sum, b) => sum + (b.budgetedSale || 0), 0);
  const invoiceVariance = totalInvoiceAmount - totalBudgetAmount;
  const invoiceVariancePercent = totalBudgetAmount > 0 ? ((invoiceVariance / totalBudgetAmount) * 100).toFixed(2) : 0;

  const statsCards = [
    { 
      title: 'Total Contracts', 
      value: totalContracts, 
      icon: <ContractIcon sx={{ fontSize: 22 }} />, 
      color: '#1976d2', 
      bgColor: 'rgba(25, 118, 210, 0.1)',
      subtitle: `${contractStatusCounts.Active} Active • ${contractStatusCounts.Completed} Completed`
    },
    { 
      title: 'Contract Value', 
      value: `RM ${totalContractValue.toLocaleString()}`, 
      icon: <RevenueIcon sx={{ fontSize: 22 }} />, 
      color: '#2e7d32', 
      bgColor: 'rgba(46, 125, 50, 0.1)',
      subtitle: `Remaining: ${remainingPercent}%`
    },
    { 
      title: 'Total Tenders', 
      value: tenders.length, 
      icon: <TenderIcon sx={{ fontSize: 22 }} />, 
      color: '#e65100', 
      bgColor: 'rgba(230, 81, 0, 0.1)',
      subtitle: `${tenders.filter(t => t.status === 'Awarded').length} Awarded`
    },
    { 
      title: 'Overall Utilization', 
      value: `${overallUtilization.toFixed(1)}%`, 
      icon: <UtilizationIcon sx={{ fontSize: 22 }} />, 
      color: overallUtilization >= 80 ? '#4caf50' : overallUtilization >= 60 ? '#ff9800' : '#f44336',
      bgColor: overallUtilization >= 80 ? 'rgba(76, 175, 80, 0.1)' : overallUtilization >= 60 ? 'rgba(255, 152, 0, 0.1)' : 'rgba(244, 67, 54, 0.1)',
      subtitle: `${ytdActualDays.toFixed(1)} / ${ytdPossibleDays.toFixed(1)} days`
    },
  ];

  // ============ PRINT FUNCTION ============
  const handlePrint = async () => {
    setIsPrinting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const element = printRef.current;
      if (!element) {
        alert('No content to print');
        setIsPrinting(false);
        return;
      }

      const sections = element.querySelectorAll('.print-section');
      const itemsToPrint = sections.length > 0 ? sections : [element];
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow pop-ups for this site to print.');
        setIsPrinting(false);
        return;
      }

      const images = [];
      
      for (let i = 0; i < itemsToPrint.length; i++) {
        const item = itemsToPrint[i];
        
        const canvases = item.querySelectorAll('canvas');
        canvases.forEach(c => {
          c.style.width = '100%';
          c.style.height = 'auto';
          c.style.display = 'block';
        });

        const originalStyles = {
          height: item.style.height,
          overflow: item.style.overflow,
          maxHeight: item.style.maxHeight,
        };
        
        item.style.height = 'auto';
        item.style.overflow = 'visible';
        item.style.maxHeight = 'none';
        
        item.scrollIntoView({ behavior: 'auto', block: 'start' });
        
        await new Promise(resolve => setTimeout(resolve, 300));

        const canvas = await html2canvas(item, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: item.scrollWidth,
          height: item.scrollHeight,
          windowWidth: item.scrollWidth,
          windowHeight: item.scrollHeight,
          onclone: (clonedDoc, clonedElement) => {
            const clonedCanvases = clonedElement.querySelectorAll('canvas');
            clonedCanvases.forEach(c => {
              c.style.width = '100%';
              c.style.height = 'auto';
              c.style.display = 'block';
            });
          },
          timeout: 30000,
        });
        
        item.style.height = originalStyles.height;
        item.style.overflow = originalStyles.overflow;
        item.style.maxHeight = originalStyles.maxHeight;
        
        images.push(canvas.toDataURL('image/png', 1.0));
      }

      let imagesHtml = '';
      images.forEach((imgData, index) => {
        imagesHtml += `
          <div style="page-break-after: ${index < images.length - 1 ? 'always' : 'avoid'}; 
                      display: flex; 
                      justify-content: center; 
                      align-items: flex-start; 
                      width: 100%; 
                      min-height: 100vh; 
                      background: white; 
                      padding: 20px;">
            <img src="${imgData}" 
                 alt="Report Page ${index + 1}" 
                 style="max-width: 100%; 
                        height: auto; 
                        object-fit: contain;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.05);" />
          </div>
        `;
      });

      printWindow.document.write(`
        <html>
          <head>
            <title>Fleet Report</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                margin: 0; 
                padding: 0; 
                background: #f0f0f0;
                width: 100%;
              }
              img { 
                max-width: 100%; 
                height: auto;
                display: block;
              }
              @media print {
                body { 
                  margin: 0; 
                  padding: 0; 
                  background: white; 
                }
                div { 
                  page-break-after: avoid; 
                  padding: 0 !important;
                  min-height: 100vh;
                }
                img { 
                  max-width: 100%; 
                  height: auto;
                  box-shadow: none !important;
                }
              }
              @page {
                margin: 0;
                size: A4;
              }
            </style>
          </head>
          <body>
            ${imagesHtml}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 2000);
              };
            <\/script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing:', error);
      alert('Error generating print. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading report data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchData}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ fontFamily: '"Inter", sans-serif' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', fontFamily: '"Inter", sans-serif' }}>Executive Report</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontFamily: '"Inter", sans-serif' }}>
            Generated: {new Date().toLocaleString()} | Year: {selectedYear}
            {contracts.length > 0 && ` | ${contracts.length} contracts loaded`}
          </Typography>
        </Box>
        <Box className="no-print">
          <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel sx={{ fontFamily: '"Inter", sans-serif' }}>Year</InputLabel>
            <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} label="Year" sx={{ fontFamily: '"Inter", sans-serif' }}>
              {[2024, 2025, 2026, 2027, 2028].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <Button 
            className="no-print" 
            variant="contained" 
            startIcon={<PrintIcon />} 
            onClick={handlePrint} 
            disabled={isPrinting}
            sx={{ mr: 1, borderRadius: 2, textTransform: 'none', fontFamily: '"Inter", sans-serif' }}
          >
            {isPrinting ? 'Preparing...' : 'Print'}
          </Button>
          <Button 
            className="no-print" 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            sx={{ borderRadius: 2, textTransform: 'none', fontFamily: '"Inter", sans-serif' }}
            onClick={() => {
              const jsonData = {
                contracts: contracts.length,
                tenders: tenders.length,
                invoices: invoices.length,
                utilizations: utilizations.length,
                selectedYear: selectedYear,
                totalContractValue: totalContractValue,
                totalInvoiceAmount: totalInvoiceAmount,
              };
              const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `report-${selectedYear}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* ============ PRINT CONTENT ============ */}
      <Box ref={printRef} sx={{ p: 3, bgcolor: '#ffffff' }}>
        
        {/* SECTION 1: Header + Stats Cards */}
        <Box className="print-section" sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', fontFamily: '"Inter", sans-serif' }}>Executive Report</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontFamily: '"Inter", sans-serif', mb: 3 }}>
            Generated: {new Date().toLocaleString()} | Year: {selectedYear} | Data: {contracts.length} contracts, {tenders.length} tenders, {invoices.length} invoices
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statsCards.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
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
                    <Box sx={{ minWidth: 0 }}>
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
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: stat.color,
                          lineHeight: 1.2,
                          fontSize: '1.3rem',
                          whiteSpace: 'nowrap',
                          fontFamily: '"Inter", sans-serif',
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#94a3b8',
                          fontSize: '0.6rem',
                          display: 'block',
                          fontFamily: '"Inter", sans-serif',
                        }}
                      >
                        {stat.subtitle}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* SECTION 2: Invoice Summary */}
        <Paper className="print-section" sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #f0f2f5' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 2, fontFamily: '"Inter", sans-serif' }}>
            Invoices Summary ({filteredInvoices.length} invoices for {selectedYear})
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 2,
          }}>
            <Card sx={{ 
              p: 1.5, 
              bgcolor: '#F9FAFB', 
              borderRadius: 2, 
              border: '1px solid #E5E7EB', 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 80,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <InvoiceIcon sx={{ fontSize: 16, color: '#1976d2' }} />
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.5rem', fontFamily: '"Inter", sans-serif' }}>
                  Total Invoices
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: '"Inter", sans-serif', lineHeight: 1.2 }}>
                {filteredInvoices.length}
              </Typography>
            </Card>

            <Card sx={{ 
              p: 1.5, 
              bgcolor: '#F9FAFB', 
              borderRadius: 2, 
              border: '1px solid #E5E7EB', 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 80,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <RevenueIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.5rem', fontFamily: '"Inter", sans-serif' }}>
                  Total Sale
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', fontFamily: '"Inter", sans-serif', lineHeight: 1.2, textAlign: 'center' }}>
                RM {totalInvoiceAmount.toLocaleString()}
              </Typography>
            </Card>

            <Card sx={{ 
              p: 1.5, 
              bgcolor: '#F9FAFB', 
              borderRadius: 2, 
              border: '1px solid #E5E7EB', 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 80,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <RevenueIcon sx={{ fontSize: 16, color: '#e65100' }} />
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.5rem', fontFamily: '"Inter", sans-serif' }}>
                  Annual Budget
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', fontFamily: '"Inter", sans-serif', lineHeight: 1.2, textAlign: 'center' }}>
                RM {totalBudgetAmount.toLocaleString()}
              </Typography>
            </Card>

            <Card sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              border: `1px solid ${invoiceVariance >= 0 ? '#c8e6c9' : '#ffcdd2'}`,
              bgcolor: invoiceVariance >= 0 ? '#f0f7f4' : '#fef0f2',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 80,
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.5rem', fontFamily: '"Inter", sans-serif', color: '#6B7280', mb: 0.5 }}>
                Variance %
              </Typography>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                fontSize: '1.4rem', 
                color: invoiceVariance >= 0 ? '#4caf50' : '#f44336', 
                fontFamily: '"Inter", sans-serif', 
                lineHeight: 1.2 
              }}>
                {invoiceVariancePercent}%
              </Typography>
            </Card>

            <Card sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              border: `1px solid ${invoiceVariance >= 0 ? '#c8e6c9' : '#ffcdd2'}`,
              bgcolor: invoiceVariance >= 0 ? '#f0f7f4' : '#fef0f2',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 80,
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.5rem', fontFamily: '"Inter", sans-serif', color: '#6B7280', mb: 0.5 }}>
                Variance RM
              </Typography>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                fontSize: '0.95rem', 
                color: invoiceVariance >= 0 ? '#2e7d32' : '#c62828', 
                fontFamily: '"Inter", sans-serif',
                lineHeight: 1.2,
                textAlign: 'center'
              }}>
                {invoiceVariance >= 0 ? '+' : ''}RM {invoiceVariance.toLocaleString()}
              </Typography>
            </Card>
          </Box>
        </Paper>

        {/* SECTION 3: Invoice Charts */}
        <Box className="print-section" sx={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          gap: 3,
          mb: 4,
        }}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f2f5', height: 400, width: '100%' }}>
            <Bar data={invoiceStackedData} options={invoiceStackedOptions} />
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f2f5', height: 400, width: '100%' }}>
            <Line data={cumulativeLineData} options={cumulativeLineOptions} />
          </Paper>
        </Box>

        {/* SECTION 4: Doughnut Charts */}
        <Grid container spacing={3} className="print-section" sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f2f5', height: 320 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center', mb: 1, fontFamily: '"Inter", sans-serif' }}>Payment Status</Typography>
              <Doughnut data={paymentDoughnutData} options={doughnutOptions} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f2f5', height: 320 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center', mb: 1, fontFamily: '"Inter", sans-serif' }}>Contract Status</Typography>
              <Doughnut data={contractDoughnutData} options={doughnutOptions} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f2f5', height: 320 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center', mb: 1, fontFamily: '"Inter", sans-serif' }}>Tender Status</Typography>
              <Doughnut data={tenderDoughnutData} options={doughnutOptions} />
            </Paper>
          </Grid>
        </Grid>

        {/* SECTION 5: Contract & Tender Charts */}
        <Grid container spacing={3} className="print-section" sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f2f5', height: 320 }}>
              <Bar data={contractBarData} options={contractBarOptions} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f2f5', height: 320 }}>
              <Bar data={tenderBarData} options={tenderBarOptions} />
            </Paper>
          </Grid>
        </Grid>

        {/* SECTION 6: Gantt Chart */}
        {ganttData.length > 0 && (
          <Box className="print-section" sx={{ mb: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f2f5', overflow: 'visible' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 2, fontFamily: '"Inter", sans-serif' }}>
                Tender Timeline (Gantt Chart)
                <Chip label={`${ganttData.length} tenders`} size="small" sx={{ ml: 1, fontFamily: '"Inter", sans-serif' }} />
              </Typography>
              
              <Box sx={{ width: '100%', overflow: 'visible', position: 'relative' }}>
                <Box sx={{ display: 'flex', borderBottom: '2px solid #E5E7EB', pb: 1, mb: 1, position: 'relative' }}>
                  <Box sx={{ width: 150, flexShrink: 0, fontWeight: 600, fontSize: '0.7rem', color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>
                    Client / Vessel
                  </Box>
                  <Box sx={{ flex: 1, position: 'relative', height: 10 }} />
                </Box>

                {ganttBars.map((item, index) => {
                  const color = getStatusColor(item.status);
                  return (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, position: 'relative' }}>
                      <Box sx={{ width: 150, flexShrink: 0, pr: 1 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 500, fontSize: '0.7rem', fontFamily: '"Inter", sans-serif', color: '#111827' }}>
                          {item.clientName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" noWrap sx={{ fontSize: '0.6rem', fontFamily: '"Inter", sans-serif' }}>
                          {item.vesselNames}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, height: 28, bgcolor: '#F3F4F6', borderRadius: 1, position: 'relative', overflow: 'visible' }}>
                        <Tooltip
                          title={
                            <Box sx={{ p: 1.5, minWidth: 200 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff', mb: 0.5, fontFamily: '"Inter", sans-serif' }}>
                                {item.clientName || 'N/A'}
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
                          TransitionComponent={Zoom}
                          PopperProps={{
                            sx: {
                              '& .MuiTooltip-tooltip': {
                                bgcolor: '#111827',
                                borderRadius: 2,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                padding: '12px 16px',
                                maxWidth: 280,
                              },
                              '& .MuiTooltip-arrow': {
                                color: '#111827',
                              }
                            }
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              left: `${Math.max(item.leftPos, 0)}%`,
                              width: `${Math.min(Math.max(item.barWidth, 2), 100 - Math.max(item.leftPos, 0))}%`,
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
                              minWidth: '4px',
                              fontFamily: '"Inter", sans-serif',
                              zIndex: 2,
                              '&:hover': {
                                opacity: 0.85,
                                transform: 'scaleY(1.08)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              }
                            }}
                          >
                            {item.barWidth > 8 ? `${item.duration}d` : ''}
                          </Box>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Box>
        )}

        {/* SECTION 7: Utilization Chart */}
        {utilMonths.length > 0 && utilVessels.length > 0 && (
          <Box className="print-section" sx={{ mb: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f2f5', height: 420, width: '100%' }}>
              <Bar data={utilizationStackedData} options={utilizationStackedOptions} />
            </Paper>
          </Box>
        )}

        {/* No Data Message */}
        {utilMonths.length === 0 && (
          <Paper className="print-section" sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid #f0f2f5' }}>
            <Typography variant="body1" color="textSecondary">
              No utilization data available for {selectedYear}
            </Typography>
          </Paper>
        )}

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="textSecondary" sx={{ fontFamily: '"Inter", sans-serif' }}>
            DJ Group Chartering Database • Report Generated on {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default Reports;