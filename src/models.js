import glob from 'glob';
import path from 'path';
import Promise from 'bluebird';
import { merge } from 'lodash';
import { get, set } from 'object-path';

const METHODS = [
  // GET
  'beforeAccess',
  'afterAccess',

  // PUT, POST
  'beforeSave',
  'afterSave',

  // PUT
  'beforeUpdate',
  'afterUpdate',

  // POST
  'beforeCreate',
  'afterCreate',

  // DELETE
  'beforeRemove',
  'afterRemove',
];

let passThrough = (data) => Promise.resolve(data);

export default function(config) {
  console.log('paths', config.dir, '**/*.js');
  var schema = glob
    .sync(path.join(config.dir, '**/*.js'))
    .map(uri => {
      let model = require(uri);
      if (!model.identity) model.identity = path.basename(uri, '.js');
      model.identity = model.identity.toLowerCase();
      return model;
    })
    .reduce((schema, schemata) => {
      schema[schemata.identity] = schemata;
      return schema;
    }, {});

  let isFactoryPromise = config.factory.length < 2;

  let models = Object.keys(schema)
    .map(getModel)
    .map(model => merge({}, config.defaults, setLifecycle(model)))
    .filter(model => model.public !== false)
    .reduce((schema, schemata) => {
      schema[schemata.identity] = wrapMethod(config.factory)(schemata);
      return schema;
    }, {});

  return Promise.props(models);

  function wrapMethod(fn, len=1) {
    if (len <= fn.length) return Promise.method(fn);
    return (...args) => Promise.fromNode(cb => {
      args.push(cb);
      fn.apply(fn, args);
    });
  }

  function getModel(name) {
    var obj = schema[name];
    if (!obj) throw new Error(`Schmemata for model ${name} not found`);
    if (obj.base) obj = merge({}, getModel(obj.base), obj, (a, b, key) => {
      if (~METHODS.indexOf(key) && a && b) {
        if (!Array.isArray(a)) a = [a];
        if (!Array.isArray(b)) b = [b];
        return a.concat(b);
      }
    });
    return obj;
  }

  function setLifecycle(model) {
    METHODS
      .map(method => {
        let lifecyclePath = ['lifecycle', method];
        let fn = get(model, lifecyclePath, passThrough);
        set(model, lifecyclePath, execLifecycle.bind(model, fn));
      }, {});
    return model;
  }

  function execLifecycle(lifecycle, ...args) {
    let [instance] = args;
    if (!instance) instance = args[0] = {};
    if (!lifecycle) lifecycle = () => Promise.resolve(instance);
    if (!Array.isArray(lifecycle)) lifecycle = [lifecycle];

    return Promise.reduce(lifecycle, (prev, mw) => {
      return wrapMethod(mw, 2)
        .apply(this, args)
        .then(ins => {
          if (typeof ins !== 'undefined') return ins;
          return instance;
        });
    }, instance);
  }
}
