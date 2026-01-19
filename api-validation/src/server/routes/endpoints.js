/**
 * Endpoints API Routes
 * GET /api/endpoints - List all endpoints with filtering
 */

const express = require('express');
const router = express.Router();

const { filterEndpoints } = require('../../core/parser/swagger-parser');
const { groupByDomainAndResource } = require('../../core/orchestrator/resource-grouper');

/**
 * GET /api/endpoints
 * List all endpoints with optional filtering
 * Query params: domain, method, tokenType, search
 */
router.get('/', (req, res) => {
  const { domain, method, tokenType, search, grouped } = req.query;
  const { endpoints, byDomain, domains } = req.appState;
  
  // Apply filters
  const filters = {};
  if (domain) filters.domain = domain;
  if (method) filters.method = method;
  if (tokenType) filters.tokenType = tokenType;
  if (search) filters.search = search;
  
  let filtered = filterEndpoints(endpoints, filters);
  
  // Return grouped or flat
  if (grouped === 'true' || grouped === '1') {
    const groupedEndpoints = groupByDomainAndResource(filtered);
    
    // Transform for UI
    const result = Object.entries(groupedEndpoints).map(([domainName, domainData]) => ({
      domain: domainName,
      totalEndpoints: domainData.totalEndpoints,
      resources: Object.entries(domainData.resources).map(([resourceName, resourceData]) => ({
        resource: resourceName,
        basePath: resourceData.basePath,
        endpoints: resourceData.endpoints.map(formatEndpoint)
      }))
    }));
    
    return res.json({
      total: filtered.length,
      domains: result
    });
  }
  
  // Flat list
  res.json({
    total: filtered.length,
    endpoints: filtered.map(formatEndpoint)
  });
});

/**
 * GET /api/endpoints/domains
 * List all available domains
 */
router.get('/domains', (req, res) => {
  const { domains, byDomain } = req.appState;
  
  const domainList = Object.entries(domains).map(([name, info]) => ({
    name,
    title: info.title,
    description: info.description,
    endpointCount: byDomain[name]?.length || 0
  }));
  
  res.json({
    domains: domainList
  });
});

/**
 * GET /api/endpoints/:domain
 * Get endpoints for a specific domain
 */
router.get('/:domain', (req, res) => {
  const { domain } = req.params;
  const { byDomain, domains } = req.appState;
  
  if (!byDomain[domain]) {
    return res.status(404).json({
      error: 'Domain not found',
      availableDomains: Object.keys(domains)
    });
  }
  
  const domainEndpoints = byDomain[domain];
  
  res.json({
    domain,
    info: domains[domain],
    total: domainEndpoints.length,
    endpoints: domainEndpoints.map(formatEndpoint)
  });
});

/**
 * Format endpoint for API response
 * @param {Object} endpoint - Raw endpoint object
 * @returns {Object} Formatted endpoint
 */
function formatEndpoint(endpoint) {
  return {
    id: `${endpoint.method}-${endpoint.path}`.replace(/[^a-zA-Z0-9]/g, '-'),
    domain: endpoint.domain,
    path: endpoint.path,
    method: endpoint.method,
    summary: endpoint.summary,
    description: endpoint.description,
    tags: endpoint.tags,
    version: endpoint.version,
    resource: endpoint.resource,
    hasUidParam: endpoint.hasUidParam,
    tokenInfo: {
      found: endpoint.tokenInfo.found,
      tokens: endpoint.tokenInfo.tokens,
      source: endpoint.tokenInfo.source
    },
    deprecated: endpoint.deprecated
  };
}

module.exports = router;
