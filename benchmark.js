var Benchmark = require('benchmark'),
    Baobab = require('./');

var suite = new Benchmark.Suite();

var tree = new Baobab();
tree.set(['a', 'b', 'c', 'd', 'e', 'f', 'g'], []);

var cursor = tree.select(['a', 'b', 'c']);

suite
  .add('Baobab#get', function() {
    tree.get(['a', 'b', 'c', 'd']);
  })
  .add('Baobab#set', function() {
    tree.set(['a', 'b', 'c', 'foo'], 'bar');
  })
  .add('Baobab#unset', function() {
    tree.unset(['a', 'b', 'c', 'foo']);
  })
  .add('Baobab.Cursor#set', function() {
    cursor.set({ d: { e: { f: { g: [] } } } });
    cursor.set(['d', 'e', 'f', 'foo'], 'bar');
  })
  .add('Baobab.Cursor#unset', function() {
    cursor.unset(['d', 'e', 'f', 'foo']);
  })
  .add('Baobab.Cursor#push', function() {
    cursor.push(['d', 'e', 'f', 'g'], 'baobab');
  })
  .add('Baobab.Cursor#unshift', function() {
    cursor.unshift(['d', 'e', 'f', 'g'], 'baobab');
  })
  .add('Baobab.Cursor#splice', function() {
    cursor.splice(['d', 'e', 'f', 'g'], [1, 1, 'baobab']);
  })
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .run();
