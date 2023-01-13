
const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 12,
})

let encrypted = window.location.hash.split('#')[1],
    isRecover = encrypted.substr(0,1) == '?',
    context = isRecover ? JSON.parse(CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encrypted.split('?')[1]))) : '',
    _ps = isRecover ? context.ps : prompt("Please enter the 6 character pairing code"),
    _k = isRecover ? CryptoJS.enc.Hex.parse(context.k) : CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_ps)),
    _iv = isRecover ? CryptoJS.enc.Hex.parse(context.iv) : CryptoJS.MD5(CryptoJS.enc.Utf8.parse(_ps)),
    _ivps = CryptoJS.MD5(CryptoJS.enc.Utf8.parse(_iv.toString() + _ps)),
    _p = window.location.origin + (isRecover ? ('/' + context.p) : window.location.pathname),
    options = {
        mode: CryptoJS.mode.CBC,
        iv: _ivps,
        padding: CryptoJS.pad.Pkcs7
    },
    _jps = isRecover ? context.ps : CryptoJS.AES.decrypt(encrypted, _k, options).toString(CryptoJS.enc.Utf8),
    _jk = isRecover ? context.k : CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_jps)),
    _address = isRecover && context.address ? context.address : "",
    skippedParams = false,
    pingTimeout,
    reqPassword,
    connected = false,
    selfaddress = "",
    blackTheme,
    currentStatus,
    balance,
    retrying = false

function promptPairCode() {
    _ps = prompt("Please enter the 6 character pairing code").trim()
    
    _k = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_ps)),
    _iv = CryptoJS.MD5(CryptoJS.enc.Utf8.parse(_ps)),
    _ivps = CryptoJS.MD5(CryptoJS.enc.Utf8.parse(_iv.toString() + _ps))
    options.iv = _ivps
    _jps = CryptoJS.AES.decrypt(encrypted, _k, options).toString(CryptoJS.enc.Utf8),
    _jk = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_jps))

    if(_ps == '' || _jk.toString() != _k.toString()) {
    alert("Incorrect pairing code. Please try again.")
        promptPairCode()
    }
}

if(_ps == '' || _jk.toString() != _k.toString()) {
    alert("Incorrect pairing code. Please try again.")
    promptPairCode()
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


    if(!connected) {
        setStatus('connecting')
    }

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
            reqPassword = jsonResponse.rp == "1"
            blackTheme = jsonResponse.bt == "1"
            balance = jsonResponse.bal / 1000000000000

            // $('#amount').attr('placeholder', `Amount (${formatter.format(balance)})`)
            $('#amountButton').attr('title', `Use full balance (${formatter.format(balance)} XMR)`)

            // Show qr code of self address
            if (jsonResponse.self && selfaddress != jsonResponse.self) {
                selfaddress = jsonResponse.self
                qrcode.makeCode(selfaddress)
                if (jsonResponse.name)
                    document.title = jsonResponse.name + " (" + selfaddress.slice(0, 4) + "..." + selfaddress.slice(-4) + ")"
            }

            $("#password").css("display", reqPassword ? "block" : "none")
            
            if(blackTheme)
                $(document.body).addClass('dark')
            else
                $(document.body).removeClass('dark')

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

            setStatus('connected')
            connected = true;
            retrying = false;

            pingTimeout = setTimeout(postAPI, 3000)
        },
        error: errHandler
    })
}

function errHandler(e) {
    // alert("Error: Connection failed");
    console.error('Web wallet: Connection failure', e)

    if(pingTimeout)
        pingTimeout = clearTimeout(pingTimeout)

    if(!connected && !retrying) {
        $('body').css('display', 'none')
        alert('A connection has already been used for this URL and pairing code. To start a new web wallet session, click "Refresh" in the web wallet interface settings and try again.')
        window.close();
        return;
    } else {
        retrying = true;
        pingTimeout = setTimeout(postAPI, 3000)
    }

    setStatus('disconnected')
    connected = false;
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

function scanQR() {
    window.location = "https://brg2.github.io/qrscan#" + encodeURIComponent(window.location.href);
}

function selectSelfAddress(elId) {
    if (selfaddress)
        prompt("", selfaddress)
}

function setStatus(status) {
    // Use/set current status
    if(status == currentStatus)
        return
    currentStatus = status
    let s = $('#sendButton'),
        c = {
            // Connected - Monero Orange
            connected: ['btn-primary-xmr', ''],
            // Connecting - Yellow
            connecting: ['btn-warning', ' (Connecting...)'],
            // Disconnected - Red
            disconnected: ['btn-danger', ' (Disconnected)']
        }
    s.attr('class', 'btn')
    s.attr('title', 'Send XMR' + c[status][1])
    s.addClass(c[status][0])
}

function useBalance() {
    if(balance && !isNaN(balance))
        $('#amount').val(balance)
}