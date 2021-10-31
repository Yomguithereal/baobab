import SBaobab from '../../src/sbaobab';
import {strict as assert} from 'assert';

describe('Types', function() {
    it('should have all the right types but this test doesn\'t actually test that', function() {
        assert.strictEqual(2 + 2, 4);
    });
    const name = 'Glorious colors';
    const tree = new SBaobab({
        palette: {
            colors: ['yellow', 'purple'],
            name: name
        }
    });
    assert.strictEqual(tree.get('palette', 'name'), name);
    // tree.debugType
});