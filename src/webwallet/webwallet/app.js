// Copyright (c) 2014-2023, The Monero Project
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//    conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//    of conditions and the following disclaimer in the documentation and/or other
//    materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//    used to endorse or promote products derived from this software without specific
//    prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import { index, ListTxHistory } from "./index.js";

export const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 12,
});

const fullHash = window.location.hash.split("#")[1];

export let isRecover = fullHash.slice(0, 1) == "?",
  qrcode = "",
  reqPassword,
  pcLength = 6,
  walletName = "",
  strRecoverHash,
  RequestTypes = {
    CreateTransaction: 0,
    ListTxHistory: 1,
  };

let encrypted = fullHash.substring(1),
  context = isRecover
    ? JSON.parse(
        CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encrypted))
      )
    : "",
  _ps,
  _k,
  _iv,
  _ivps,
  _p,
  options = {
    mode: CryptoJS.mode.CBC,
    iv: _ivps,
    padding: CryptoJS.pad.Pkcs7,
  },
  _jps,
  _jk,
  pingTimeout,
  connected = false,
  selfaddress = "",
  blackTheme = isRecover ? null : fullHash.slice(0, 1) == "1",
  balance,
  retrying = false,
  paused = false;

export let address = isRecover && context.address ? context.address : "";

// app - Initialize the app
export const app = () => {
  syncBlackTheme();

  if (!isRecover) return clearPairingCode();
  _ps = context.ps;
  _k = CryptoJS.enc.Hex.parse(context.k);
  _iv = CryptoJS.enc.Hex.parse(context.iv);
  _ivps = CryptoJS.MD5(CryptoJS.enc.Utf8.parse(_iv.toString() + _ps));
  options.iv = _ivps;
  _p =
    window.location.origin +
    (isRecover ? "/" + context.p : window.location.pathname);
  _jps = isRecover
    ? context.ps
    : CryptoJS.AES.decrypt(encrypted, _k, options).toString(CryptoJS.enc.Utf8);
  _jk = isRecover ? context.k : CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_jps));

  if (_ps == "" || _jk.toString() != _k.toString()) {
    alert("Incorrect pairing code. Please try again.");
    clearPairingCode();
  } else {
    postAPI();
  }
};

// processPairCode - Take the pairing code input and attempt to decode the hash string
function processPairCode() {
  function fail() {
    alert("Incorrect pairing code. Please try again.");
    clearPairingCode();
  }
  try {
    _ps = getPCInput();
    _k = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_ps));
    _iv = CryptoJS.MD5(CryptoJS.enc.Utf8.parse(_ps));
    _ivps = CryptoJS.MD5(CryptoJS.enc.Utf8.parse(_iv.toString() + _ps));
    options.iv = _ivps;
    _jps = CryptoJS.AES.decrypt(encrypted, _k, options).toString(
      CryptoJS.enc.Utf8
    );
    _jk = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_jps));
    _p = window.location.origin + window.location.pathname;

    if (_ps == "" || _jk.toString() != _k.toString()) {
      fail();
    } else {
      postAPI();
    }
  } catch (e) {
    fail();
  }
}

// postAPI - Make a ping or payload request to the server
export function postAPI(request, cb = null) {
  var jsonSend = { k: _k.toString() };
  if (request) {
    jsonSend.request = request;
  }
  var _ejson = CryptoJS.AES.encrypt(
    JSON.stringify(jsonSend),
    _k,
    options
  ).toString();

  // Clear any calls of this method to avoid duplicates
  if (pingTimeout) pingTimeout = clearTimeout(pingTimeout);

  $.ajax({
    url: _p,
    method: "POST",
    data: _ejson,
    success: function (crypResponse) {
      if (!crypResponse) {
        return errHandler();
      }
      let jsonResponse = JSON.parse(
        CryptoJS.AES.decrypt(crypResponse, _k, options).toString(
          CryptoJS.enc.Utf8
        )
      );
      if (!jsonResponse["k"] || !jsonResponse["iv"] || !jsonResponse["p"])
        return errHandler();

      // Connection success
      _k = CryptoJS.enc.Hex.parse(jsonResponse.k);
      _iv = CryptoJS.enc.Hex.parse(jsonResponse.iv);
      _ivps = CryptoJS.MD5(CryptoJS.enc.Utf8.parse(jsonResponse.iv + _ps));
      _p = window.location.origin + "/" + jsonResponse.p;

      options.iv = _ivps;

      let newReqPassword = jsonResponse.rp == "1";
      if (newReqPassword != reqPassword) {
        reqPassword = newReqPassword;
        index.data.reqPassword = reqPassword;
      }

      blackTheme = jsonResponse.bt == "1";

      let newbalance = jsonResponse.bal / 1000000000000;
      if (newbalance != balance) {
        // Show new transaction notification if balance not synced already
        if (balance != undefined) {
          // Update tx history if already fetched
          if (ListTxHistory.data.txList) ListTxHistory.data.sync = true;
          toastr.info("A new transaction has been processed");
        }
        balance = newbalance;
        index.data.balance = balance;
      }

      // Show qr code of self address
      if (
        (jsonResponse.self && selfaddress != jsonResponse.self) ||
        !connected
      ) {
        selfaddress = jsonResponse.self;
        qrcode = new QRCode({
          content: selfaddress,
          width: 320,
          height: 320,
          padding: 3,
        }).svg();
        if (jsonResponse.name) {
          walletName = jsonResponse.name;
          document.title =
            walletName +
            " (" +
            selfaddress.slice(0, 4) +
            "..." +
            selfaddress.slice(-4) +
            ")";
        }
      }

      syncBlackTheme();

      jsonResponse.ps = _ps;

      // Only save required parameters in recovery
      strRecoverHash = CryptoJS.enc.Base64.stringify(
        CryptoJS.enc.Utf8.parse(
          JSON.stringify({
            iv: jsonResponse.iv,
            p: jsonResponse.p,
            ps: jsonResponse.ps,
            k: jsonResponse.k,
          })
        )
      );

      // Save current context in hash if user reloads (not sent over network and changes every ~3 seconds)
      window.location.replace("#?" + strRecoverHash);

      if (!connected) {
        connected = true;
        retrying = false;
        index.data.connected = true;
        index.data.retrying = false;
      }

      if (!paused) pingTimeout = setTimeout(postAPI, 3000);

      // Finally, use custom callback if supplied
      if (jsonResponse.response && cb != null) {
        cb(jsonResponse.response);
      }
    },
    error: errHandler,
    complete() {
      setTimeout(() => {
        if (!$("body").hasClass("loaded")) $("body").addClass("loaded");
      }, 10);
    },
  });
}

// errHandler - Handle any errors that happen with the api request
function errHandler(e) {
  // alert("Error: Connection failed");
  console.error("Web wallet: Connection failure", e);

  if (pingTimeout) pingTimeout = clearTimeout(pingTimeout);

  if (!connected && !retrying) {
    alert(
      'A connection has already been used for this URL and pairing code. To start a new web wallet session, click "Refresh" in the web wallet interface settings and try again.'
    );
    window.close();
    return;
  } else {
    if (!retrying) {
      retrying = true;
      index.data.retrying = true;
      document.title = `${walletName} (Disconnected)`;
    }
    pingTimeout = setTimeout(postAPI, 3000);
  }

  if (connected) {
    index.data.connected = connected = false;
  }
}

// createTransaction - Collect the input values in order to make a payload request to the api
export const createTransaction = () => {
  let address = $("#address").val();
  let amount = $("#amount").val();
  let password = $("#password").val() || "";
  if (!address) return alert("Please enter an address");
  if (!amount) return alert("Please enter an amount");
  if (reqPassword && !password) return alert("Please enter a password");
  if (
    !confirm(
      "Sending " +
        formatter.format(amount) +
        " XMR to " +
        address +
        ".\n\nContinue?"
    )
  )
    return;
  postAPI({
    type: RequestTypes.CreateTransaction,
    address: address,
    amount: amount,
    password: password,
  });

  clearInputs();
};

// clearInputs - Clear the input values
export const clearInputs = () => {
  clearAddress();
  clearAmount();
  clearPassword();
};

// clearAddress - Clear the address input
export const clearAddress = () => {
  $("#address").val("");
};

// clearAmount - Clear the amount input
export const clearAmount = () => {
  $("#amount").val("");
};

// clearPassword - Clear the password input
export const clearPassword = () => {
  $("#password").val("");
};

// scanQR - Redirect to a qr code reader that will return the address
export const scanQR = () => {
  window.location =
    "https://brg2.github.io/qrscan#" + encodeURIComponent(window.location.href);
};

// selectSelfAddress - Show a prompt that will allow the user to copy the wallet address
export const selectSelfAddress = (elId) => {
  if (selfaddress) prompt("", selfaddress);
};

// useBalance - Use the full wallet balance in the amount input
export const useBalance = () => {
  if (balance && !isNaN(balance)) $("#amount").val(balance);
};

// pcInputEnter - Enter the character into the pairing code inputs
export const pcInputEnter = (character) => {
  if (!character) return;
  let pcInputNum = getEmptyPCInput();
  if (!pcInputNum) return;
  $("#pcInput" + pcInputNum).val(character);
  if (pcInputNum == 6) setTimeout(processPairCode);
};

// clearPairingCode - Clear all the pairing code inputs
export const clearPairingCode = () => {
  for (let i = 1; i < 7; i++) {
    $("#pcInput" + i).val("");
  }
  setTimeout(gotoNextPCInput);
};

// getEmptyPCInput - Get the next empty pairing code input
function getEmptyPCInput() {
  let lastNum;
  for (let i = 6; i > 0; i--) {
    if ($("#pcInput" + i).val() == "") lastNum = i;
    else if (lastNum) return lastNum;
  }
  return lastNum;
}

// getPCInput - Collect the values of all the pairing code inputs
function getPCInput() {
  var pc = "";
  for (let i = 1; i < 7; i++) {
    pc += $("#pcInput" + i).val();
  }
  return pc;
}

// setPCInput - Place a string of values into the pairing code inputs
//   (used when pasting from the clipboard)
function setPCInput(strText, offset = 0) {
  for (let i = 1 + offset; i < 7; i++) {
    $("#pcInput" + i).val(strText.slice(i - 1, i));
  }
}

// pcInputPaste - Paste a text value into the pairing code inputs
export const pcInputPaste = (e, offset) => {
  var pasteText = e.clipboardData.getData("text");
  setPCInput(pasteText, offset);
  e.currentTarget.blur();
  if (getPCInput().length == pcLength) setTimeout(processPairCode);
};

// pcInputText - Enter a character from the keyboard into the pairing code inputs
export const pcInputText = (e) => {
  const inputEl = e.currentTarget;
  inputEl.value = inputEl.value.toUpperCase();
  if (inputEl.value != "") setTimeout(gotoNextPCInput);
};

// gotoNextPCInput - Focus to the next empty pairing code input
function gotoNextPCInput() {
  if (getEmptyPCInput()) $("#pcInput" + getEmptyPCInput()).focus();
  else if (getPCInput().length == pcLength) setTimeout(processPairCode);
}

// pauseConnection - Pauses the api connection
export const pauseConnection = (s) => {
  paused = s.paused = !s.paused;
  if (!paused) {
    postAPI();
  } else {
    if (pingTimeout) pingTimeout = clearTimeout(pingTimeout);
  }
};

// syncBlackTheme - Sets the dark or light theme class
function syncBlackTheme() {
  if (blackTheme) $(document.body).addClass("dark");
  else $(document.body).removeClass("dark");
}
