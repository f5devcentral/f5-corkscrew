/* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-empty-function */

'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { poolsInPolicy, poolsInRule } from '../pools';
import { digDataGroupsiniRule } from '../digiRules';


const iRuleWithPools = fs.readFileSync(path.join(__dirname, 'artifacts', 'pools.irule'), "utf-8");
const iRuleNoRef = fs.readFileSync(path.join(__dirname, 'artifacts', 'pools_noRef.irule'), "utf-8");
const iRuleDataGroups = fs.readFileSync(path.join(__dirname, 'artifacts', 'data-groups.irule'), "utf-8");

describe('pool reference tests', function () {

    // it(`get virtuals from iRule`, async function() {
    //     //todo:
    // });

    // it(`get virtuals from iRule - no virtuals`, async function() {
    //     //todo:
    // });

    // it(`get nodes from iRule`, async function() {
    //     //todo:
    // });

    // it(`get nodes from iRule - no nodes`, async function() {
    //     //todo:
    // });


    it(`get data-groups from iRule`, async function () {

        const internalDataGroups = [
            '/Common/____appsvcs_declaration-1601897418975',
            '/Common/____appsvcs_declaration-1601900242421',
            '/Common/____appsvcs_declaration-1601900272772',
            '/Common/____appsvcs_declaration-1602008840967',
            '/Common/__appsvcs_update',
            '/Common/appsvcs/dataStore',
            '/Common/atgTeem/datastore',
            '/Common/f5-appsvcs-templates/config',
            '/Common/f5-appsvcs-templates/dataStore'
        ];
        const knownDataGroups = ['/Common/one', '/Common/localusers_dg', '/Common/app_class', '/Common/two'];

        await digDataGroupsiniRule(iRuleDataGroups, [...internalDataGroups, ...knownDataGroups])
            .then(dgs => {
                assert.deepStrictEqual(dgs, ['/Common/localusers_dg', '/Common/app_class'])
            })
            .catch(err => {
                debugger;
            });

    });


    it(`get pools from irule`, async function () {

        const pools = poolsInRule(iRuleWithPools);

        const expected = [["css_pool"], ["jpg.pool", "member", "10.10.10.1", "80"], ["js.io_t80_pool"], ["missing_pool"]];

        assert.deepStrictEqual(pools, expected);
    });

    it(`get pools from irule - no pools`, async function () {

        const pools = poolsInRule(iRuleNoRef);
        assert.deepStrictEqual(pools, undefined);
    });

    it(`get pools from irule with validation`, async function () {

        const existingPools = ['css_pool', 'js.io_t80_pool', 'jpg.pool', 'web1Pool'] // "missing_pool" is not defined in config

        const pools = poolsInRule(iRuleWithPools, existingPools);

        const expected = [["css_pool"], ["jpg.pool", "member", "10.10.10.1", "80"], ["js.io_t80_pool"]];

        assert.deepStrictEqual(pools, expected);
    });

    it(`get pools from Local Traffic Policy (LTP)`, async function () {

        const LTPwithPools = fs.readFileSync(path.join(__dirname, "./artifacts/pools_LTP.tcl"), "utf-8");

        const pools = poolsInPolicy(LTPwithPools);

        const expected = ["css_pool", "jpg.pool", "js.io_t80_pool"];

        assert.deepStrictEqual(pools, expected);
    });


});
