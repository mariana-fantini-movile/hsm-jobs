const _ = require('lodash');
const RP = require('request-promise');
const GRAPH = require('fbgraph');
const async = require("async");

const FB_ACCESS_TOKEN = {
    movile_brasil: '${polling.fb.access.token.movile_brasil}',
    movile_mexico: '${polling.fb.access.token.movile_mexico}'
};
const FB_GRAPH_VERSION = '3.2';
const LIST_FB_HSM_ROUTE = '/message_templates';

const fb_hsm_status = {
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
}

const garuda_hsm_status = {
    APPROVED: 'approved',
    REJECTED: 'disapproved'
}

module.exports = {
    get_hsms_from_fb: async function (wabas_list) {
        const fb_response = await async.mapLimit(wabas_list, 10, async (waba_id, _) => await this.get_hsm_by_waba_id(waba_id));
        // const fb_response = await this.get_hsm_by_waba_id('1767536906631501');

        // flatten
        const fb_hsm_list = _.flatMap(fb_response, (resp) => resp.hsm_list).reduce((acc, hsm) => {
            return acc.concat(hsm);
        }, []);

        // Print waba id errors to see what to do about that
        const waba_id_errors = _.flatMap(fb_response, (resp) => resp.errors).reduce((acc, error) => {
            return acc.concat(error);
        }, []);
        // console.log('waba_id_errors', waba_id_errors);

        return fb_hsm_list;
    },

    get_hsm_by_waba_id: async function(waba_id) {
        let hasNext = true;
        let apiCall = waba_id.waba_id + LIST_FB_HSM_ROUTE + "?limit=100";
        const waba_id_errors = [];
        const hsmItems = [];
        const options = {
            timeout: 3000,
            pool: {maxSockets: Infinity},
            headers: {connection: "keep-alive"}
        };

        GRAPH.setOptions(options);
        GRAPH.setVersion(FB_GRAPH_VERSION);
        GRAPH.setAccessToken(FB_ACCESS_TOKEN[waba_id.account]);

        while (hasNext) {
            await new Promise(resolve => {
                GRAPH.get(apiCall, (error, response) => {
                    if (error) {
                        // console.log("Error while getting HSMs for waba_id", waba_id.waba_id, ": ", error);
                        waba_id_errors.push({ waba_id: waba_id.waba_id, error: error });
                        hasNext = false;
                        resolve();
                        return;
                    }

                    response.data.forEach(async (item) => {
                        hsmItems.push(await this.fb_to_garuda_hsm(item, waba_id));
                    });

                    if (!response.paging.next) {
                        hasNext = false;
                    } else {
                        apiCall = response.paging.next;
                    }
                    resolve();
                });
            });
        }

        return { hsm_list: hsmItems, errors: waba_id_errors};
    },

    // Convert HSM to Garuda field names:
    fb_to_garuda_hsm: async function(fb_hsm, waba_id) {
        if (fb_hsm.header) {
            debugger;
        }
        return {
            element_name: fb_hsm.name,
            default_text: fb_hsm.content,
            languages: [ fb_hsm.language ],
            status: garuda_hsm_status[fb_hsm_status[fb_hsm.status]],
            message_type: fb_hsm.category,
            id: fb_hsm.id,
            namespace: waba_id.namespace
        };
    }
};