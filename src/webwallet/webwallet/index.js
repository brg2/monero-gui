const {a,br,button,circle,div,form,h1,iframe,img,input,link,meta,object,option,path,pre,script,select,span,svg,textarea} = H


const qricon = [
        path({d: "M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"}),
        path({d: "M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"}),
        path({d: "M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"}),
    ],
    qrscanicon = [
        path({d: "M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"})
    ].concat(qricon).concat([
        path({d: "M12 9h2V8h-2v1Z"})
    ])

function app(p, s) {

    setTimeout(() => {
        // Set the address field to a QR address scanned
        if (_address && $('#address').val() == '') {
            $('#address').val(_address);
        }
    })

    return [
        div.spacer(),
        div[s.retrying ? 'blur' : '']({id: "app"}, s.connected || isRecover ? [
            // Wallet
            div({id: "title"}, [
                img({id: "moneroLogo", src: "monero.svg"}),
                div({id: "moneroTitle"}, "Monero")
            ]),
            div['mb-2']['input-group']({}, [
                input['form-control']['form-control-lg']({id: "address", placeholder: "Address", value: ''}),
                button.btn['btn-outline-secondary']['x-clear']({title: "Clear address", onclick: clearAddress}, 
                    "×"
                ),
                button.btn['btn-outline-secondary']({title: "Scan QR Code", onclick: scanQR}, 
                    svg({width: 20, height: 20, viewBox: "0 0 16 16"}, qrscanicon)
                )
            ]),
            div['mb-2']['input-group']({}, [
                input['form-control']['form-control-lg']({id: "amount", placeholder: "Amount"}),
                button.btn['btn-outline-secondary']['x-clear']({title: "Clear amount", onclick: clearAmount}, 
                    "×"
                ),
                button.btn['btn-outline-secondary']({id: "amountButton", title: "Use full balance" + (s.balance ? ` (${formatter.format(s.balance)} XMR)` : ''), onclick: useBalance}, "∞")
            ]),
            s.reqPassword ? div['mb-2']['w-100']({id: "password-container"}, [
                input['form-control']['form-control-lg']({id: "password", type: "password", placeholder: "Password"})
            ]) : null,
            div['mb-2']['w-100']['d-flex']['justify-content-between']({}, [
                button.btn['btn-secondary']({title: "Reset inputs", onclick: clearInputs}, "Reset"),
                button.btn['btn-secondary']({id: "toggleSelfQRButton", title: "Show/hide self address", style: {fill: "white"},
                    ondblclick: showSelfQR, onmousedown: showSelfQR, onmouseup: hideSelfQR, ontouchstart: showSelfQR, ontouchend: hideSelfQR},
                    svg({width: 20, height: 20, viewBox: "0 0 16 16"}, qricon)
                ),
                button.btn[s.retrying ? 'btn-danger' : 'btn-primary-xmr']({id: "sendButton", title: "Send XMR" + (s.retrying ? ' (Connecting...)' : ''), onclick: postAPIInputs}, "Send"),
            ]),
            div[s.showSelfQR ? '' : 'blur']({id: 'qrcode', onclick: () => selectSelfAddress('selfaddress'), innerHTML: qrcode})
        ] : [
            // Pairing
            div({id: "pairingTitle"}, "Enter Pairing Code"),
            div['input-group']({id: "pairingFields"},
                Array.from({length: pcLength}, (n, i) => 
                    input['form-control']['form-control-lg']['pairing-input']({
                        id: `pcInput${i+1}`,
                        maxlength: 1,
                        onpaste: (e) => pcInputPaste(e, i),
                        oninput: (e) => pcInputText(e),
                        value: ''
                    })
                ).concat([
                    button.btn['btn-outline-secondary']({onclick: clearPairingCode}, "×")
                ])
            ),
            div({id: 'pairingEntryPad'},
                'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split('').map(l => 
                    div.noselect['pairing-input-pad']({
                        onclick: () => pcInputEnter(l)
                    }, l)
                )
            )
        ]),
        div.spacer(),
        s.retrying ? div({id: "disconnected", title: `Trying to reconnect to ${walletName}...`}, "disconnected...") : null
    ]
}

R(
    H(app),
    document.body
)

init();
