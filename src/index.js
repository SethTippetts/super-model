import Promise from 'bluebird';
import path from 'path';
import loadModels from './models';
import assignMethods from './methods';
import assert from 'assert';
import debug from 'debug';
import interfaces from './interfaces';

let log = debug('super-model');
let initialized;
let configured = false;
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

  if (!configured) {
    configured = true;

    if (!config.factory) {
      config.factory = interfaces(config.plugin);
    }

    config = Object.assign({
      dir: path.join(process.cwd(), 'models'),
      factory: function(supermodel, cb) {
        throw new Error('No interface set!');
      },

      validate: function(attr, value, cb) {

      }
    }, config);

    // assignMethods(this, config);
  }

  return loadModels(config)
    .nodeify(next);
}

// Validation
// Query/Body Coercion
// Custom error messages
// Lifecycle Callbacks
// Model Extension
// Adding custom methods
