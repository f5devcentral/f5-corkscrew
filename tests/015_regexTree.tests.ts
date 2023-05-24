
'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { RegExTree } from '../src/regex'

// const cwd = process.cwd();
// const tmosConf = fs.readFileSync(path.join('tests', 'archive_generator', 'archive1', 'config', 'bigip.conf'))
// const rex = new RegExTree(tmosConf);  // instantiate regex tree

describe('Testing regex tree functions', function () {

  /**
   * 4.9.2023 - looking into moving the version detection functions to this rx tree and have the initialize function return the tree
   * 
   * examples; at instantiation, feed in config, it will return the right rx tree and have the version in it.
   */

  before(async () => {
    console.log('test file: ', __filename);
  })

  it(`common version output v13.1.2.4`, async function () {

    const config = '#TMSH-VERSION: 13.1.2.4\n\ntmos config object...\n'
    const rx = new RegExTree(config)
    assert.ok(typeof rx === 'object');
    assert.deepStrictEqual(
      rx.ltm.virtual.pool,
      /(?<!source-address-translation {\n\s+)    pool (.+?)\n/
    );

  })

  it(`future example output for v19.0.1.0`, async function () {

    const config = '#TMSH-VERSION: 19.0.1.0\n\ntmos config object...\n'
    const rx = new RegExTree(config)
    assert.ok(typeof rx === 'object');
    assert.deepStrictEqual(rx.ltm.virtual.pool, /new-pool-regex/);

  })

  it(`future example output for v9.2.1.34`, async function () {

    const config = '#TMSH-VERSION: 9.2.1.3\n\ntmos config object...\n'
    const rx = new RegExTree(config)
    assert.ok(typeof rx === 'object');
    // nothing changes here, just testing the brach got called

  })

});