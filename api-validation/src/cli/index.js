#!/usr/bin/env node
/**
 * API Validation CLI
 * Command-line interface for running API validation tests
 */

const { Command } = require('commander');
const path = require('path');

const { loadConfig, validateConfig, getMaskedConfig } = require('../core/config');
const { parseAllSwaggers, filterEndpoints, getStatistics } = require('../core/parser/swagger-parser');
const { validateSpec } = require('../core/validator/doc-validator');
const { buildTestSequence, createTestContext } = require('../core/orchestrator/test-sequencer');
const { createApiClient, buildRequestConfig, executeRequest, extractUidFromResponse } = require('../core/runner/api-client');
const { createRateLimiter } = require('../core/runner/rate-limiter');
const { validateAgainstSchema, validateStatusCode, buildValidationResult, getSuggestion, FAILURE_REASONS } = require('../core/validator/response-validator');
const { createReport, addDocumentationIssue, addResult, finalizeReport, saveReport, getFailures } = require('../core/reporter/report-generator');
const { printReport, printProgress, clearProgress, colors } = require('../core/reporter/console-formatter');

const program = new Command();

program
  .name('api-validation')
  .description('Validate API documentation against live endpoints')
  .version('1.0.0');

program
  .option('-d, --domain <domain>', 'Filter by domain (ai, apps, clients, etc.)')
  .option('-m, --method <method>', 'Filter by HTTP method (GET, POST, PUT, DELETE)')
  .option('--dry-run', 'Parse and validate docs without making API calls')
  .option('--strict', 'Stop on first documentation issue')
  .option('-q, --quiet', 'Minimal output')
  .option('-o, --output <path>', 'Save report to JSON file')
  .option('--rate-limit <preset>', 'Rate limit preset (conservative, normal, aggressive, sequential)')
  .option('--concurrent <n>', 'Max concurrent requests', parseInt)
  .option('--delay <ms>', 'Delay between requests in ms', parseInt)
  .option('--include-delete', 'Include DELETE operations (destructive)')
  .option('--show-passing', 'Show passing tests in output')
  .option('--base-url <url>', 'Override base URL')
  .action(async (options) => {
    try {
      await runValidation(options);
    } catch (error) {
      console.error(colors.red + 'Error: ' + error.message + colors.reset);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

/**
 * Main validation runner
 * @param {Object} options - CLI options
 */
async function runValidation(options) {
  const startTime = Date.now();
  
  // Load configuration with overrides
  const configOverrides = {};
  if (options.baseUrl) configOverrides.baseUrl = options.baseUrl;
  if (options.rateLimit) configOverrides.rateLimitPreset = options.rateLimit;
  if (options.concurrent) {
    configOverrides.rateLimit = configOverrides.rateLimit || {};
    configOverrides.rateLimit.maxConcurrent = options.concurrent;
  }
  if (options.delay) {
    configOverrides.rateLimit = configOverrides.rateLimit || {};
    configOverrides.rateLimit.delayBetweenRequests = options.delay;
  }
  
  const config = loadConfig(configOverrides);
  
  // Validate configuration
  const configValidation = validateConfig(config);
  if (!configValidation.valid) {
    console.error(colors.red + 'Configuration errors:' + colors.reset);
    for (const error of configValidation.errors) {
      console.error(colors.red + '  • ' + error + colors.reset);
    }
    process.exit(1);
  }
  
  if (!options.quiet) {
    console.log(colors.cyan + 'API Validation' + colors.reset);
    console.log(colors.dim + `Base URL: ${config.baseUrl}` + colors.reset);
    console.log();
  }
  
  // Parse swagger files
  if (!options.quiet) {
    console.log(colors.dim + 'Loading swagger files...' + colors.reset);
  }
  
  const { endpoints, byDomain, domains } = parseAllSwaggers(config.swaggerPath);
  
  if (!options.quiet) {
    const stats = getStatistics(endpoints);
    console.log(colors.dim + `Found ${stats.total} endpoints across ${Object.keys(domains).length} domains` + colors.reset);
  }
  
  // Filter endpoints
  const filters = {};
  if (options.domain) filters.domain = options.domain;
  if (options.method) filters.method = options.method;
  
  let targetEndpoints = filterEndpoints(endpoints, filters);
  
  if (targetEndpoints.length === 0) {
    console.error(colors.red + 'No endpoints match the specified filters' + colors.reset);
    process.exit(1);
  }
  
  if (!options.quiet) {
    console.log(colors.dim + `Testing ${targetEndpoints.length} endpoints` + colors.reset);
    console.log();
  }
  
  // Create report
  const report = createReport(config);
  
  // Validate documentation first
  if (!options.quiet) {
    console.log(colors.dim + 'Validating documentation...' + colors.reset);
  }
  
  for (const [domain, domainEndpoints] of Object.entries(byDomain)) {
    if (options.domain && domain !== options.domain) continue;
    
    // Build a pseudo-spec for validation
    const pseudoSpec = {
      paths: {}
    };
    
    for (const endpoint of domainEndpoints) {
      if (!pseudoSpec.paths[endpoint.path]) {
        pseudoSpec.paths[endpoint.path] = {};
      }
      pseudoSpec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        parameters: [...endpoint.parameters.path, ...endpoint.parameters.query],
        responses: endpoint.responseSchema ? { '200': { content: { 'application/json': { schema: endpoint.responseSchema } } } } : {}
      };
    }
    
    const docValidation = validateSpec(pseudoSpec);
    
    for (const issue of docValidation.errors) {
      addDocumentationIssue(report, issue);
      
      if (options.strict) {
        console.error(colors.red + `Documentation issue: ${issue.endpoint} - ${issue.message}` + colors.reset);
        process.exit(1);
      }
    }
  }
  
  if (!options.quiet && report.documentationIssues.length > 0) {
    console.log(colors.yellow + `Found ${report.documentationIssues.length} documentation issues` + colors.reset);
  }
  
  // If dry-run, stop here
  if (options.dryRun) {
    if (!options.quiet) {
      console.log();
      console.log(colors.cyan + 'Dry run complete - no API calls made' + colors.reset);
      console.log(colors.dim + `Documentation issues: ${report.documentationIssues.length}` + colors.reset);
    }
    
    const duration = Date.now() - startTime;
    finalizeReport(report, duration);
    
    if (options.output) {
      saveReport(report, options.output);
      console.log(colors.dim + `Report saved to ${options.output}` + colors.reset);
    }
    
    return;
  }
  
  // Build test sequence
  const { sequence } = buildTestSequence(targetEndpoints, {
    runDelete: options.includeDelete
  });
  
  // Create API client and rate limiter
  const apiClient = createApiClient(config);
  const rateLimiter = createRateLimiter(options.rateLimit || 'normal', {
    maxConcurrent: options.concurrent,
    delayBetweenRequests: options.delay
  });
  
  // Create test context for UID sharing
  const testContext = createTestContext();
  
  // Execute tests
  if (!options.quiet) {
    console.log();
    console.log(colors.dim + 'Running tests...' + colors.reset);
  }
  
  let completed = 0;
  const total = sequence.length;
  
  for (const testItem of sequence) {
    const { endpoint, phase, captureUid, requiresUid, skip, skipReason, resourceKey } = testItem;
    
    // Handle skipped tests
    if (skip) {
      addResult(report, {
        endpoint: `${endpoint.method} ${endpoint.path}`,
        domain: endpoint.domain,
        method: endpoint.method,
        path: endpoint.path,
        status: 'SKIP',
        httpStatus: null,
        duration: '0ms',
        durationMs: 0,
        tokenUsed: null,
        details: {
          reason: 'SKIPPED',
          friendlyMessage: skipReason
        }
      });
      completed++;
      continue;
    }
    
    // Get UID from context if required
    const context = {};
    if (requiresUid) {
      const uid = testContext.getUid(resourceKey);
      if (!uid) {
        // Can't run this test without UID - skip it
        addResult(report, {
          endpoint: `${endpoint.method} ${endpoint.path}`,
          domain: endpoint.domain,
          method: endpoint.method,
          path: endpoint.path,
          status: 'SKIP',
          httpStatus: null,
          duration: '0ms',
          durationMs: 0,
          tokenUsed: null,
          details: {
            reason: 'SKIPPED',
            friendlyMessage: 'Required UID not available (create operation may have failed or been skipped)'
          }
        });
        completed++;
        continue;
      }
      context.uid = uid;
    }
    
    // Build request
    const { config: requestConfig, tokenType, hasToken } = buildRequestConfig(endpoint, config, context);
    
    if (!hasToken && endpoint.tokenInfo.found) {
      // No token available for this endpoint
      const result = buildValidationResult({
        endpoint,
        status: 'FAIL',
        httpStatus: null,
        duration: 0,
        tokenUsed: tokenType,
        reason: FAILURE_REASONS.AUTH_FAILED,
        suggestion: `Configure a ${tokenType} token in config/tokens.json`
      });
      addResult(report, result);
      completed++;
      
      if (!options.quiet) {
        printProgress(completed, total, result);
      }
      continue;
    }
    
    // Execute request with rate limiting
    const { success, response, duration, error } = await rateLimiter.execute(
      () => executeRequest(apiClient, requestConfig)
    );
    
    // Process result
    let result;
    
    if (error && error.isNetworkError) {
      result = buildValidationResult({
        endpoint,
        status: 'FAIL',
        httpStatus: null,
        duration,
        tokenUsed: tokenType,
        reason: FAILURE_REASONS.NETWORK_ERROR,
        suggestion: 'Check network connectivity and base URL configuration'
      });
    } else if (error && error.isTimeout) {
      result = buildValidationResult({
        endpoint,
        status: 'FAIL',
        httpStatus: null,
        duration,
        tokenUsed: tokenType,
        reason: FAILURE_REASONS.TIMEOUT,
        suggestion: 'Endpoint may be slow - consider increasing timeout'
      });
    } else if (response) {
      // Validate status code
      const statusValidation = validateStatusCode(
        response.status,
        endpoint.responseSchema ? { '200': {}, '201': {} } : {}
      );
      
      if (!statusValidation.valid) {
        result = buildValidationResult({
          endpoint,
          status: 'FAIL',
          httpStatus: response.status,
          duration,
          tokenUsed: tokenType,
          reason: statusValidation.error.reason,
          suggestion: getSuggestion(statusValidation.error.reason, { tokenType }),
          response: { status: response.status, data: response.data }
        });
      } else {
        // Validate response schema (if available and status is success)
        const responseData = response.data;
        
        // For create operations, try to capture UID
        if (captureUid && responseData) {
          const uid = extractUidFromResponse(responseData);
          if (uid) {
            testContext.setUid(resourceKey, uid);
          }
        }
        
        // Schema validation (optional - many endpoints may not have schemas)
        if (endpoint.responseSchema && responseData) {
          const schemaValidation = validateAgainstSchema(responseData, endpoint.responseSchema);
          
          if (!schemaValidation.valid) {
            result = buildValidationResult({
              endpoint,
              status: 'FAIL',
              httpStatus: response.status,
              duration,
              tokenUsed: tokenType,
              reason: FAILURE_REASONS.SCHEMA_MISMATCH,
              errors: schemaValidation.errors,
              suggestion: getSuggestion(schemaValidation.errors[0]?.reason, { 
                field: schemaValidation.errors[0]?.path 
              }),
              response: { status: response.status, data: responseData }
            });
          } else {
            result = buildValidationResult({
              endpoint,
              status: 'PASS',
              httpStatus: response.status,
              duration,
              tokenUsed: tokenType
            });
          }
        } else {
          // No schema to validate against - pass based on status code
          result = buildValidationResult({
            endpoint,
            status: 'PASS',
            httpStatus: response.status,
            duration,
            tokenUsed: tokenType
          });
        }
      }
    } else {
      result = buildValidationResult({
        endpoint,
        status: 'FAIL',
        httpStatus: null,
        duration,
        tokenUsed: tokenType,
        reason: FAILURE_REASONS.NETWORK_ERROR,
        suggestion: 'Unknown error occurred'
      });
    }
    
    addResult(report, result);
    completed++;
    
    if (!options.quiet) {
      printProgress(completed, total, result);
    }
  }
  
  if (!options.quiet) {
    clearProgress();
  }
  
  // Finalize report
  const duration = Date.now() - startTime;
  finalizeReport(report, duration);
  
  // Print report
  printReport(report, {
    quiet: options.quiet,
    showPassing: options.showPassing
  });
  
  // Save report if output specified
  if (options.output) {
    const outputPath = path.resolve(options.output);
    saveReport(report, outputPath);
    if (!options.quiet) {
      console.log(colors.dim + `Report saved to ${outputPath}` + colors.reset);
    }
  }
  
  // Exit with appropriate code
  const failures = getFailures(report);
  if (failures.length > 0) {
    process.exit(1);
  }
}

// Parse and run
program.parse();
