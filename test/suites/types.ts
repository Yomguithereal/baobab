import SBaobab from '../../src/sbaobab';
import {strict as assert} from 'assert';

const initialState = {
    hello: 'world',
    palette: {
        colors: ['yellow', 'purple', 'green'],
        name: 'Glorious colors'
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
interface InitialState {
    hello: string,
    palette: {
        colors: string[];
        name: string;
    },
    numberIn: {
        here: 5;
    },
    very: {
        deeply: {
            nested: {
                objects: {
                    are: string;
                };
            };
        };
    },
    somewhat: {
        nested: {
            objects: string,
        },
        also: string;
    },
    lists: [
        string[],
        number[],
        {key: string, val: string;}[]
    ];
};




describe('Types', function() {
    it('should have all the right types but this test doesn\'t actually test that', function() {
        assert.strictEqual(2 + 2, 4);
    });

    type InitialState = typeof initialState;
    const tree = new SBaobab<InitialState>(initialState);
    const rnjt = tree.get();
    const ljda = rnjt.palette.name;
    const yxwi = rnjt?.invalid?.key; // invalid
    const getName = tree.get('palette', 'name');
    assert.strictEqual(getName, name);
    const numbersList = tree.select('lists', 1);
    numbersList.push(60);
    numbersList.push('foo'); // should throw error
    numbersList.unshift(0); // should throw error
    numbersList.exists();
    tree.serialize();
    tree.serialize(['somewhat', 'nested']);
    const watcher = tree.watch({
        name: ['palette', 'name'],
        nested: ['somewhat', 'nested']
    });
    watcher.get();
    const liox = numbersList.clone();
    const ampw = numbersList.deepClone();
    const sdtn = tree.pop(['lists', 0]);
    const ncow = tree.concat(['lists', 0], ['d', 'e', 'f']);
    const oczw = tree.concat(['lists', 0], [36]); // invalid
    const nbto = tree.concat(['lists', 1], ['a']); // invalid
    tree.apply('palette', p => ({...p, name: p.name + 'wow'}));
    tree.merge('palette', {name: 'newname'});
    tree.deepMerge({somewhat: {nested: {objects: 'really are'}}});
    const complexCursor = tree.select('lists', 2, {key: 'obj1'}, 'val');

    tree.on('update', e => {
        const rjks = e.type;
        const wxhj = e.target;
        const vvst = e.data;
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
        const v1 = e.type;
        const v2 = e.target;
        const v3 = e.data;
    });
    numbersList.splice([1, 1, 100]);
    tree.select('numberIn', 'here').apply(x => x + 1);
    tree.select('numberIn').apply('here', x => x + 1);
    const zsxb = tree.select('palette', 'colors');
    const rfmy = tree.select('palette');
    const hzbk = tree.select('palette', 'colors');
    const ayco = tree.select('palette', 'colors', 2);
    const xbzu = tree.set('hello', 'monde');
    const opoc = tree.select('palette', 'colors', function(color) {
        return color === 'green';
    });

    const fyjb = tree.get('palette', 'colors', function(color) {
        return color === 'green';
    });

    const stou = tree.set({hello: 'bonjour', palette: {colors: ['green', 'red'], name: 'lame colors', invalidKey: 'should error'}});
    const hecg = tree.unset('hello');
    const vtyy = tree.project({
        name: ['one', 'name'],
        surname: ['two', 'surname']
    });
    const qssn = tree.set(initialState);
    const gzlk = tree.project([
        ['hello'],
        ['lists']
    ]);
    const dscz = hzbk.root();
    // tree.debugType

    const arqw = new SBaobab({
        list: [[1, 2], [3, 4]],
        longList: ['one', 'two', 'three', 'four']
    });

    const krfq = arqw.select('list'),
        ipfw = arqw.select('longList', 1);

    krfq.down().right().get();
    //   >>> [3, 4]

    krfq.select(1).down().right().get();
    //   >>> 4

    krfq.select(1).down().right().left().get();
    //   >>> 3

    ipfw.leftmost().get();
    //   >>> 'one'
    const rfdi = new SBaobab({list: [1, 2, 3]});

    rfdi.select('list').map(function(cursor, i) {
        const nbuv = cursor.get();
    });
    const atke = rfdi.select('list');
    atke.isRoot();
    atke.isBranch();
    atke.isLeaf();

    const dwuz = new SBaobab({x: 1, y: {z: 3}}, {
        validate: (_previousState, _newState, _affectedPaths) => {return undefined;}
    });

});