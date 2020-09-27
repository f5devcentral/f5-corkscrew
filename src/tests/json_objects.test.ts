
'use strict';

import assert from 'assert';
import balanced from 'balanced-match';
// import { assert } from 'console';

import { deepMergeObj, setNestedKey, tmosChildToObj, getPathOfValue, deepGet, pathValueFromKey } from '../utils/objects'

import { simpleVSbody_asJson, simpleVStmosBody, vsApp3 } from './json_objects_data'


describe('Testing json object manipulation functions', function() {

    it(`deepMergeObj function: basic merge`, async function() {

        const obj1 = {
            ltm: {
                virtual: {
                    '/Common/app1_t80_vs': {
                        rules: ['rule1', 'rule2', 'rule3']
                    }
                }
            }
        };

        const obj2 = {
            ltm: {
                virtual: {
                    '/Common/app1_t443_vs': {
                        rules: ['rule1', 'rule2', 'rule3']
                    }
                }
            }
        };

        const obj3 = {
            ltm: {
                node: {
                    '/Common/10.10.10.1': {
                        address: '10.10.10.1'
                    }
                }
            }
        };

        const expected = {
            ltm: {
              virtual: {
                '/Common/app1_t80_vs': {
                  rules: [
                    'rule1',
                    'rule2',
                    'rule3',
                  ],
                },
                '/Common/app1_t443_vs': {
                  rules: [
                    'rule1',
                    'rule2',
                    'rule3',
                  ],
                },
              },
              node: {
                '/Common/10.10.10.1': {
                  address: '10.10.10.1',
                },
              },
            },
          }

        const finalObj = deepMergeObj([obj1, obj2, obj3])
        assert.deepStrictEqual(expected, finalObj);
    })

    it(`setNestedKey function: set nested key`, async function() {

        const obj1 = {
            ltm: {
              virtual: {
                '/Common/app1_t80_vs': 'destination /Common/192.168.1.21:80\n    ip-protocol tcp',
                '/Common/app1_t443_vs': 'destination /Common/192.168.1.21:443\n    ip-protocol tcp\n    source-address-translation {\n        pool /Common/app3_snat_pool\n        type snat\n    }\n'
              },
              node: {
                '/Common/10.10.10.1': {
                  address: '10.10.10.1',
                },
              },
            },
        };

        const newKeyObj = {
            'destination': '/Common/192.168.1.21:443',
            'ip-protocol': 'tcp',
            'source-address-translation': {
                'pool': '/Common/app3_snat_pool',
                'type': 'snat'
            }
        }

        const newKeyPath = ['ltm', 'virtual', '/Common/app1_t443_vs']

        // modified object by adding data, does not produce new output
        setNestedKey( obj1, newKeyPath, newKeyObj );

        const exptected = {
            ltm: {
              virtual: {
                '/Common/app1_t80_vs': 'destination /Common/192.168.1.21:80\n    ip-protocol tcp',
                '/Common/app1_t443_vs': {
                  destination: '/Common/192.168.1.21:443',
                  'ip-protocol': 'tcp',
                  'source-address-translation': {
                    pool: '/Common/app3_snat_pool',
                    type: 'snat',
                  },
                },
              },
              node: {
                '/Common/10.10.10.1': {
                  address: '10.10.10.1',
                },
              },
            },
          };

        assert.deepStrictEqual(exptected, obj1);
        
    });

    it(`getPathOfValue function: string search`, async function() {
        // outline

        const obj1 = {
            ltm: {
              virtual: {
                '/Common/app1_t80_vs': 'destination /Common/192.168.1.21:80\n    ip-protocol tcp',
                '/Common/app1_t443_vs': {
                  destination: '/Common/192.168.1.21:443',
                  'ip-protocol': 'tcp',
                  'source-address-translation': {
                    pool: '/Common/app3_snat_pool',
                    type: 'snat',
                  },
                },
              },
              node: {
                '/Common/10.10.10.1': {
                  address: '10.10.10.1',
                },
              },
            },
          };

        const pathToValue = getPathOfValue('snat', obj1)
        const exptected = ['ltm', 'virtual', '/Common/app1_t443_vs', 'source-address-translation', 'pool']

        assert.deepStrictEqual(exptected, pathToValue);
    });

    it(`getPathOfValue function: regex "\\n" search`, async function() {
        // outline

        const obj1 = {
            ltm: {
              virtual: {
                '/Common/app1_t80_vs': 'destination /Common/192.168.1.21:80\n    ip-protocol tcp',
                '/Common/app1_t443_vs': {
                  destination: '/Common/192.168.1.21:443',
                  'ip-protocol': 'tcp',
                  'source-address-translation': {
                    pool: '/Common/app3_snat_pool',
                    type: 'snat',
                  },
                },
              },
              node: {
                '/Common/10.10.10.1': {
                  address: '10.10.10.1',
                },
              },
            },
          };

        const pathToValue = getPathOfValue(/\n/, obj1)
        const exptected = ['ltm', 'virtual', '/Common/app1_t80_vs']

        assert.deepStrictEqual(exptected, pathToValue);
    });

    it(`deepGet function: tmos vs body`, async function() {

        const obj1 = {
            ltm: {
              virtual: {
                '/Common/app1_t80_vs': 'destination /Common/192.168.1.21:80\n    ip-protocol tcp',
                '/Common/app1_t443_vs': {
                  destination: '/Common/192.168.1.21:443',
                  'ip-protocol': 'tcp',
                  'source-address-translation': {
                    pool: '/Common/app3_snat_pool',
                    type: 'snat',
                  },
                },
              },
              node: {
                '/Common/10.10.10.1': {
                  address: '10.10.10.1',
                },
              },
            },
          };

          const value = deepGet(['ltm', 'virtual', '/Common/app1_t80_vs'], obj1)
          const exptected = 'destination /Common/192.168.1.21:80\n    ip-protocol tcp'
  
          assert.deepStrictEqual(exptected, value);
    });
    
    it(`deepGet function: json node address`, async function() {

        const obj1 = {
            ltm: {
              virtual: {
                '/Common/app1_t80_vs': 'destination /Common/192.168.1.21:80\n    ip-protocol tcp',
                '/Common/app1_t443_vs': {
                  destination: '/Common/192.168.1.21:443',
                  'ip-protocol': 'tcp',
                  'source-address-translation': {
                    pool: '/Common/app3_snat_pool',
                    type: 'snat',
                  },
                },
              },
              node: {
                '/Common/10.10.10.1': {
                  address: '10.10.10.1',
                },
              },
            },
          };

          const value = deepGet(['ltm', 'node', '/Common/10.10.10.1', 'address'], obj1)
          const exptected = '10.10.10.1'
  
          assert.deepStrictEqual(exptected, value);
    });

    it(`pathValueFromKey function: get tmos virtual body and path by vs name`, async function() {

        const obj = {
            ltm: {
              virtual: {
                '/Common/app1_t80_vs': 'destination /Common/192.168.1.21:80\n    ip-protocol tcp',
                '/Common/app1_t443_vs': {
                  destination: '/Common/192.168.1.21:443',
                  'ip-protocol': 'tcp',
                  'source-address-translation': {
                    pool: '/Common/app3_snat_pool',
                    type: 'snat',
                  },
                },
              },
              node: {
                '/Common/10.10.10.1': {
                  address: '10.10.10.1',
                },
              },
            },
          };

          const value = pathValueFromKey(obj, '/Common/app1_t80_vs')
        //   const expected = 'destination /Common/192.168.1.21:80\n    ip-protocol tcp'

          const expected = {
            path: "ltm.virtual",
            key: "/Common/app1_t80_vs",
            value: "destination /Common/192.168.1.21:80\n    ip-protocol tcp",
          };
  
          assert.deepStrictEqual(expected, value);
    });

});


describe('Testing tmos to json conversions', function() {

    it(`simple tmos vs text body to json - iterative`, async function() {
        // outline

        const value = tmosChildToObj(simpleVStmosBody)

        const exptected = simpleVSbody_asJson;
        
        assert.deepStrictEqual(exptected, value);
    });
});



// describe('testing balanced function', function() {

//     it(`using balanded to parse virtual`, async function() {

//         // const cfg = [testCfg, testCfg2, testCfg3];
//         // const newCfg: string[] = [];
//         // cfg.forEach(el => {
            
//         //     // const retrn = tmosChildToObj(el)
//         //     // newCfg.push(retrn);
//         //     const blncd = balanced('{', '}', el);
//         //     if(blncd) {
//         //         const name = blncd.pre;
//         //         const name2 = name.split(/\n/).pop().trim();
//         //         const body = blncd.body.trim();

//         //         const body2 = body.split(/\n/);
//         //         const xxx = '';
//         //     }
//         // });

//         // console.log (newCfg);
//     })
// });