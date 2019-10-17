const fs = require('fs');
const util = require('util');

const HSM_TABLE = 'public.whatsapp_hsm';
const HSM_LANG_TABLE = 'public.whatsapp_hsm_languages';

const ANALYSE_FILENAME = 'sync-database-facebook/results/analyse-hsm.sql';
const CREATE_FILENAME = 'sync-database-facebook/results/create-hsm.sql';
const HSM_INFO = `HSM info:
            * namespace: '%s',
            * element_name: '%s',
            * default_text: '%s',
            * status: '%s',
            * message_type: '%s',
            * language: '%s'\n\n\n`;

const DELETE_FILENAME = 'sync-database-facebook/results/delete-hsm.sql';
const DELETE_HSM_QUERY = `
            -- Remember to BACKUP first
            DELETE FROM %s WHERE hsm_id = %s;
            DELETE FROM %s WHERE id = %s;\n\n`;

const UPDATE_FILENAME = 'sync-database-facebook/results/update-hsm.sql';
const UPDATE_HSM_QUERY = 'UPDATE %s SET %s = \'%s\' WHERE id = %s;\n';
const UNDO_UPDATE_HSM_QUERY = '-- to rollback, execute:\n-- UPDATE %s SET %s = \'%s\' WHERE id = %s;\n';

module.exports = {

    add_hsm_to_be_created(fb_hsm) {
        fs.appendFileSync(CREATE_FILENAME, util.format(HSM_INFO,
            fb_hsm.namespace, fb_hsm.element_name, this.escape_string(fb_hsm.default_text), fb_hsm.status,
            fb_hsm.message_type, fb_hsm.languages[0]));
    },

    add_hsm_to_be_deleted(hsm) {
        fs.appendFileSync(DELETE_FILENAME, util.format(DELETE_HSM_QUERY, HSM_LANG_TABLE, hsm.id, HSM_TABLE, hsm.id));
    },

    add_hsm_to_be_analysed(hsm) {
        fs.appendFileSync(ANALYSE_FILENAME, util.format(HSM_INFO,
            hsm.namespace, hsm.element_name, this.escape_string(hsm.default_text), hsm.status,
            hsm.message_type, hsm.languages[0]));
    },

    add_hsm_to_be_updated(garuda_hsm, fb_hsm, field) {
        fs.appendFileSync(UPDATE_FILENAME, util.format(UPDATE_HSM_QUERY, HSM_TABLE, field, this.escape_string(fb_hsm[field]), garuda_hsm.id));
        fs.appendFileSync(UPDATE_FILENAME, util.format(UNDO_UPDATE_HSM_QUERY, HSM_TABLE, field, this.escape_string(garuda_hsm[field]), garuda_hsm.id));
        fs.appendFileSync(UPDATE_FILENAME, '\n\n');
    },

    plain_string: function(string) {
        return string.trim().replace(/[\r\n]/g, '\\n').replace(/\s+/g, ' ');
    },

    escape_string: function(string) {
        return string.trim().replace(/[\r\n]/g, '\\n').replace(/\s+/g, ' ').split('\'').join('\'\'');
    },

    write_to_file: function(array, filename) {
        array.forEach((item) => {
            fs.appendFileSync(filename, JSON.stringify(item), (err) => {
                if (err) {
                    console.error('[write_to_file] Error: ', err);
                    throw err;
                }
                console.log('Saved data to file.');
            });
        });
    }
}