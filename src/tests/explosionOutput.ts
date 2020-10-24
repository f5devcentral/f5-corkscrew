import { BigipConfObj, Explosion } from '../models'

export function logOutput (configObject: BigipConfObj, explosion: Explosion): string {

    let output = '';
    output += '################################################\n';
    output += `###  *** project - corkscrew *** ###\n`;
    output += `###  tmos extractor output\n`;
    output += `###  Section 1: stats\n`;
    output += `###  Section 2: apps\n`;
    output += `###  Section 3: conversion logs (error/info/debug)\n`;
    output += `###  Section 4: configObjects (not object values yet)\n`;
    // output += `###  Section 5: configSingleLevelObjects (another way to search config)\n`;
    output += `###  ${new Date().toISOString()}\n`;
    output += '################################################\n';

    output += `\n################################################\n`;
    output += `### explosion stats ##########\n`;
    output += `### uuid: ${explosion.id}\n`;
    output += `### dateTime: ${explosion.dateTime}\n`;
    // output += `### dateTime: ${explode.}\n`;
    output += JSON.stringify(explosion.stats, undefined, 2);
    output += `\n################################################\n`;
    
    explosion.config.apps.forEach( el => {
        output += '\n################################################\n';
        output += `#### app name: ${el.name}\n`;
        output += `#### app map: `;
        output += JSON.stringify(el.map, undefined, 4);
        output += `\n####\n`;
        output += el.config;
        output += '\n################################################\n';
    })
    
    output += '\n\n';
    output += '#######################################\n';
    output += '### conversion log ####################\n';
    output += explosion.logs;
    
    output += '\n\n';
    output += '#######################################\n';
    output += '### configMultiLevelObjects ###########\n';
    output += JSON.stringify(configObject, undefined, 2);
    
    return output;
}