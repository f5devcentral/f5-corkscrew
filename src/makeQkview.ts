#!/usr/bin/env node

'use strict';

// @ts-ignore
import { archiveMake } from '../tests/archive_generator/archiveBuilder'

archiveMake('qkview')
    .then(testFile => {
        console.log(testFile)
    });
