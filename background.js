"use strict";

const SERVER = "https://airdrop.aspark.space";
// const SERVER = "http://localhost:58089";

const fetchOptions = {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
    mode: "same-origin",
}

const registrationStartUrl = SERVER + "/api/diyRegister/start", registrationFinishUrl = SERVER + "/api/diyRegister/finish";

// todo: addListener is deprecated, find alternative
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // if (request.message === 'credential_created') {
    //
    //     console.log("message received from background script: ", request.message, request.credential);
    //
    //     // Send a response to popup
    //     sendResponse({message: 'received'});
    //     return true;
    // }

    // credential_reg_start event listener
    if (request.message === 'credential_reg_start') {
        fetch(registrationStartUrl, {...fetchOptions, body: JSON.stringify({username: request.username})})
            .then(response => {
                response.json().then( response => {
                    console.log("registrationStartUrl_response: ", response);

                    let s = response.publicKeyCredentialCreationOptions;

                    if (response.status !== 'OK') {
                        throw new Error(response.message);
                    }

                    // for userhandle@fido2
                    s.user.id = "DEMO//9fX19ERU1P";

                    // Send a response to popup script
                    sendResponse({message: 'credential_reg_start_received', data: {
                            registrationId: response.registrationId,
                            publicKeyCredentialCreationOptions: JSON.stringify(s)}}
                    );
                }).catch(error => {
                    console.error("registrationStartUrl_error: ", error);
                    sendResponse({message: 'credential_reg_start_error', data: null});
                })
            })
            .catch(error => {
                console.error("registrationStartUrl_error: ", error);
                sendResponse({message: 'credential_reg_start_error', data: null});
            })

        return true;
    }

    if (request.message === 'credential_reg_finish') {
        fetch(registrationFinishUrl, {...fetchOptions, body: JSON.stringify(request.data)})
            .then(response => {
                response.json().then( response => {
                    console.log("registrationFinishUrl_response: ", response);
                    sendResponse({message: 'credential_reg_finish_received', data: response});
                    // here you can get recoveryToken from the response
                }).catch(error => {
                    console.error("registrationFinishUrl_error: ", error);
                })
            })
            .catch(error => {
                console.error("registrationFinishUrl_error: ", error);
            })
        return true;
    }
});
