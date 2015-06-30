/**
 * Baobab Public Interface
 * ========================
 *
 * Exposes the library's classes
 */
import Baobab from './src/baobab';
import Cursor from './src/cursor';

// Non-writable version
Object.defineProperty(Baobab, 'version', {
  value: '2.0.0-dev'
});

// Exposing Cursor class
Baobab.Cursor = Cursor;

// Exporting
export default Baobab;
