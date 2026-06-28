import * as assert from 'assert';
import { BACKUP_PREFIX, PATCH_MARKER } from '../constants';

suite('Cursor RTL Extension', () => {
    test('constants define patch marker', () => {
        assert.ok(PATCH_MARKER.includes('cursor-rtl-loader'));
        assert.ok(BACKUP_PREFIX.startsWith('main.js'));
    });

    test('patch marker is unique enough', () => {
        assert.notStrictEqual(PATCH_MARKER, 'rtl');
        assert.ok(PATCH_MARKER.length > 10);
    });
});
