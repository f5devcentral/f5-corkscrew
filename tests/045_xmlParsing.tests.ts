
'use strict';

import assert from 'assert';
import fs from 'fs'
import path from 'path';

import BigipConfig from '../src/ltm';
import { archiveMake } from './archive_generator/archiveBuilder';
import { Explosion, GslbApp } from '../src/models';
import { XMLParser } from 'fast-xml-parser';


let device: BigipConfig;
let expld: Explosion;
const parsedFileEvents: any[] = [];
const parsedObjEvents: any[] = [];
let testFile = '';
let asmObj: any;


const xmlFilePath = path.join(__dirname, 'archive_generator', 'archive1', 'stat_slim.xml');
// tests/archive_generator/archive1/mcp_module.xml
const xmlData = fs.readFileSync(xmlFilePath).toString();


describe('XML stats parsing/abstraction', async function () {

    before(async () => {

        console.log('test file: ', __filename);

    })

    it(`diggn them xml deets`, async function () {



        const options = {
            ignoreAttributes: false,
            // attributeValueProcessor: (name, val, jPath) => {
            //     const a = name;
            // },
            updateTag: (tagName, jPath, attrs) => {
                // attrs["At"] = "Home";
                if(tagName === 'object' && attrs['@_name']) {
                    return tagName = attrs['@_name'];
                };
            }
        };
        const xmlParser = new XMLParser(options);
        const xJson = xmlParser.parse(xmlData)
        if(xJson) {
            
        }

    });

});

