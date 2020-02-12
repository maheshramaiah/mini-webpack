const fs = require('fs');
const path = require('path');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;
const babel = require('babel-core');

let ID = 0;

function createAsset(filename) {
  const file = fs.readFileSync(filename, { encoding: 'utf-8' });
  const ast = babylon.parse(file, {
    sourceType: 'module'
  });
  let dependencies = [];

  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    }
  });

  const { code } = babel.transformFromAst(ast, null, {
    presets: ['env']
  });

  return {
    id: ID++,
    filename,
    dependencies,
    code
  };
}

function createGraph(filename) {
  const asset = createAsset(filename);
  let queue = [asset];
  const dirname = path.dirname(filename);

  for (const data of queue) {
    data.mapping = {};

    data.dependencies.forEach(relativePath => {
      const absolutePath = path.join(dirname, relativePath);
      let child = queue.find(q => q.filename === absolutePath);

      if (!child) {
        child = createAsset(absolutePath);
        queue.push(child);
      }

      data.mapping[relativePath] = child.id;

      child.dependencies.forEach(depRelativePath => {
        const depAbsolutePath = path.join(dirname, depRelativePath);
        const dep = queue.find(a => a.filename === depAbsolutePath);

        if (dep && dep.dependencies.includes(relativePath)) {
          throw new Error(`Circular dependency between ${depAbsolutePath} and ${absolutePath}`);
        }
      })
    });
  }

  return queue;
}

function createBundle(graph) {
  let bundle = '';
  let modules = '';

  graph.forEach(mod => {
    modules += `${mod.id}: [
      function (require, module, exports) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)}
    ],`
  });

  bundle = `
    (function(modules) {
      function require(id) {
        const [fn, mapping] = modules[id];
        const module = {exports: {}};

        function localRequire(relativePath) {
          return require(mapping[relativePath]);
        }

        fn(localRequire, module, module.exports);

        return module.exports;
      }

      require(0);
    })({${modules}});
  `;

  return bundle;
}

const graph = createGraph('example/index.js');
const bundle = createBundle(graph);

fs.writeFileSync('output.js', bundle);