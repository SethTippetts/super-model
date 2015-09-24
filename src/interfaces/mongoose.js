'use strict';

import { pascalCase as pascal } from 'change-case';
import mongoose, { Schema } from 'mongoose';

export default (supermodel) => {
  if (!supermodel.identity) return {};
  if (!supermodel.tableName) supermodel.tableName = pascal(supermodel.identity);

  let obj = JSON.parse(JSON.stringify(supermodel));
  let real = new Schema(supermodel.attributes, {
    collection: obj.tableName,
    toObject: { getters: true },
    toJSON: { getters: true }
  });

  if (supermodel.virtuals) Object.keys(supermodel.virtuals)
    .map(key => {
      let virtual = supermodel.virtuals[key];
      if (virtual.get) real.virtual(key).get(virtual.get);
      if (virtual.set) real.virtual(key).set(virtual.set);
    });

  let model = mongoose.model(obj.tableName, real);

  Object.keys(supermodel.lifecycle)
    .map(key => {
      model[key] = supermodel.lifecycle[key];
    });

  return model;
};
