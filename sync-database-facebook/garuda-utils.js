const _ = require('lodash');
const RP = require('request-promise');

const GARUDA_HOST = 'https://garuda-prod.movile.com/api';

const AUTH_ROUTE = '/get_token';
const LIST_HSM_ROUTE = '/whatsapp_hsm';
const LIST_WABAS_ROUTE = '/whatsapp_waba_ids';

const EMAIL = '${polling.email}';
const PASSWORD = '${polling.password}';

module.exports = {
    auth_garuda: async function() {
        const TOKEN = await this.request_token();
        if (TOKEN === null) {
            console.log("Could not auth in Garuda.");
            process.exit(2);
        }
        console.log("Token acquired.");
        return TOKEN;
    },

    request_token: async function() {
        let auth_options = {
            method: 'POST',
            uri: GARUDA_HOST + AUTH_ROUTE,
            json: true,
            qs: {
                email: EMAIL,
                password: PASSWORD
            }
        };

        try {
            let auth_response = await RP(auth_options);
            return auth_response.authentication.token;
        } catch (err) {
            console.log('Error getting request token: ' + err);
            return null;
        }
    },

    get_hsm_list: async function(TOKEN) {
        const options = {
            methodhandler: 'GET',
            uri: GARUDA_HOST + LIST_HSM_ROUTE,
            headers: {
                Authorization: "Bearer " + TOKEN
            }
        };
        try {
            let response = await RP(options);
            response = JSON.parse(response);

            if (response.hsm_list) {
                console.log('Got ' + response.hsm_list.length + ' HSMs from Garuda');
                return response.hsm_list;
            }
            return null;

        } catch (err) {
            console.log('Error requesting Garuda HSMs: ' + err);
            return null;
        }
    },

    filter_hsm_by_waba: async function(garuda_hsm_list, wabas_list) {
        const namespace_list = wabas_list.map((waba) => waba.namespace);
        return garuda_hsm_list.filter((garuda_hsm) => namespace_list.indexOf(garuda_hsm.namespace) > -1);
    },

    request_waba_ids: async function(TOKEN) {
        let wabas_options = {
            method: 'GET',
            uri: GARUDA_HOST + LIST_WABAS_ROUTE,
            headers: {
                Authorization: "Bearer " + TOKEN
            }
        };

        try {
            let wabas_response = await RP(wabas_options);
            console.log('Got WABAs response.');
            return JSON.parse(wabas_response).waba_ids;
        } catch (err) {
            console.log('Error requesting WABA IDs: ' + err);
            process.exit(1);
        }
    }
};
