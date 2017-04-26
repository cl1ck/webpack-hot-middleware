module.exports = webpackHotMiddleware;

function webpackHotMiddleware(compiler, opts) {
  opts = opts || {};
  opts.path = opts.path || '/__webpack_hmr';
  opts.port = opts.port || 3000;

  var io = require('socket.io')();
  var latestStats = null;

  io.sockets.on("connection", function(socket) {
    if (latestStats) {
      publishStats("sync", latestStats, socket);
    }
  });

  compiler.plugin("compile", function() {
    latestStats = null;
    io.sockets.emit("message", {action: "building"});
  });

  compiler.plugin("done", function(statsResult) {
    // Keep hold of latest stats so they can be propagated to new clients
    latestStats = statsResult;
    publishStats("built", latestStats, io.sockets);
  });

  var middleware = function(req, res, next) {
    return next();
  };

  io.listen(opts.port);

  middleware.publish = function(event) {
    io.sockets.emit("message", event);
  };
  middleware.close = function() {
    io.close();
  }
  return middleware;
}

function publishStats(action, statsResult, target) {
  // For multi-compiler, stats will be an object
  // with a 'children' array of stats
  var bundles = extractBundles(statsResult.toJson());
  bundles.forEach(function(stats) {
    target.emit("message", {
      name: stats.name,
      action: action,
      time: stats.time,
      hash: stats.hash,
      warnings: stats.warnings || [],
      errors: stats.errors || [],
      modules: buildModuleMap(stats.modules)
    });
  });
}

function extractBundles(stats) {
  // Stats has modules, single bundle
  if (stats.modules) return [stats];

  // Stats has children, multiple bundles
  if (stats.children && stats.children.length) return stats.children;

  // Not sure, assume single
  return [stats];
}

function buildModuleMap(modules) {
  var map = {};
  modules.forEach(function(module) {
    map[module.id] = module.name;
  });
  return map;
}
