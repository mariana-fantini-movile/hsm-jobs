const FileUtils = require('./file-utils');
const HsmValidator = require('./hsm-validator');

const path_to_results = 'sync-database-facebook/results';

module.exports = {
    
    // Check if HSMs are invalid - can't even compare to fb
    validate_garuda_hsms: async function(hsm_list) {
        const valid = [];
        const invalid = [];
        hsm_list.forEach((hsm) => {
            if (HsmValidator.hsm_is_valid(hsm)) {
                valid.push(hsm);
            } else {
                invalid.push(hsm);
                FileUtils.add_hsm_to_be_deleted(hsm);
            }
        });
        console.log('Amount of valid HSMs: ', valid.length);
        console.log('Amount of invalid HSMs: ', invalid.length);
        return [valid, invalid];
    },

    check_found_hsms: function(fb_hsm_list, garuda_hsm_list) {
        console.log('FB HSM list: ' + fb_hsm_list.length);
        console.log('Garuda HSM list: ' + garuda_hsm_list.length);

        const exists_fb_not_garuda = [];
        const exists_garuda_not_fb = [];
        const diff_hsm = [];
        const equal_hsm = [];

        fb_hsm_list.map((fb_hsm) => {
            const hsm_found = garuda_hsm_list.find((garuda_hsm) => HsmValidator.hsm_is_same(garuda_hsm, fb_hsm));
            
            // check if found hsm on garuda list
            if (hsm_found == null) {
                exists_fb_not_garuda.push(fb_hsm);
                FileUtils.add_hsm_to_be_created(fb_hsm);
            } else {
                // check if hsms are equal or needs update
                if (!HsmValidator.hsm_is_equal(hsm_found, fb_hsm)) {
                    // if different
                    diff_hsm.push({ facebook: fb_hsm, garuda: hsm_found});
                } else {
                    // if equal
                    equal_hsm.push({ facebook: fb_hsm, garuda: hsm_found});
                }
            }
        });

        garuda_hsm_list.map((garuda_hsm) => {
            const hsm_found = fb_hsm_list.find((fb_hsm) => HsmValidator.hsm_is_same(garuda_hsm, fb_hsm));
            if (hsm_found == null) {
                exists_garuda_not_fb.push(garuda_hsm);
                FileUtils.add_hsm_to_be_analysed(garuda_hsm);
            }
        });

        console.log('Found ' + exists_fb_not_garuda.length + ' items on FB and NOT GARUDA');
        console.log('Found ' + exists_garuda_not_fb.length + ' items on GARUDA and NOT FB');
        console.log('Found ' + diff_hsm.length + ' items on DIFF HSMS');
        console.log('Found ' + equal_hsm.length + ' EQUAL HSMS');

        FileUtils.write_to_file(exists_fb_not_garuda, `${path_to_results}/exists_fb_not_garuda.txt`);
        FileUtils.write_to_file(exists_garuda_not_fb, `${path_to_results}/exists_garuda_not_fb.txt`);
        FileUtils.write_to_file(diff_hsm, `${path_to_results}/diff_hsm.txt`);
        FileUtils.write_to_file(equal_hsm, `${path_to_results}/equal_hsm.txt`);

    },
};
