/* eslint-disable @typescript-eslint/no-unused-vars */

'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { 
  deepGet, 
} from '../src/utils/objects'

const baseTmos = fs.readFileSync(path.join('artifacts', 'do_classes.conf'))

describe('Testing json object manipulation functions', function() {

    it(`deepMergeObj function: basic merge`, async function() {

        const finalObj = deepGet(obj1, obj2)
        assert.deepStrictEqual(expected, finalObj);
    })

});