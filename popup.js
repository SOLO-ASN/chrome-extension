
document.getElementById('sign-message-btn').addEventListener('click', () => {
    getCredentials()
        .then(result => {
            alert("get >>>>>>>>>>>>>>> ", result.rawId);
        })
        .catch(error => {
            alert("get error: ", error);
        })

})

function getCredentials() {
    return navigator.credentials.get({})
}


const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";

document.getElementById('create-creds-btn').addEventListener('click', () => {
    // here is where you would create the credential
    createCredentials()
        .then((result) => {
            console.log('Credential Created', result);

            // encode
            const encodedCredential = encodeCredential(
                result.credential.rawId,
                result.credential.authenticatorAttachment,
                result.credential.type,
                result.credential.response);

            // alert(encodedCredential.rawId);

            // packdata
            const regFinishData = packRegFinishData(result.regId, encodedCredential, userAgent);

            // Send details about the created credential to the background script
            chrome.runtime.sendMessage(
                { message: 'credential_reg_finish', data: regFinishData },
                response => {
                    if(response.message === 'credential_reg_finish_received') {
                        alert('Credential created and message received by background script.');
                    } else {
                        alert('Failed to send message to background script.');
                    }
                });
        })
        .catch((error) => {
            console.error("DOMException name: ", error.name);
            console.error("DOMException message: ", error.message);
            // console.error('Failed to create credential', error);
            if (error instanceof DOMException) {
                // 输出错误名和消息
                console.error("DOMException name: ", error.name);
                console.error("DOMException message: ", error.message);
            }
        });
});

function packRegFinishData(regId, credential, userAgent) {
    return {
        registrationId: regId,
        credential: credential,
        userAgent: userAgent
    }
}

function encodeCredential(rawId, authenticatorAttachment, type, response) {
    const id = btoa(String.fromCharCode.apply(null, new Uint8Array(rawId)));

    // const clientDataJSON =
    //     btoa(String.fromCharCode.apply(null, new Uint8Array(response.clientDataJSON)));
    // const attestationObject =
    //     btoa(String.fromCharCode.apply(null, new Uint8Array(response.attestationObject)));

    return {
        id: _arrayBufferToBase64UrlString(rawId),
        rawId: _arrayBufferToBase64UrlString(rawId),
        authenticatorAttachment,
        type,
        clientExtensionResults: {},
        response: {
            clientDataJSON: _arrayBufferToBase64UrlString(response.clientDataJSON),
            attestationObject: _arrayBufferToBase64UrlString(response.attestationObject)
        }
    };
}

function _arrayBufferToBase64UrlString(e) {
    if (!e) return null;
    const t = [];
    for (const n of new Uint8Array(e)) t.push(String.fromCharCode(n));
    return btoa(t.join("")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

// async function getCreateOptions() {
//     const createOptions = {
//         publicKey: {
//             rp: {
//                 name: "Airdrop",
//             },
//             user: {
//                 name: "solo-mission",
//                 displayName: "solo-mission",
//                 id: "AAAAAAAAAfA"
//             },
//             challenge: "h6UOgLu-2jdq2q77LaYMrZ-1VPf0Sh1T1y5skbuvCYo",
//             pubKeyCredParams: [
//                 { alg: -7, type: "public-key" },
//                 { alg: -8, type: "public-key" },
//                 { alg: -257, type: "public-key"}
//             ],
//             excludeCredentials: [],
//             attestation: "none",
//             extensions: {}
//         }
//     };
//     let decoder = await this._getPublicKeyCredentialCreateOptionsDecoder();
//     return decoder(createOptions);
//     // return createOptions;
// }

function createCredentials(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {message: 'credential_reg_start', username: "solo-mission"},
            response => {
                if (response.message === 'credential_reg_start_received') {
                    let parsedCreateOptions = getCreateOptions(JSON.parse(response.data.publicKeyCredentialCreationOptions));
                    // alert(parsedCreateOptions.challenge);
                    navigator.credentials.create({publicKey: parsedCreateOptions})
                        .then(result => {
                            resolve({credential: result, regId: response.data.registrationId});
                        })
                        .catch(error => {
                            reject(error);
                        })
                } else {
                    alert('createCredentials() ===> Failed to send message to background script.>>>>>>>>>> ' + response.data.registrationId);
                    reject(error);
                }
            });
    })
}


function getCreateOptions(publicKeyCredentialCreationOptions) {
    alert(publicKeyCredentialCreationOptions.rp.id);
    return {
        rp: {
            name: publicKeyCredentialCreationOptions.rp.name,
            id: publicKeyCredentialCreationOptions.rp.id
        },
        pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: 'public-key', alg: -8 },
            { type: "public-key", alg: -257 }
        ],
        attestation: publicKeyCredentialCreationOptions.attestation,
        user: {
            name: publicKeyCredentialCreationOptions.user.name,
            displayName: publicKeyCredentialCreationOptions.user.displayName,
            id: _base64UrlStringToUint8Array(publicKeyCredentialCreationOptions.user.id)
        },
        challenge: _base64UrlStringToUint8Array(publicKeyCredentialCreationOptions.challenge),
    }
}

function _base64UrlStringToUint8Array(e) {
    if (!e) return null;
    const t = "==".slice(0, (4 - e.length % 4) % 4), n = e.replace(/-/g, "+").replace(/_/g, "/") + t,
      r = atob(n);
    return Uint8Array.from(r, (e => e.charCodeAt(0)))
}
