/** Identical to Baobab but uses stricter / more informative types */

import Baobab from './baobab';
import Cursor from './cursor';

export class SBaobab extends Baobab {
    constructor(...args) {super(...args);}
}
export class SCursor extends Cursor {
    constructor(...args) {super(...args);}
}
