/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.digDataGroupsiniRule = void 0;
function digDataGroupsiniRule(rule, dgNames) {
    return __awaiter(this, void 0, void 0, function* () {
        //
        return dgNames.filter(dg => {
            // turn data-group name into an rx
            const dgRx = new RegExp(dg);
            // does the irule contain the full dg name?
            if (dgRx.test(rule)) {
                // true => return the dg name
                return true;
            }
            else {
                // string the object name from the partition
                const shortDgName = dg.split('/').pop();
                // turn the short name into a rx
                const shortDgNameRx = new RegExp(shortDgName);
                // does the irule have the short name rx?
                if (shortDgNameRx.test(rule)) {
                    // true => return the dg name
                    return true;
                }
            }
        });
    });
}
exports.digDataGroupsiniRule = digDataGroupsiniRule;
//# sourceMappingURL=digiRules.js.map