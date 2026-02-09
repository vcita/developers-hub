/**
 * Prerequisite Module
 * 
 * Exports all prerequisite-related functionality for deterministic
 * workflow execution before API validation tests.
 */

const { executeStep, executePrerequisites, createRequestFunction, parseYamlSteps } = require('./executor');
const { query, queryNested, extract } = require('./jsonpath');
const { resolve, resolveObject, findUnresolved, findAllUnresolved, listBuiltIns, addGenerator, BUILT_IN_GENERATORS } = require('./variables');

module.exports = {
  // Executor
  executeStep,
  executePrerequisites,
  createRequestFunction,
  parseYamlSteps,
  
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
