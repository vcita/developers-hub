/**
 * Express Server for API Validation Dashboard
 * Serves the UI and API endpoints for validation
 */

const express = require('express');
const path = require('path');

const { loadConfig, getMaskedConfig, validateConfig } = require('../core/config');
const { parseAllSwaggersAsync, filterEndpoints, getStatistics } = require('../core/parser/swagger-parser');
const { groupByDomainAndResource } = require('../core/orchestrator/resource-grouper');
const { generateMarkdownReport, generateFilename } = require('../core/reporter/markdown-generator');

// Import routes
const endpointsRouter = require('./routes/endpoints');
const validateRouter = require('./routes/validate');

// Store last validation results for report generation
let lastValidationResults = null;

const app = express();
const PORT = process.env.PORT || 3500;

// Middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for large validation reports
app.use(express.static(path.join(__dirname, '../ui')));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Load configuration and parse swaggers on startup
let appState = {
  config: null,
  endpoints: [],
  byDomain: {},
  domains: {},
  statistics: null,
  configValid: false,
  configErrors: [],
  configWarnings: []
};

async function initializeApp() {
  try {
    // Load configuration
    appState.config = loadConfig();
    
    // Validate configuration
    const validation = validateConfig(appState.config);
    appState.configValid = validation.valid;
    appState.configErrors = validation.errors;
    appState.configWarnings = validation.warnings || [];
    
    // Parse swagger files with $ref dereferencing for schema validation
    console.log('Loading and dereferencing swagger files...');
    const { endpoints, byDomain, domains } = await parseAllSwaggersAsync(appState.config.swaggerPath);
    appState.endpoints = endpoints;
    appState.byDomain = byDomain;
    appState.domains = domains;
    appState.statistics = getStatistics(endpoints);
    
    console.log(`Loaded ${endpoints.length} endpoints from ${Object.keys(domains).length} domains`);
  } catch (error) {
    console.error('Error initializing app:', error.message);
    appState.configErrors.push(error.message);
  }
}

// Make app state available to routes
app.use((req, res, next) => {
  req.appState = appState;
  next();
});

// API Routes
app.use('/api/endpoints', endpointsRouter);
app.use('/api/validate', validateRouter);

// Config endpoint
app.get('/api/config', (req, res) => {
  if (!appState.config) {
    return res.status(500).json({ 
      error: 'Configuration not loaded',
      errors: appState.configErrors 
    });
  }
  
  res.json({
    config: getMaskedConfig(appState.config),
    valid: appState.configValid,
    errors: appState.configErrors
  });
});

// Statistics endpoint
app.get('/api/statistics', (req, res) => {
  res.json({
    statistics: appState.statistics,
    domains: Object.keys(appState.domains)
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    configValid: appState.configValid,
    endpointsLoaded: appState.endpoints.length,
    timestamp: new Date().toISOString()
  });
});

// Reload swagger files
app.post('/api/reload', async (req, res) => {
  try {
    console.log('Reloading swagger files...');
    
    // Re-parse swagger files with $ref dereferencing
    const { endpoints, byDomain, domains } = await parseAllSwaggersAsync(appState.config.swaggerPath);
    appState.endpoints = endpoints;
    appState.byDomain = byDomain;
    appState.domains = domains;
    appState.statistics = getStatistics(endpoints);
    
    console.log(`Reloaded ${endpoints.length} endpoints from ${Object.keys(domains).length} domains`);
    
    res.json({
      success: true,
      message: `Reloaded ${endpoints.length} endpoints from ${Object.keys(domains).length} domains`,
      statistics: appState.statistics,
      domains: Object.keys(domains),
      endpointsLoaded: endpoints.length
    });
  } catch (error) {
    console.error('Error reloading swaggers:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Store validation results for report generation
app.post('/api/report/store', (req, res) => {
  try {
    lastValidationResults = req.body;
    res.json({ success: true, message: 'Results stored for report generation' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Markdown report from stored results
app.get('/api/report/markdown', (req, res) => {
  try {
    if (!lastValidationResults) {
      return res.status(404).json({ 
        error: 'No validation results available',
        message: 'Run a validation first to generate a report'
      });
    }
    
    const markdown = generateMarkdownReport(lastValidationResults);
    const filename = generateFilename(lastValidationResults);
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(markdown);
  } catch (error) {
    console.error('Error generating markdown report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate Markdown report from POST body (for immediate download)
app.post('/api/report/markdown', (req, res) => {
  try {
    const report = req.body;
    
    if (!report || !report.results) {
      return res.status(400).json({ 
        error: 'Invalid report data',
        message: 'Request body must contain validation results'
      });
    }
    
    const markdown = generateMarkdownReport(report);
    const filename = generateFilename(report);
    
    res.json({ 
      markdown,
      filename,
      size: markdown.length
    });
  } catch (error) {
    console.error('Error generating markdown report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve UI for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Initialize and start server
async function startServer() {
  await initializeApp();
  
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║         API Validation Dashboard                     ║
╠══════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}            ║
║  Endpoints loaded: ${String(appState.endpoints.length).padEnd(4)}                            ║
║  Domains: ${Object.keys(appState.domains).join(', ').substring(0, 30).padEnd(30)}  ║
╚══════════════════════════════════════════════════════╝
    `);
    
    if (!appState.configValid) {
      console.log('\n❌ Configuration errors:');
      for (const error of appState.configErrors) {
        console.log(`   • ${error}`);
      }
      console.log('\n');
    }
    
    if (appState.configWarnings && appState.configWarnings.length > 0) {
      console.log('\n⚠️  Configuration warnings:');
      for (const warning of appState.configWarnings) {
        console.log(`   • ${warning}`);
      }
      console.log('\n');
    }
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
