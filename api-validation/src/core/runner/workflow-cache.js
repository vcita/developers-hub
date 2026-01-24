/**
 * Workflow Cache Module
 * Manages learned workflows with in-memory cache backed by JSON persistence
 */

const fs = require('fs');
const path = require('path');

// In-memory cache
let workflowCache = new Map();

// Default cache file path
const DEFAULT_CACHE_PATH = path.join(__dirname, '../../config/workflow-cache.json');

/**
 * Initialize the workflow cache from disk
 * @param {string} cachePath - Path to cache file
 */
function initializeCache(cachePath = DEFAULT_CACHE_PATH) {
  try {
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      workflowCache = new Map(Object.entries(data));
      console.log(`[Workflow Cache] Loaded ${workflowCache.size} cached workflows`);
    } else {
      workflowCache = new Map();
      console.log('[Workflow Cache] No cache file found, starting fresh');
    }
  } catch (error) {
    console.error('[Workflow Cache] Failed to load cache:', error.message);
    workflowCache = new Map();
  }
}

/**
 * Save the workflow cache to disk
 * @param {string} cachePath - Path to cache file
 */
function saveCache(cachePath = DEFAULT_CACHE_PATH) {
  try {
    const data = Object.fromEntries(workflowCache);
    
    // Ensure directory exists
    const dir = path.dirname(cachePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
    console.log(`[Workflow Cache] Saved ${workflowCache.size} workflows to disk`);
  } catch (error) {
    console.error('[Workflow Cache] Failed to save cache:', error.message);
  }
}

/**
 * Get a cached workflow for an endpoint
 * @param {string} endpointKey - Endpoint key (e.g., "POST /v3/scheduling/resources")
 * @returns {Object|null} Cached workflow or null
 */
function getWorkflow(endpointKey) {
  const workflow = workflowCache.get(endpointKey);
  
  if (workflow) {
    // Update last accessed time
    workflow.lastAccessed = new Date().toISOString();
    console.log(`[Workflow Cache] Hit for ${endpointKey}`);
    return workflow;
  }
  
  console.log(`[Workflow Cache] Miss for ${endpointKey}`);
  return null;
}

/**
 * Save a workflow to the cache
 * @param {string} endpointKey - Endpoint key
 * @param {Object} workflow - Workflow data
 */
function saveWorkflow(endpointKey, workflow) {
  const existingWorkflow = workflowCache.get(endpointKey);
  
  const workflowData = {
    ...workflow,
    lastUsed: new Date().toISOString(),
    successCount: (existingWorkflow?.successCount || 0) + 1,
    createdAt: existingWorkflow?.createdAt || new Date().toISOString()
  };
  
  workflowCache.set(endpointKey, workflowData);
  console.log(`[Workflow Cache] Saved workflow for ${endpointKey} (success count: ${workflowData.successCount})`);
  
  // Persist to disk
  saveCache();
}

/**
 * Remove a workflow from the cache (e.g., if it leads to errors)
 * @param {string} endpointKey - Endpoint key
 */
function removeWorkflow(endpointKey) {
  if (workflowCache.has(endpointKey)) {
    workflowCache.delete(endpointKey);
    console.log(`[Workflow Cache] Removed workflow for ${endpointKey}`);
    saveCache();
  }
}

/**
 * Increment failure count for a workflow
 * If failures exceed threshold, remove the workflow
 * @param {string} endpointKey - Endpoint key
 * @param {number} threshold - Failure threshold before removal (default 3)
 */
function recordWorkflowFailure(endpointKey, threshold = 3) {
  const workflow = workflowCache.get(endpointKey);
  
  if (workflow) {
    workflow.failureCount = (workflow.failureCount || 0) + 1;
    workflow.lastFailure = new Date().toISOString();
    
    if (workflow.failureCount >= threshold) {
      console.log(`[Workflow Cache] Workflow for ${endpointKey} exceeded failure threshold, removing`);
      removeWorkflow(endpointKey);
    } else {
      workflowCache.set(endpointKey, workflow);
      saveCache();
    }
  }
}

/**
 * Get all cached workflows
 * @returns {Object} All workflows as an object
 */
function getAllWorkflows() {
  return Object.fromEntries(workflowCache);
}

/**
 * Clear all cached workflows
 */
function clearCache() {
  workflowCache.clear();
  saveCache();
  console.log('[Workflow Cache] Cleared all workflows');
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
function getCacheStats() {
  const workflows = Array.from(workflowCache.values());
  
  return {
    totalWorkflows: workflowCache.size,
    totalSuccesses: workflows.reduce((sum, w) => sum + (w.successCount || 0), 0),
    totalFailures: workflows.reduce((sum, w) => sum + (w.failureCount || 0), 0),
    oldestWorkflow: workflows.length > 0 
      ? workflows.reduce((oldest, w) => 
          !oldest || new Date(w.createdAt) < new Date(oldest.createdAt) ? w : oldest
        , null)?.createdAt
      : null,
    newestWorkflow: workflows.length > 0
      ? workflows.reduce((newest, w) => 
          !newest || new Date(w.createdAt) > new Date(newest.createdAt) ? w : newest
        , null)?.createdAt
      : null
  };
}

/**
 * Execute a cached workflow
 * @param {Object} workflow - Cached workflow
 * @param {Object} apiClient - Axios instance
 * @param {Object} config - App config
 * @param {Object} resolvedParams - Currently resolved params
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Result with new resolved params
 */
async function executeCachedWorkflow(workflow, apiClient, config, resolvedParams, onProgress) {
  const { executePrerequisite } = require('./ai-agent-healer');
  
  const newParams = { ...resolvedParams };
  const createdEntities = [];
  
  onProgress?.({ type: 'using_cached_workflow', workflow });
  
  for (let i = 0; i < workflow.prerequisites.length; i++) {
    const prereq = workflow.prerequisites[i];
    
    onProgress?.({
      type: 'executing_cached_step',
      step: i + 1,
      totalSteps: workflow.prerequisites.length,
      prerequisite: prereq
    });
    
    const result = await executePrerequisite(
      prereq,
      apiClient,
      config,
      newParams,
      onProgress
    );
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        failedStep: i + 1
      };
    }
    
    createdEntities.push(result);
    
    if (result.extractedUid && result.storeAs) {
      newParams[result.storeAs] = result.extractedUid;
    }
  }
  
  return {
    success: true,
    newParams,
    createdEntities
  };
}

// Initialize cache on module load
initializeCache();

module.exports = {
  initializeCache,
  saveCache,
  getWorkflow,
  saveWorkflow,
  removeWorkflow,
  recordWorkflowFailure,
  getAllWorkflows,
  clearCache,
  getCacheStats,
  executeCachedWorkflow
};
