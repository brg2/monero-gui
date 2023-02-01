
const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 12,
})

let encrypted = window.location.hash.split('#')[1].substring(1),
    isRecover = encrypted.slice(0,1) == '?',
    context = isRecover ? JSON.parse(CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encrypted.split('?')[1]))) : '',
    _ps,
    _k,
    _iv,
    _ivps,
    _p,
    options = {
        mode: CryptoJS.mode.CBC,
        iv: _ivps,
        padding: CryptoJS.pad.Pkcs7
    },
    _jps,
    _jk,
    _address = isRecover && context.address ? context.address : "",
    skippedParams = false,
    pingTimeout,
    reqPassword,
    connected = false,
    selfaddress = "",
    blackTheme = isRecover ? null : window.location.hash.substring(1,2) == "1",
    currentStatus,
    balance,
    retrying = false,
    pcLength = 6,
    qrcode = '',
    walletName = '',
    paused = false

function init() {
    syncBlackTheme()

    if(!isRecover)
        return clearPairingCode()
    _ps = context.ps
    _k = CryptoJS.enc.Hex.parse(context.k)
    _iv = CryptoJS.enc.Hex.parse(context.iv)
    _ivps = CryptoJS.MD5(CryptoJS.enc.Utf8.parse(_iv.toString() + _ps))
    options.iv = _ivps
    _p = window.location.origin + (isRecover ? ('/' + context.p) : window.location.pathname)
    _jps = isRecover ? context.ps : CryptoJS.AES.decrypt(encrypted, _k, options).toString(CryptoJS.enc.Utf8)
    _jk = isRecover ? context.k : CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_jps))

    if(_ps == '' || _jk.toString() != _k.toString()) {
        alert("Incorrect pairing code. Please try again.")
        clearPairingCode()
    } else {
        postAPI()
    }
}

function processPairCode() {
    function fail() {
        alert("Incorrect pairing code. Please try again.")
        clearPairingCode()
    }
    try {
        _ps = getPCInput()
        _k = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_ps)),
        _iv = CryptoJS.MD5(CryptoJS.enc.Utf8.parse(_ps)),
        _ivps = CryptoJS.MD5(CryptoJS.enc.Utf8.parse(_iv.toString() + _ps))
        options.iv = _ivps
        _jps = CryptoJS.AES.decrypt(encrypted, _k, options).toString(CryptoJS.enc.Utf8),
        _jk = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_jps))
        _p = window.location.origin + window.location.pathname

        if(_ps == '' || _jk.toString() != _k.toString()) {
            fail()
        } else {
            postAPI()
        }
    } catch(e) {
        fail()
    }
}

function postAPI(payload) {
    var jsonSend = {k: _k.toString()}
    if (payload) {
        jsonSend.payload = payload;
    }
    var _ejson = CryptoJS.AES.encrypt(JSON.stringify(jsonSend), _k, options).toString()

    // Clear any calls of this method to avoid duplicates
    if(pingTimeout) 
        pingTimeout = clearTimeout(pingTimeout)

    if(paused)
        return pingTimeout = setTimeout(postAPI, 3000)

    $.ajax({
        url: _p,
        method: "POST",
        data: _ejson,
        success: function( crypResponse ) {
            if (!crypResponse) {
                return errHandler();
            }
            let jsonResponse = JSON.parse(CryptoJS.AES.decrypt(crypResponse, _k, options).toString(CryptoJS.enc.Utf8))
            if (!jsonResponse['k'] || !jsonResponse['iv'] || !jsonResponse['p'])
                return errHandler();

            // Connection success
            _k = CryptoJS.enc.Hex.parse(jsonResponse.k)
            _iv = CryptoJS.enc.Hex.parse(jsonResponse.iv)
            _ivps = CryptoJS.MD5(CryptoJS.enc.Utf8.parse(jsonResponse.iv + _ps))
            _p = window.location.origin + '/' + jsonResponse.p

            let newReqPassword = jsonResponse.rp == "1"
            if (newReqPassword != reqPassword) {
                reqPassword = newReqPassword
                app.data.reqPassword = reqPassword
            }

            blackTheme = jsonResponse.bt == "1"

            let newbalance = jsonResponse.bal / 1000000000000
            if (newbalance != balance) {
                balance = newbalance
                app.data.balance = balance
            }

            // Show qr code of self address
            if (jsonResponse.self && selfaddress != jsonResponse.self || !connected) {
                selfaddress = jsonResponse.self
                qrcode = new QRCode({content: selfaddress, width: 320, height: 320, padding: 3}).svg()
                if (jsonResponse.name) {
                    walletName = jsonResponse.name
                    document.title = walletName + " (" + selfaddress.slice(0, 4) + "..." + selfaddress.slice(-4) + ")"
                }
            }

            syncBlackTheme()

            options.iv = _ivps

            jsonResponse.ps = _ps

            // Only save required parameters in recovery
            strRecoverHash = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify({
                iv: jsonResponse.iv,
                k: jsonResponse.k,
                p: jsonResponse.p,
                ps: jsonResponse.ps
            })))

            // Save current context in hash if user reloads (not sent over network and changes every ~3 seconds)
            window.location.replace( '#?' + strRecoverHash);

            if(!connected) {
                connected = true;
                retrying = false;
                app.data.connected = true;
                app.data.retrying = false;
            }

            pingTimeout = setTimeout(postAPI, 3000)
        },
        error: errHandler,
        complete() {
            setTimeout(() => {
                if(!$('body').hasClass('loaded'))
                    $('body').addClass('loaded')
            }, 10)
        }
    })
}

function errHandler(e) {
    // alert("Error: Connection failed");
    console.error('Web wallet: Connection failure', e)

    if(pingTimeout)
        pingTimeout = clearTimeout(pingTimeout)

    if(!connected && !retrying) {
        alert('A connection has already been used for this URL and pairing code. To start a new web wallet session, click "Refresh" in the web wallet interface settings and try again.')
        window.close();
        return;
    } else {
        if(!retrying) {
            retrying = true;
            app.data.retrying = true;
            document.title = `${walletName} (Disconnected)`
        }
        pingTimeout = setTimeout(postAPI, 3000)
    }

    if(connected) {
        app.data.connected = connected = false
    }
}

function postAPIInputs() {
    let address = $("#address").val()
    let amount = $("#amount").val()
    if(!address)
        return alert("Please enter an address")
    if(!amount)
        return alert("Please enter an amount")
    if(reqPassword && !$("#password"))
        return alert("Please enter a password")
    if(!confirm("Sending " + formatter.format(amount) + " XMR to " + address + ".\n\nContinue?"))
        return
    postAPI({
        address: $("#address").val(),
        amount: $("#amount").val(),
        password: $("#password").val()
    })
}

function clearInputs() {
    $("#address").val("");
    $("#amount").val("");
    $("#password").val("");
}

function clearAddress() {
    $("#address").val("");
}

function clearAmount() {
    $("#amount").val("");
}

function scanQR() {
    window.location = "https://brg2.github.io/qrscan#" + encodeURIComponent(window.location.href);
}

function selectSelfAddress(elId) {
    if (selfaddress)
        prompt("", selfaddress)
}

function useBalance() {
    if(balance && !isNaN(balance))
        $('#amount').val(balance)
}

function showSelfQR() {
    app.data.showSelfQR = true
}

function hideSelfQR() {
    app.data.showSelfQR = false
}

function pcInputEnter(character) {
    if(!character) return
    let pcInputNum = getEmptyPCInput()
    if(!pcInputNum) return
    $('#pcInput' + pcInputNum).val(character)
    if(pcInputNum == 6)
        setTimeout(processPairCode)
}

function clearPairingCode() {
    for(let i = 1; i < 7; i++) {
        $('#pcInput' + i).val('')
    }
    setTimeout(gotoNextPCInput)
}

function getEmptyPCInput() {
    let lastNum 
    for(let i = 6; i > 0; i--) {
        if($('#pcInput' + i).val() == '')
            lastNum = i;
        else if(lastNum)
            return lastNum
    }
    return lastNum
}

function getPCInput() {
    var pc = ''
    for(let i = 1; i < 7; i++) {
        pc += $('#pcInput' + i).val()
    }
    return pc
}

function setPCInput(strText, offset = 0) {
    for(let i = 1 + (offset); i < 7; i++) {
        $('#pcInput' + i).val(strText.slice(i - 1, i))
    }
}

function pcInputPaste(e, offset) {
    var pasteText = e.clipboardData.getData('text')
    setPCInput(pasteText, offset)
    e.currentTarget.blur()
    if(getPCInput().length == pcLength)
        setTimeout(processPairCode)
}

function pcInputText(e) {
    const inputEl = e.currentTarget
    inputEl.value = inputEl.value.toUpperCase()
    if(inputEl.value != '')
        setTimeout(gotoNextPCInput)
}

function gotoNextPCInput() {
    if(getEmptyPCInput())
        $('#pcInput' + getEmptyPCInput()).focus()
    else
        if(getPCInput().length == pcLength)
            setTimeout(processPairCode)
}

function pauseConnection(s) {
    paused = s.paused = !s.paused
    if(!paused) {
        postAPI()
    }
}

function syncBlackTheme() {
    if(blackTheme)
        $(document.body).addClass('dark')
    else
        $(document.body).removeClass('dark')
}
