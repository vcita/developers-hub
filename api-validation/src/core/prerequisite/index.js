/**
 * Prerequisite Module
 * 
 * Exports all prerequisite-related functionality for deterministic
 * workflow execution before API validation tests.
 */

const { executeStep, executePrerequisites, createRequestFunction, parseYamlSteps, clearSwaggerCache } = require('./executor');
const { query, queryNested, extract } = require('./jsonpath');
const { resolve, resolveObject, findUnresolved, findAllUnresolved, listBuiltIns, addGenerator, BUILT_IN_GENERATORS } = require('./variables');

/**
 * Execute a complete workflow (Prerequisites + Test Request)
 * 
 * This function runs the workflow exactly as defined:
 * 1. Execute all prerequisite steps to gather required variables
 * 2. Execute the main test request with resolved variables
 * 
 * Prerequisites are executed recursively - if a prerequisite step has its own workflow,
 * that workflow's settings (useFallbackApi, prerequisites) are used.
 * 
 * @param {Object} workflow - Parsed workflow from repository (includes metadata like useFallbackApi)
 * @param {Object} config - Configuration with tokens, params, baseUrl, and fallbackUrl
 * @param {Function} makeRequest - Optional custom request function. If not provided, one is created
 *                                 using config.baseUrl/fallbackUrl and workflow.useFallbackApi
 * @param {Object} options - Additional options
 * @param {Object} options.workflowRepo - Workflow repository for recursive lookup of step workflows
 * @returns {Promise<Object>} Result with success status, response, and variables
 */
async function executeWorkflow(workflow, config, makeRequest, options = {}) {
  const { workflowRepo } = options;
  
  console.log(`\n🔄 Executing workflow: ${workflow.endpoint || 'Unknown endpoint'}`);
  
  // Check if workflow requires fallback API
  const useFallback = workflow.useFallbackApi === true || workflow.useFallbackApi === 'true';
  if (useFallback) {
    console.log(`  📍 Workflow requires fallback API (useFallbackApi: true)`);
  }
  
  // Create request function if not provided, respecting useFallbackApi from workflow
  if (!makeRequest) {
    makeRequest = createRequestFunction(config.baseUrl, {
      fallbackUrl: config.fallbackUrl,
      partnersUrl: config.partnersUrl,
      useFallback: useFallback
    });
  }
  
  // Step 1: Execute prerequisites (with recursive workflow lookup)
  const prereqResult = await executePrerequisites(workflow, config, makeRequest, { workflowRepo, workflow });
  
  if (!prereqResult.success) {
    console.log(`  ✗ Prerequisites failed: ${prereqResult.failedReason || 'Unknown error'}`);
    return {
      success: false,
      phase: 'prerequisites',
      failedStep: prereqResult.failedStep,
      failedReason: prereqResult.failedReason,
      variables: prereqResult.variables,
      steps: prereqResult.steps,
      usedFallback: useFallback
    };
  }
  
  // Step 2: Execute the test request
  const testRequest = workflow.testRequest;
  
  if (!testRequest) {
    console.log(`  ⚠ No test request defined in workflow`);
    return {
      success: true,
      phase: 'prerequisites_only',
      variables: prereqResult.variables,
      steps: prereqResult.steps,
      message: 'Prerequisites passed but no test request defined',
      usedFallback: useFallback
    };
  }
  
  console.log(`\n🎯 Executing test request...`);
  
  // Execute the test request step (with recursive workflow lookup)
  const testResult = await executeStep(testRequest, prereqResult.variables, config, makeRequest, { workflowRepo, workflow });
  
  if (!testResult.success) {
    console.log(`  ✗ Test request failed: ${testResult.error || 'Unknown error'}`);
    return {
      success: false,
      phase: 'test_request',
      failedReason: testResult.error,
      status: testResult.status,
      response: testResult.response,
      variables: prereqResult.variables,
      steps: [...prereqResult.steps, testResult],
      usedFallback: useFallback
    };
  }
  
  console.log(`  ✓ Test request succeeded with status ${testResult.status}`);
  
  return {
    success: true,
    phase: 'complete',
    status: testResult.status,
    response: testResult.response,
    variables: { ...prereqResult.variables, ...testResult.extracted },
    steps: [...prereqResult.steps, testResult],
    usedFallback: useFallback
  };
}

module.exports = {
  // Executor
  executeStep,
  executePrerequisites,
  executeWorkflow,
  createRequestFunction,
  parseYamlSteps,
  clearSwaggerCache,
  
  // JSONPath
  query,
  queryNested,
  extract,
  
  // Variables
  resolve,
  resolveObject,
  findUnresolved,
  findAllUnresolved,
  listBuiltIns,
  addGenerator,
  BUILT_IN_GENERATORS
};
