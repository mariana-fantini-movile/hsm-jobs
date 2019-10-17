const GarudaUtils = require('./garuda-utils');
const FacebookUtils = require('./facebook-utils');
const Utils = require('./utils');

// [OPTIONAL] should be used when script is executed for selected WABAS at a time
const WABA_DEFAULT_LIST = [{
    "waba_id": "1767536906631501",
    "namespace": "whatsapp:hsm:ecommerce:movile",
    "account": "movile_brasil"
}];

async function polling() {

    // FileUtils.delete_all_files();

    // 1) Get Garuda token and HSMs
    const TOKEN = await GarudaUtils.auth_garuda();
    const garuda_hsm_list = await GarudaUtils.get_hsm_list(TOKEN);

    // 2) Filter valid Garuda HSMs
    const [valid_garuda_hsm_list, invalid_garuda_hsm_list] = await Utils.validate_garuda_hsms(garuda_hsm_list);

    // [OPTIONAL] Filter garuda HSMs from selected WABAs
    const selected_garuda_hsm_list = await GarudaUtils.filter_hsm_by_waba(valid_garuda_hsm_list, WABA_DEFAULT_LIST);
    // const selected_garuda_hsm_list = valid_garuda_hsm_list;

    // For debug only
    // Trying to find invalid HSMs on facebook - to check if we can delete them from our dtb
    // await Utils.get_invalid_hsms_on_facebook(fb_hsm_list, invalid_garuda_hsm_list);

    // Get waba ids from Garuda
    // const wabas_list = await GarudaUtils.request_waba_ids(TOKEN);
    const wabas_list = WABA_DEFAULT_LIST;

    // 3) Get facebook HSMs
    const fb_hsm_list = await FacebookUtils.get_hsms_from_fb(wabas_list);

    // 4) Check format of both structures and find a way to compare them hahahah
    await Utils.check_found_hsms(fb_hsm_list, selected_garuda_hsm_list);

}

polling();
