
'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { RegExTree } from '../src/regex'

const cwd = process.cwd();
const tmosConf = fs.readFileSync(path.join('tests', 'archive_generator', 'archive1', 'config', 'bigip.conf'))
const rex = new RegExTree();  // instantiate regex tree

describe('Testing regex tree functions', function () {

  /**
   * 4.9.2023 - looking into moving the version detection functions to this rx tree and have the initialize function return the tree
   * 
   * examples; at instantiation, feed in config, it will return the right rx tree and have the version in it.
   */

  it(`common version output v13.1.2.4`, async function () {

    const rx = rex.get('13.1.2.4')
    assert.ok(typeof rx === 'object');
    assert.deepStrictEqual(
      rx.vs.pool.obj,
      /(?<!source-address-translation {\n\s+)    pool (.+?)\n/
    );

  })

  it(`future example output for v19.0.1.0`, async function () {

    const rx = rex.get('19.0.1.0')
    assert.ok(typeof rx === 'object');
    assert.deepStrictEqual(rx.vs.pool.obj, /new-pool-regex/);

  })

  it(`future example output for v9.2.1.34`, async function () {

    const rx = rex.get('9.2.1.3')
    assert.ok(typeof rx === 'object');
    // nothing changes here, just testing the brach got called

  })

});