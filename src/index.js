const isArray = Array.isArray;
const isPlainObject = require('lodash.isplainobject');
const merge = require('lodash.merge');
const find = require('lodash.find');

const loaderNameRe = new RegExp(/[a-z\-]/ig);

function mergeLoaders(currentLoaders, newLoaders) {
  return newLoaders.reduce((mergedLoaders, loader) => {
    if (mergedLoaders.every(l => loader.match(loaderNameRe)[0] !== l.match(loaderNameRe)[0])) {
      // prepend because of rtl (latter objects should be able to build the chain)
      return mergedLoaders.concat(loader);
    }
    return mergedLoaders;
  }, currentLoaders);
}

function reduceLoaders(mergedLoaderConfigs, loaderConfig) {
  const foundLoader = find(mergedLoaderConfigs, l => String(l.test) === String(loaderConfig.test));

  // foundLoader.loader is intentionally ignored, because a string loader value should always override
  if (foundLoader.loaders) {
    const newLoaders = loaderConfig.loader ? [loaderConfig.loader] : loaderConfig.loaders || [];

    if (foundLoader.include || foundLoader.exclude) {
      return mergedLoaderConfigs.concat(loaderConfig);
    }

    foundLoader.loaders = mergeLoaders(foundLoader.loaders, newLoaders);
  } else if (!foundLoader) {
    return mergedLoaderConfigs.concat(loaderConfig);
  }

  return mergedLoaderConfigs;
}

function joinArrays(customizer, a, b, key) {
  if (isArray(a) && isArray(b)) {
    const customResult = customizer(a, b, key);

    if (customResult) {
      return customResult;
    }

    return a.concat(b);
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    return merge(a, b, joinArrays.bind(null, customizer));
  }

  return a;
}

module.exports = function () {
  const args = Array.prototype.slice.call(arguments);
  args.reverse();

  return merge.apply(null, [{}].concat(args).concat([
    joinArrays.bind(null, () => {})
  ]));
};

module.exports.smart = function webpackMerge() {
  const args = Array.prototype.slice.call(arguments);
  args.reverse();

  return merge.apply(null, [{}].concat(args).concat([
    joinArrays.bind(null, function (a, b, key) {
      if (['loaders', 'preLoaders', 'postLoaders'].indexOf(key) >= 0) {
        return b.reduce(reduceLoaders, a.slice());
      }
    })
  ]));
};
