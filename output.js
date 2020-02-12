
(function(modules) {
  function require(id) {
    const [fn, mapping] = modules[id];
    const module = { exports: {} };

    function localRequire(relativePath) {
      return require(mapping[relativePath]);
    }

    fn(localRequire, module, module.exports);

    return module.exports;
  }

  require(0);
})({
  0: [
    function(require, module, exports) {
      "use strict";

      var _message = require("./message.js");

      var _hello = require("./hello.js");

      console.log(_hello.text);
      console.log(_message.message);
    },
    { "./message.js": 1, "./hello.js": 2 }
  ], 1: [
    function(require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.message = undefined;

      var _hello = require("./hello.js");

      var message = exports.message = "Message: " + _hello.text;
    },
    { "./hello.js": 2 }
  ], 2: [
    function(require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      // import { message } from './message.js';

      var text = exports.text = 'Hello everyone';
    },
    {}
  ],
});
