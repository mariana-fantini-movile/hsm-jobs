const _ = require('lodash');

const FileUtils = require('./file-utils');

const FIELDS_TO_COMPARE = ['default_text', 'message_type'];

module.exports = {

    compare_content: function(garuda_hsm, fb_hsm, field) {
        if (FileUtils.plain_string(fb_hsm[field]) !== FileUtils.plain_string(garuda_hsm[field])) {
            FileUtils.add_hsm_to_be_updated(garuda_hsm, fb_hsm, field);
            return false;
        }
        return true;
    },

    hsm_is_valid: function(hsm) {
        return hsm && hsm.namespace && hsm.element_name && hsm.languages && hsm.languages.length > 0;
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

    hsm_is_equal: function(garuda_hsm, fb_hsm) {
        const is_equal = FIELDS_TO_COMPARE.reduce((acc, field) => {
            const comparison_response = this.compare_content(garuda_hsm, fb_hsm, field);
            return acc && comparison_response;
        }, true);

        return is_equal;
    }
}