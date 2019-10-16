const FileUtils = require('./file-utils');

module.exports = {

    compare_content: function(garuda_hsm, fb_hsm, field) {
        if (FileUtils.plain_string(fb_hsm[field]) !== FileUtils.plain_string(garuda_hsm[field])) {
            FileUtils.add_hsm_to_be_updated(garuda_hsm, fb_hsm, field);
            return false;
        }
        return true;
    }
}