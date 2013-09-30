// Module
function cleaner(opts) {
  var options = middleware.options = {
    'add': false,
    'clean': true,
    'code': 301,
    'normalize': false,
    'sanitize': false
  };

  opts || (opts = {});

  Object.keys(options).forEach(function(opt) {
    if (opt in opts) {
      options[opt] = opts[opt];
    }
  });

  if (options.sanitize || options.add) {
    options.clean = false;
  }

  function middleware(req, res, next) {
    var shouldRedirect, url;

    if (pass(req.method, (url = req.url))) return next();

    url = url.replace(RE_QUESTION, '?').split('?');
    res._code = options.code;

    if (spoiledQuery(url[1])) {
      shouldRedirect = true;
      url = url.splice(0, 1);
    }

    if (options.clean && needClean(url[0])) {
      shouldRedirect = true;
      url[0] = clean(url[0]);
    } else if (options.sanitize && needSanitize(url)) {
      shouldRedirect = true;
      url = sanitize(url);
    }

    if (options.add && !(needClean(url[0]))) {
      shouldRedirect = true;
      url[0] = add(url[0]);
    }

    if (options.normalize && needNormalize(url[0])) {
      shouldRedirect = true;
      url[0] = normalize(url[0]);
    }

    if (shouldRedirect) {
      redirect(res, url);
    } else {
      next();
    }
  }

  return middleware;
}


// RegExps
RegExps: {
  var RE_TR_SLASH = /\/+$/;
  var RE_GARBAGE = /[\/?&=]+$/;
  var RE_QUESTION = /\?{2,}/;
}

// Checkers
Checkers: {
  function bigEnough(string) {
    return string.length > 1;
  }

  function spoiledQuery(query) {
    return query !== undefined && query.length === 0;
  }

  function needClean(path) {
    return bigEnough(path) && path[path.length -1] === '/';
  }

  function needNormalize(path) {
    return path !== path.toLowerCase();
  }

  function needSanitize(url) {
    return (bigEnough(url[0]) && RE_GARBAGE.test(url[0])) || RE_GARBAGE.test(url[1]);
  }

  function pass(method, url) {
    return !(method === 'GET' || method === 'HEAD' || !bigEnough(url));
  }
}


// Cleaners
Cleaners: {
  function clean(path) {
    return path.replace(RE_TR_SLASH, '');
  }

  function sanitize(url) {
    bigEnough(url[0]) && (url[0] = url[0].replace(RE_GARBAGE, ''));
    url[1] !== undefined && (url[1] = url[1].replace(RE_GARBAGE, ''));

    return url;
  }

  function add(path) {
    return path + '/';
  }

  function normalize(path) {
    return path.toLowerCase();
  }
}


// Utils
Utils: {
  function redirect(res, url) {
    res.writeHead(res._code, {
      'Location': url.join('?')
    });
    res.end();
  }

  function log() {
    console.log.call(console, arguments);
  }
}

cleaner.checkers = {
  'needClean': needClean,
  'needNormalize': needNormalize,
  'needSanitize': needSanitize,
  'pass': pass
};

cleaner.cleaners = {
  'add': add,
  'clean': clean,
  'sanitize': sanitize,
  'normalize': normalize
};

cleaner.utils = {
  'redirect': redirect,
  'log': log
};

module.exports = cleaner;