/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

/**
 * This test suite is a mix of unit/integration tests
 * It starts with basic unit testing of components, then builds up into integration testing
 * higher level components
 */

// import path from "path"
// import fs from 'fs';
// import { TMP_DIR } from '../src/constants'

require('./unPacker.tests')
require('./tmosParser.tests')
require('./pools.test')

require('./json_objects.test')

require('./devCloud_config.tests')
require('./devCloud_ucs.tests')

