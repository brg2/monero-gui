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

import * as app from "./app.js";

// Namespace some element types
const { button, div, img, input, path, span, svg } = H;

const qricon = [
    path({ d: "M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z" }),
    path({ d: "M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z" }),
    path({
      d: "M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z",
    }),
  ],
  qrscanicon = [
    path({
      d: "M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z",
    }),
  ]
    .concat(qricon)
    .concat([path({ d: "M12 9h2V8h-2v1Z" })]),
  pauseicon = [
    path({ d: "M8.5 7V18", "stroke-width": "3", "stroke-linecap": "round" }),
    path({
      d: "M15.5 7V12.5V18",
      "stroke-width": "3",
      "stroke-linecap": "round",
    }),
  ],
  playicon = [
    path({
      d: "M17.2839 11.134C17.9506 11.5189 17.9506 12.4811 17.2839 12.866L6.71601 18.9674C6.04934 19.3523 5.21601 18.8712 5.21601 18.1014L5.21601 5.8986C5.21601 5.1288 6.04934 4.64768 6.71601 5.03258L17.2839 11.134Z",
    }),
  ];

// index - The root of WebWallet
export const index = (p, s) => {
  setTimeout(() => {
    // Set the address field to a QR address scanned
    if (app.address && $("#address").val() == "") {
      $("#address").val(app.address);
    }
  });

  return [
    div.spacer(),
    div[s.retrying ? "blur" : ""](
      { id: "index" },
      s.connected || app.isRecover || s.retrying
        ? [
            // Wallet
            div["w-100"]["d-flex"]["flex-row"]["justify-content-between"][
              "align-items-center"
            ](
              { id: "title" },
              div.spacer(),
              div["d-flex"]["flex-row"]["align-items-center"](
                {},
                img({ id: "moneroLogo", src: "monero.svg" }),
                div({ id: "moneroTitle" }, "Monero")
              ),
              div.spacer()
            ),
            div["mb-2"]["input-group"]({}, [
              input["form-control"]["form-control-lg"]({
                id: "address",
                placeholder: "Address",
                value: "",
              }),
              button.btn["btn-outline-secondary"]["x-clear"](
                { title: "Clear address", onclick: app.clearAddress },
                "×"
              ),
              button.btn["btn-outline-secondary"](
                { title: "Scan QR Code", onclick: app.scanQR },
                svg({ width: 20, height: 20, viewBox: "0 0 16 16" }, qrscanicon)
              ),
            ]),
            div["mb-2"]["input-group"]({}, [
              input["form-control"]["form-control-lg"]({
                id: "amount",
                placeholder: "Amount",
              }),
              button.btn["btn-outline-secondary"]["x-clear"](
                { title: "Clear amount", onclick: app.clearAmount },
                "×"
              ),
              button.btn["btn-outline-secondary"](
                {
                  id: "amountButton",
                  title:
                    "Use full balance" +
                    (s.balance
                      ? ` (${app.formatter.format(s.balance)} XMR)`
                      : ""),
                  onclick: app.useBalance,
                },
                "∞"
              ),
            ]),
            s.reqPassword
              ? div["mb-2"]["w-100"]({ id: "password-container" }, [
                  input["form-control"]["form-control-lg"]({
                    id: "password",
                    type: "password",
                    placeholder: "Password",
                  }),
                ])
              : null,
            div["mb-2"]["w-100"]["d-flex"]["justify-content-between"]({}, [
              button.btn["btn-secondary"](
                { title: "Reset inputs", onclick: app.clearInputs },
                "Reset"
              ),
              button.btn["btn-secondary"](
                {
                  id: "toggleSelfQRButton",
                  title: "Show/hide self address",
                  ondblclick: app.showSelfQR,
                  onmousedown: app.showSelfQR,
                  onmouseup: app.hideSelfQR,
                  ontouchstart: app.showSelfQR,
                  ontouchend: app.hideSelfQR,
                },
                svg({ width: 20, height: 20, viewBox: "0 0 16 16" }, qricon)
              ),
              button.btn["btn-secondary"](
                {
                  id: "togglePauseResume",
                  title: (s.paused ? "Resume" : "Pause") + " connection",
                  onclick: () => pauseConnection(s),
                },
                svg(
                  { width: 20, height: 20, viewBox: "0 0 24 24" },
                  s.paused ? playicon : pauseicon
                )
              ),
              button.btn[s.retrying ? "btn-danger" : "btn-primary-xmr"](
                {
                  id: "sendButton",
                  title: "Send XMR" + (s.retrying ? " (Connecting...)" : ""),
                  onclick: app.postAPIInputs,
                },
                "Send"
              ),
            ]),
            div[s.showSelfQR ? "" : "blur"]({
              id: "qrcode",
              onclick: () => app.selectSelfAddress("selfaddress"),
              innerHTML: app.qrcode,
            }),
          ]
        : [
            // Pairing
            div({ id: "pairingTitle" }, "Enter pairing code"),
            div["input-group"](
              { id: "pairingFields" },
              // Input fields
              ...Array.from({ length: app.pcLength + 1 }, (n, i) =>
                i == Math.ceil(app.pcLength / 2)
                  ? span["input-group-text"]()
                  : input["form-control"]["form-control-lg"]["pairing-input"]({
                      id: `pcInput${
                        i < Math.ceil(app.pcLength / 2) ? i + 1 : i
                      }`,
                      maxlength: 1,
                      onpaste: (e) => app.pcInputPaste(e, i),
                      oninput: (e) => app.pcInputText(e),
                      value: "",
                    })
              ),
              button.btn["btn-outline-secondary"](
                { onclick: app.clearPairingCode },
                "×"
              )
            ),
            div(
              { id: "pairingEntryPad" },
              // Key pad
              ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((line) =>
                div["pairing-pad-line"](
                  {},
                  line.split("").map((l) =>
                    div.noselect["pairing-input-pad"](
                      {
                        onclick: () => app.pcInputEnter(l.trim()),
                      },
                      l
                    )
                  )
                )
              )
            ),
          ]
    ),
    div.spacer(),
    s.retrying
      ? div(
          {
            id: "disconnected",
            title: `Trying to reconnect to ${app.walletName}...`,
          },
          "reconnecting..."
        )
      : null,
  ];
};
