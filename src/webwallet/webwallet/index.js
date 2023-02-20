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
const { button, div, i, img, input, small, span, strong } = H;

export const TxDirection = {
  In: 0,
  Out: 1,
};

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
                img({
                  id: "moneroLogo",
                  src: "monero.svg",
                }),
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
                {
                  title: "Clear address",
                  onclick() {
                    app.clearAddress();
                    $("#address")[0]?.focus();
                  },
                },
                "×"
              ),
              button.btn["btn-outline-secondary"](
                { title: "Scan QR Code", onclick: app.scanQR },
                i.bi["bi-qr-code-scan"]()
              ),
            ]),
            div["mb-2"]["input-group"]({}, [
              input["form-control"]["form-control-lg"]({
                id: "amount",
                placeholder: "Amount",
              }),
              button.btn["btn-outline-secondary"]["x-clear"](
                {
                  title: "Clear amount",
                  onclick() {
                    app.clearAmount();
                    $("#amount")[0]?.focus();
                  },
                },
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
              ? div["mb-2"]["w-100"](
                  { id: "password-container" },
                  div["input-group"](
                    {},
                    input["form-control"]["form-control-lg"]({
                      id: "password",
                      type: "password",
                      placeholder: "Password",
                    }),
                    button.btn["btn-outline-secondary"]["x-clear"](
                      {
                        title: "Clear password",
                        onclick() {
                          app.clearPassword();
                          $("#password")[0]?.focus();
                        },
                      },
                      "×"
                    )
                  )
                )
              : null,
            div["mb-4"]["w-100"]["d-flex"]["justify-content-between"]({}, [
              button.btn["btn-secondary"](
                { title: "Reset inputs", onclick: app.clearInputs },
                "Reset"
              ),
              button.btn["btn-secondary"][
                s.show == "SelfQR" ? "btn-light" : ""
              ](
                {
                  id: "toggleSelfQRButton",
                  title: "Show/hide self address",
                  onclick: () => (s.show = s.show == "SelfQR" ? "" : "SelfQR"),
                },
                i.bi["bi-qr-code"]()
              ),
              button.btn["btn-secondary"][s.paused ? "btn-light" : ""](
                {
                  id: "togglePauseResume",
                  title: (s.paused ? "Resume" : "Pause") + " connection",
                  onclick: () => app.pauseConnection(s),
                },
                s.paused ? i.bi["bi-play-fill"]() : i.bi["bi-pause-fill"]()
              ),
              button.btn["btn-secondary"][
                s.show == "TxHistory" ? "btn-light" : ""
              ](
                {
                  id: "listTxHistory",
                  title: "List transaction history",
                  onclick: () =>
                    (s.show = s.show == "TxHistory" ? "" : "TxHistory"),
                },
                i.bi["bi-list-ul"]()
              ),
              button.btn[s.retrying ? "btn-danger" : "btn-primary-xmr"](
                {
                  id: "sendButton",
                  title: "Send XMR" + (s.retrying ? " (Connecting...)" : ""),
                  onclick: app.createTransaction,
                },
                "Send"
              ),
            ]),
            s.show == "TxHistory"
              ? div(
                  {
                    style: {
                      height: "320px",
                      width: "100%",
                      overflow: "auto",
                    },
                  },
                  H(ListTxHistory)
                )
              : s.show == "SelfQR"
              ? div({
                  id: "qrcode",
                  onclick: () => app.selectSelfAddress("selfaddress"),
                  innerHTML: app.qrcode,
                })
              : div({ style: { height: "320px" } }),
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
    H(Toasts),
  ];
};

export const ListTxHistory = (p, s) => {
  if (!s.txList || s.sync)
    app.postAPI(
      {
        type: app.RequestTypes.ListTxHistory,
      },
      (txs) => {
        s.txList = txs;
        s.sync = false;
      }
    );
  return !s.txList
    ? "Loading..."
    : !s.txList.length
    ? "No transactions"
    : div["container-fluid"](
        {},
        s.txList
          .slice()
          .sort((a, b) => {
            return parseInt(a.unixtime) - parseInt(b.unixtime);
          })
          .reverse()
          .map((t, ix) => {
            const ut = parseInt(t.unixtime),
              d = moment(ut),
              amt = app.formatter.format(t.amount),
              isSend = t.dir == TxDirection.Out,
              age = moment().valueOf() - ut,
              tto = 150000 - age; // Time to old (2.5 minutes)

            s.isNew = tto > 0;

            if (s.isNew) {
              setTimeout(() => {
                s.isNew = false;
              }, tto);
            }
            return [
              div.row["flex-nowrap"]["mb-1"]["p-1"]["rounded"][
                s.isNew ? "bg-success" : s.hoverIx == ix ? "bg-secondary" : ""
              ](
                {
                  title: `${t.id} - ${
                    isSend ? "Sent" : "Received"
                  } ${amt} XMR on ${d.format("MM/DD/YY")} at ${d.format(
                    "h:mma"
                  )}`,
                  onmouseover() {
                    s.hoverIx = ix;
                  },
                  onmouseout() {
                    s.hoverIx = -1;
                  },
                },
                div["col"](
                  {
                    role: "button",
                    onclick() {
                      s.detailIx = s.detailIx == ix ? -1 : ix;
                    },
                  },
                  i.bi[`bi-${isSend ? "upload" : "download"}`]({
                    title: isSend ? "Sent" : "Received",
                  }),
                  ` `,
                  span["xmr-amount"]["d-inline-block"]["align-bottom"][
                    "text-truncate"
                  ]({ title: `${amt} XMR` }, amt),
                  ` XMR`
                ),
                div["col-auto"]["text-end"]({}, `${d.format("MMM D, YYYY")}`)
              ),
              s.detailIx == ix
                ? div.row({}, div["text-truncate"]({}, `${t.id}`))
                : null,
            ];
          })
      );
};

const Toasts = (p, s) => {
  s.list ||= [];
  return div["toast-container"]["position-absolute"]["top-0"]["end-0"]["p-3"](
    {},
    s.list.map((tst, ix) => {
      return div["toast"]["show"]["align-items-center"]["text-white"][
        ["bg-info", "bg-success", "bg-danger"][tst.type]
      ](
        {},
        div["d-flex"](
          {},
          div["toast-body"]({}, tst.msg),
          button["btn-close"]["btn-close-white"]["me-2"]["m-auto"]({
            type: "button",
            onclick() {
              s.list.splice(ix, 1);
            },
          })
        )
      );
    })
  );
};

export const toasts = {
  add(tst = {}) {
    let ix = Toasts.data.list.push(tst) - 1;
    setTimeout(() => this.remove(ix), 5000);
  },
  remove(ix) {
    const len = Toasts.data.list.length;
    ix = ix >= len ? len - 1 : ix;
    Toasts.data.list.splice(ix, 1);
  },
  ToastTypes: {
    Info: 0,
    Success: 1,
    Error: 2,
  },
};
