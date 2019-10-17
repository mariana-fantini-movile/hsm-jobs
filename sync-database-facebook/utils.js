const fs = require('fs');
const util = require('util');
const _ = require('lodash');

const FileUtils = require('./file-utils');
const HsmValidator = require('./hsm-validator')

const FIELDS_TO_COMPARE = ['default_text', 'message_type'];

module.exports = {
    
    // Check if HSMs are invalid - can't even compare to fb
    validate_garuda_hsms: async function(hsm_list) {
        console.log('Validating Garuda HSMs - total: ' + hsm_list.length);
        const valid = [];
        const invalid = [];
        hsm_list.forEach((hsm) => {
            if (this.hsm_is_valid(hsm)) {
                valid.push(hsm);
            } else {
                invalid.push(hsm);
                FileUtils.add_hsm_to_be_deleted(hsm);
            }
        });
        console.log('--- valid: ', valid.length);
        console.log('--- invalid: ', invalid.length);
        return [valid, invalid];
    },

    hsm_is_valid: function(hsm) {
        return hsm && hsm.namespace&& hsm.element_name && hsm.languages && hsm.languages.length > 0;
    },

    hsm_is_same: function(garuda_hsm, fb_hsm) {
        try {
            if (
                fb_hsm.namespace.trim() === garuda_hsm.namespace.trim()
                && fb_hsm.element_name.trim() === garuda_hsm.element_name.trim()
                && _.isEqual(garuda_hsm.languages.sort(), fb_hsm.languages.sort())
            ) {
                return true;
            }
            return false;
        } catch (err) {
            console.log(err);
            return false;
        }
    },

    plain_string: function(string) {
        return string.trim().replace(/\s+/g, " ");
    },

    hsm_is_equal: function(garuda_hsm, fb_hsm) {
        const is_equal = FIELDS_TO_COMPARE.reduce((acc, field) => {
            const comparison_response = HsmValidator.compare_content(garuda_hsm, fb_hsm, field);
            return acc && comparison_response;
        }, true);

        return is_equal;
    },

    check_found_hsms: function(fb_hsm_list, garuda_hsm_list) {

        // debugger

        console.log('fb_hsm_list: ' + fb_hsm_list.length);
        console.log('garuda_hsm_list: ' + garuda_hsm_list.length);

        const exists_fb_not_garuda = [];
        const exists_garuda_not_fb = [];
        const diff_hsm = [];
        const equal_hsm = [];

        fb_hsm_list.map((fb_hsm) => {
            const hsm_found = garuda_hsm_list.find((garuda_hsm) => this.hsm_is_same(garuda_hsm, fb_hsm));
            
            // check if found hsm on garuda list
            if (hsm_found == null) {
                exists_fb_not_garuda.push(fb_hsm);
                FileUtils.add_hsm_to_be_created(fb_hsm);
            } else {
                // check if hsms are equal or needs update
                if ( !  this.hsm_is_equal(hsm_found, fb_hsm)) {
                    // if different
                    diff_hsm.push({ facebook: fb_hsm, garuda: hsm_found});
                } else {
                    // if equal
                    equal_hsm.push({ facebook: fb_hsm, garuda: hsm_found});
                }
            }
        });

        garuda_hsm_list.map((garuda_hsm) => {
            const hsm_found = fb_hsm_list.find((fb_hsm) => this.hsm_is_same(garuda_hsm, fb_hsm));
            if (hsm_found == null) {
                exists_garuda_not_fb.push(garuda_hsm);
                FileUtils.add_hsm_to_be_deleted(garuda_hsm);
            }
        });

        console.log('Found ' + exists_fb_not_garuda.length + ' items on FB and NOT GARUDA');
        console.log('Found ' + exists_garuda_not_fb.length + ' items on GARUDA and NOT FB');
        console.log('Found ' + diff_hsm.length + ' items on DIFF HSMS');
        console.log('Found ' + equal_hsm.length + ' EQUAL HSMS');

        FileUtils.write_to_file(exists_fb_not_garuda, "results/exists_fb_not_garuda.txt");
        FileUtils.write_to_file(exists_garuda_not_fb, "results/exists_garuda_not_fb.txt");
        FileUtils.write_to_file(diff_hsm, "results/diff_hsm.txt");
        FileUtils.write_to_file(equal_hsm, "results/equal_hsm.txt");
        
    },
};
