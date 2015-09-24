import glob from 'glob';
import path from 'path';
import assert from 'assert';

  let interfaces = glob.sync(path.join(__dirname, '*.js'))
    .filter(uri => (!/index/.test(uri)))
    .reduce((interfaces, uri) => {
      interfaces[path.basename(uri, '.js')] = require(uri);
      return interfaces;
    }, {});
    // .map(require)

export default function(interfaceName) {
  let plugin = interfaces[interfaceName];
  assert(plugin, 'No interface with name "' + interfaceName + '"');
  return plugin;
}
