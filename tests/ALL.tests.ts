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


require('./json_objects.test')

require('./unPacker.tests')

// require('./tmosParser.tests')    // development only, not in use

require('./pools.test')


require('./conf_file.tests')
require('./ucs.tests')

// require('./outside_files.tests')
