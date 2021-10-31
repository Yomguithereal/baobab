import SBaobab from '../../src/sbaobab';
import {strict as assert} from 'assert';
describe('Types', function() {
    it('should have all the right types but this test doesn\'t actually test that', function() {
        assert.strictEqual(2 + 2, 4);
    });
    const name = 'Glorious colors';
    const initialState = {
        hello: 'world',
        palette: {
            colors: ['yellow', 'purple', 'green'],
            name: name
        },
        numberIn: {
            here: 5
        },
        very: {
            deeply: {
                nested: {
                    objects: {
                        are: 'okay'
                    }
                }
            }
        },
        somewhat: {
            nested: {
                objects: 'are',
            },
            also: 'okay'
        },
        lists: [
            ['a', 'b', 'c'],
            [0, 10, 20, 30, 40, 50],
            [{key: 'obj1', val: 'wow'}, {key: 'obj2', val: 'okay'}]
        ]
    };
    type InitialState = typeof initialState;
    const tree = new SBaobab(initialState);
    assert.strictEqual(tree.get('palette', 'name'), name);
    const numbersList = tree.select('lists', 1);
    numbersList.push(60);
    numbersList.push('foo'); // should throw error
    numbersList.unshift(0); // should throw error
    var sdtn = tree.pop(['lists', 0]);
    tree.apply('palette', p => ({...p, name: p.name + 'wow'}));
    tree.merge('palette', {name: 'newname'});
    tree.deepMerge({somewhat: {nested: {objects: 'really are'}}});
    var complexCursor = tree.select('lists', 2, {key: 'obj1'}, 'val');

    tree.on('update', e => {
        var rjks = e.type;
        var wxhj = e.target;
        var vvst = e.data;
    });

    tree.on('write', function(e) {
        const v1 = e.data.path;
    });



    tree.on('invalid', function(e) {
        const v2 = e.data.error;
    });


    tree.on('get', function(e) {
        const v3 = e.data.path;
        const v4 = e.data.solvedPath;
        const v5 = e.data.data;
    });



    tree.on('select', function(e) {
        const v6 = e.data.path;
        const v7 = e.data.cursor;
    });

    tree.select('lists', e => {
        var v1 = e.type;
        var v2 = e.target;
        var v3 = e.data;
    });
    numbersList.splice([1, 1, 100]);
    tree.select('numberIn', 'here').apply(x => x + 1);
    tree.select('numberIn').apply('here', x => x + 1);
    var zsxb = tree.select('palette', 'colors');
    var rfmy = tree.select('palette');
    var hzbk = tree.select('palette', 'colors');
    var ayco = tree.select('palette', 'colors', 2);
    var xbzu = tree.set('hello', 'monde');
    var opoc = tree.select('palette', 'colors', function(color) {
        return color === 'green';
    });

    var fyjb = tree.get('palette', 'colors', function(color) {
        return color === 'green';
    });

    var stou = tree.set({hello: 'bonjour', palette: {colors: ['green', 'red'], name: 'lame colors', invalidKey: 'should error'}});
    var hecg = tree.unset('hello');
    var vtyy = tree.project({
        name: ['one', 'name'],
        surname: ['two', 'surname']
    });
    var qssn = tree.set(initialState);
    var gzlk = tree.project([
        ['hello'],
        ['lists']
    ]);
    var dscz = hzbk.root();
    // tree.debugType

    var arqw = new SBaobab({
        list: [[1, 2], [3, 4]],
        longList: ['one', 'two', 'three', 'four']
    });

    var krfq = arqw.select('list'),
        ipfw = arqw.select('longList', 1);

    krfq.down().right().get();
    //   >>> [3, 4]

    krfq.select(1).down().right().get();
    //   >>> 4

    krfq.select(1).down().right().left().get();
    //   >>> 3

    ipfw.leftmost().get();
    //   >>> 'one'


    var rfdi = new SBaobab({list: [1, 2, 3]});

    rfdi.select('list').map(function(cursor, i) {
        console.log(cursor.get());
    });
    const atke = rfdi.select('list');
    atke.isRoot();
    atke.isBranch();
    atke.isLeaf();

    var dwuz = new SBaobab({x: 1, y: {z: 3}}, {
        validate: (_previousState, _newState, _affectedPaths) => {return undefined;}
    });

});