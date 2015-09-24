import Promise from 'bluebird';
import path from 'path';
import loadModels from './models';
import assert from 'assert';
import debug from 'debug';

let log = debug('super-model');
let initialized;
let configured;
let initPromise = Promise.fromNode(cb => (initialized = cb));

export let getModels = (name) => initPromise
  .then((collections) => {
    log('Getting models');
    if (!name) return collections;
    assert(collections[name], 'No collection with name "' + name + '" exists');
    return collections[name];
  });

export default getModels;

export function init(config, next) {

  assert(!configured, 'Already configured');
  configured = true;

  config = Object.assign({
    dir: path.join(process.cwd(), 'models'),
    factory: function(supermodel, cb) {
      throw new Error('No interface set!');
    },

    validate: function(attr, value, cb) {

    }
  }, config);

  return loadModels(config).nodeify(initialized);
};

// Validation
// Query/Body Coercion
// Custom error messages
// Lifecycle Callbacks
// Model Extension
// Adding custom methods
