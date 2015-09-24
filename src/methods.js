'use strict';

import { get, set } from 'object-path';
import Promise from 'bluebird';

const METHODS = {
  query: ['beforeAccess'],
  create: ['Save', 'Create'],
  update: ['Save', 'Update'],
  remove: ['Delete']
};

function getStack(fn, model, type){
  let methods = METHODS[type];

  let stack = bindMethods(methods, model, 'before');
  stack.push(fn);
  return stack.concat(bindMethods(methods, model, 'after'));
}

function bindMethods(methods, model, phase) {
  return methods.map(method => model[phase + method].bind(model))
}

export function createMethod(fn, type) {
  let bodyPath = 'body';

  if (type === 'query') {
    bodyPath = 'query.filter';
  }

  let methods = METHODS[type];

  return (model, req, cb) => {
    return Promise.reduce(getStack(fn, model, type), (body, fn) => {
      return Promise.fromNode(cb => fn.call(model, body, req, cb));
    }, get(req, bodyPath))
    .nodeify(cb);
  };
}

export default (config) => {
  return Object.keys(config.methods)
}
