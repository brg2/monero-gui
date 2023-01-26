// Copyright (c) 2014-2018, The Monero Project
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

import QtQuick 2.9
import QtQuick.Layouts 1.1
import QtQuick.Controls 2.0
import QtQuick.Dialogs 1.2
import QtGraphicalEffects 1.0
import WebWallet 1.0

import "../../js/Utils.js" as Utils
import "../../js/Windows.js" as Windows
import "../../components" as MoneroComponents

Rectangle {
    color: "transparent"
    Layout.fillWidth: true
    property alias layoutHeight: settingsUI.height

    WebWallet { id: webwallet }

    ColumnLayout {
        id: settingsUI
        property int itemHeight: 60
        Layout.fillWidth: true
        anchors.left: parent.left
        anchors.top: parent.top
        anchors.right: parent.right
        anchors.margins: 20
        anchors.topMargin: 0
        spacing: 6

        MoneroComponents.CheckBox {
            id: customDecorationsCheckBox
            checked: persistentSettings.customDecorations
            onClicked: Windows.setCustomWindowDecorations(checked)
            text: qsTr("Custom decorations") + translationManager.emptyString
        }

        MoneroComponents.CheckBox {
            id: checkForUpdatesCheckBox
            enabled: !disableCheckUpdatesFlag
            checked: persistentSettings.checkForUpdates && !disableCheckUpdatesFlag
            onClicked: persistentSettings.checkForUpdates = !persistentSettings.checkForUpdates
            text: qsTr("Check for updates periodically") + translationManager.emptyString
        }

        MoneroComponents.CheckBox {
            checked: persistentSettings.displayWalletNameInTitleBar
            onClicked: persistentSettings.displayWalletNameInTitleBar = !persistentSettings.displayWalletNameInTitleBar
            text: qsTr("Display wallet name in title bar") + translationManager.emptyString
        }

        MoneroComponents.CheckBox {
            id: hideBalanceCheckBox
            checked: persistentSettings.hideBalance
            onClicked: {
                persistentSettings.hideBalance = !persistentSettings.hideBalance
                appWindow.updateBalance();
            }
            text: qsTr("Hide balance") + translationManager.emptyString
        }

        MoneroComponents.CheckBox {
            id: themeCheckbox
            checked: !MoneroComponents.Style.blackTheme
            text: qsTr("Light theme") + translationManager.emptyString
            toggleOnClick: false
            onClicked: {
                persistentSettings.blackTheme = MoneroComponents.Style.blackTheme = !MoneroComponents.Style.blackTheme;
            }
        }
        
        MoneroComponents.CheckBox {
            checked: persistentSettings.askPasswordBeforeSending
            text: qsTr("Ask for password before sending a transaction") + translationManager.emptyString
            toggleOnClick: false
            onClicked: {
                if (persistentSettings.askPasswordBeforeSending) {
                    passwordDialog.onAcceptedCallback = function() {
                        if (appWindow.walletPassword === passwordDialog.password){
                            persistentSettings.askPasswordBeforeSending = false;
                        } else {
                            passwordDialog.showError(qsTr("Wrong password"));
                        }
                    }
                    passwordDialog.onRejectedCallback = null;
                    passwordDialog.open()
                } else {
                    persistentSettings.askPasswordBeforeSending = true;
                }
            }
        }

        MoneroComponents.CheckBox {
            checked: persistentSettings.autosave
            onClicked: persistentSettings.autosave = !persistentSettings.autosave
            text: qsTr("Autosave") + translationManager.emptyString
        }

        MoneroComponents.Slider {
            Layout.fillWidth: true
            Layout.leftMargin: 35
            Layout.topMargin: 6
            visible: persistentSettings.autosave
            from: 1
            stepSize: 1
            to: 60
            value: persistentSettings.autosaveMinutes
            text: "%1 %2 %3".arg(qsTr("Every")).arg(value).arg(qsTr("minute(s)")) + translationManager.emptyString
            onMoved: persistentSettings.autosaveMinutes = value
        }

        MoneroComponents.CheckBox {
            id: userInActivityCheckbox
            checked: persistentSettings.lockOnUserInActivity
            onClicked: persistentSettings.lockOnUserInActivity = !persistentSettings.lockOnUserInActivity
            text: qsTr("Lock wallet on inactivity") + translationManager.emptyString
        }

        MoneroComponents.Slider {
            visible: userInActivityCheckbox.checked
            Layout.fillWidth: true
            Layout.topMargin: 6
            Layout.leftMargin: 35
            from: 1
            stepSize: 1
            to: 60
            value: persistentSettings.lockOnUserInActivityInterval
            text: {
                var minutes = value > 1 ? qsTr("minutes") : qsTr("minute");
                return qsTr("After ") + value + " " + minutes + translationManager.emptyString;
            }
            onMoved: persistentSettings.lockOnUserInActivityInterval = value
        }

        MoneroComponents.CheckBox {
            checked: persistentSettings.askStopLocalNode
            onClicked: persistentSettings.askStopLocalNode = !persistentSettings.askStopLocalNode
            text: qsTr("Ask to stop local node during program exit") + translationManager.emptyString
        }

        //! Manage pricing
        RowLayout {
            MoneroComponents.CheckBox {
                id: enableConvertCurrency
                text: qsTr("Enable displaying balance in other currencies") + translationManager.emptyString
                checked: persistentSettings.fiatPriceEnabled
                onCheckedChanged: {
                    if (!checked) {
                        console.log("Disabled price conversion");
                        persistentSettings.fiatPriceEnabled = false;
                    }
                }
            }
        }

        GridLayout {
            visible: enableConvertCurrency.checked
            columns: 2
            Layout.fillWidth: true
            Layout.leftMargin: 36
            columnSpacing: 32

            MoneroComponents.StandardDropdown {
                id: fiatPriceProviderDropDown
                Layout.maximumWidth: 200
                labelText: qsTr("Price source") + translationManager.emptyString
                labelFontSize: 14
                dataModel: fiatPriceProvidersModel
                onChanged: {
                    var obj = dataModel.get(currentIndex);
                    persistentSettings.fiatPriceProvider = obj.data;

                    if(persistentSettings.fiatPriceEnabled)
                        appWindow.fiatApiRefresh();
                }
            }

            MoneroComponents.StandardDropdown {
                id: fiatPriceCurrencyDropdown
                Layout.maximumWidth: 100
                labelText: qsTr("Currency") + translationManager.emptyString
                labelFontSize: 14
                currentIndex: persistentSettings.fiatPriceCurrency === "xmrusd" ? 0 : 1
                dataModel: fiatPriceCurrencyModel
                onChanged: {
                    var obj = dataModel.get(currentIndex);
                    persistentSettings.fiatPriceCurrency = obj.data;

                    if(persistentSettings.fiatPriceEnabled)
                        appWindow.fiatApiRefresh();
                }
            }

            z: parent.z + 1
        }

        ColumnLayout {
            // Feature needs to be double enabled for security purposes (miss-clicks)
            visible: enableConvertCurrency.checked && !persistentSettings.fiatPriceEnabled
            spacing: 0
            Layout.topMargin: 5
            Layout.leftMargin: 36

            MoneroComponents.WarningBox {
                text: qsTr("Enabling price conversion exposes your IP address to the selected price source.") + translationManager.emptyString;
            }

            MoneroComponents.StandardButton {
                Layout.topMargin: 10
                Layout.bottomMargin: 10
                small: true
                text: qsTr("Confirm and enable") + translationManager.emptyString

                onClicked: {
                    console.log("Enabled price conversion");
                    persistentSettings.fiatPriceEnabled = true;
                }
            }
        }

        MoneroComponents.CheckBox {
            id: proxyCheckbox
            Layout.topMargin: 6
            enabled: !socksProxyFlagSet
            checked: socksProxyFlagSet ? socksProxyFlag : persistentSettings.proxyEnabled
            onClicked: {
                persistentSettings.proxyEnabled = !persistentSettings.proxyEnabled;
            }
            text: qsTr("Socks5 proxy (%1%2)")
                .arg(appWindow.walletMode >= 2 ? qsTr("remote node connections, ") : "")
                .arg(qsTr("updates downloading, fetching price sources")) + translationManager.emptyString
        }

        MoneroComponents.RemoteNodeEdit {
            id: proxyEdit
            enabled: proxyCheckbox.enabled
            Layout.leftMargin: 36
            Layout.topMargin: 6
            Layout.minimumWidth: 100
            placeholderFontSize: 15
            visible: proxyCheckbox.checked

            daemonAddrLabelText: qsTr("IP address") + translationManager.emptyString
            daemonPortLabelText: qsTr("Port") + translationManager.emptyString

            initialAddress: socksProxyFlagSet ? socksProxyFlag : persistentSettings.proxyAddress
            onEditingFinished: {
                persistentSettings.proxyAddress = proxyEdit.getAddress();
            }
        }

        MoneroComponents.StandardButton {
            visible: !persistentSettings.customDecorations
            Layout.topMargin: 10
            small: true
            text: qsTr("Change language") + translationManager.emptyString

            onClicked: {
                appWindow.toggleLanguageView();
            }
        }

        // Monero GUI Web wallet
        MoneroComponents.CheckBox {
            id: webwalletCheckbox
            checked: persistentSettings.webwalletEnabled
            text: qsTr("Web wallet") + translationManager.emptyString
            onClicked: {
                persistentSettings.webwalletEnabled = !persistentSettings.webwalletEnabled;
                if (persistentSettings.webwalletEnabled) {
                    webwallet.start();
                } else {
                    webwallet.stop();
                }
            }
        }

        ColumnLayout {
            // Feature needs to be double enabled for security purposes (miss-clicks)
            visible: persistentSettings.webwalletEnabled && !persistentSettings.webwalletAllowed
            spacing: 0
            Layout.topMargin: 5
            Layout.leftMargin: 36

            MoneroComponents.WarningBox {
                text: qsTr("Notice: All wallet information shared between your mobile and desktop wallet is encrypted. Discovering your public IP exposes your address to the api source.") + translationManager.emptyString;
            }

            MoneroComponents.StandardButton {
                Layout.topMargin: 10
                Layout.bottomMargin: 10
                small: true
                text: qsTr("Confirm and enable") + translationManager.emptyString

                onClicked: {
                    console.log("webwallet: Enabled remote control");
                    persistentSettings.webwalletAllowed = true;
                }
            }
        }

        GridLayout {
            id: webwalletMenu
            visible: persistentSettings.webwalletEnabled && persistentSettings.webwalletAllowed
            columns: 2
            Layout.fillWidth: true
            Layout.leftMargin: 36
            columnSpacing: 10
            z: parent.z + 1

            // Show/hide "Connected" indicator
            property bool connected: false
            property bool keysChanged: false
            Timer {
                id: webwalletMenuTimer
            }

            function showConnected() {
                webwalletMenu.connected = true
                webwalletMenu.keysChanged = true
                function cb() {
                    webwalletMenu.connected = false
                }
                webwalletMenuTimer.stop();
                webwalletMenuTimer.interval = 5000;
                webwalletMenuTimer.repeat = false;
                webwalletMenuTimer.triggered.connect(cb);
                webwalletMenuTimer.triggered.connect(function release () {
                    webwalletMenuTimer.triggered.disconnect(cb); // This is important
                    webwalletMenuTimer.triggered.disconnect(release); // This is important as well
                });
                webwalletMenuTimer.start();
            }
            // End show/hide "Connected" indicator

            property int qrCodeLen: 16
            // Hack: Allows manual refresh of properties
            property bool a: true
            property string host: a || !a ? "http://" + webwallet.getPublicIPJSON() + ":" + 
                webwallet.getPort(
                    persistentSettings.webWalletPortNumStart, 
                    persistentSettings.webWalletPortNumEnd
                ) : null
            property string qrCode: a || !a ? webwallet.run(currentWallet, 
                persistentSettings.askPasswordBeforeSending, 
                walletPassword, 
                persistentSettings.blackTheme, 
                usefulName(persistentSettings.wallet_path),
                webwalletMenu
            ) : null
            property string pairCode: a || !a ? webwallet.getPairingCode() : null
            property string address: host + "/" + qrCode

            Rectangle {
                id: qrImg
                color: "white"
                visible: persistentSettings.webwalletEnabled

                property int qrCodeSize: 110

                height: qrCodeSize
                width: qrCodeSize
                Layout.leftMargin: 0

                Layout.maximumWidth: qrCodeSize
                Layout.preferredHeight: qrCodeSize
                radius: 5

                Image {
                    id: qrCodeImage
                    anchors.fill: parent
                    anchors.margins: 1

                    smooth: false
                    fillMode: Image.PreserveAspectFit
                    source: "image://qrcode/" + webwalletMenu.address
                }

                FastBlur {
                    id: qrblur
                    anchors.fill: qrCodeImage
                    source: qrCodeImage
                    radius: 30
                    visible: webwalletMenu.keysChanged
                }
            }

            ColumnLayout {
                spacing: 0
                Layout.topMargin: 0
                Layout.leftMargin: 0

                MoneroComponents.LineEdit {
                    id: webwalletAddress
                    labelFontSize: 14
                    backgroundColor: "transparent"
                    fontColor: MoneroComponents.Style.defaultFontColor
                    fontBold: false
                    fontSize: 15
                    placeholderText: qsTr("Click refresh to generate new URL") + translationManager.emptyString
                    text: webwalletMenu.keysChanged ? '' : webwalletMenu.address
                    labelText: 'URL'
                    readOnly: true
                    copyButton: !webwalletMenu.keysChanged
                    openLinkButton: !webwalletMenu.keysChanged
                }

                RowLayout {
                    Layout.fillWidth: true
                    Layout.topMargin: 5

                    MoneroComponents.StandardButton {
                        height: 24
                        small: true
                        text: qsTr("Refresh") + translationManager.emptyString
                        tooltip: qsTr("Regenerate URL and pairing code") + translationManager.emptyString

                        onClicked: {
                            // Focus onto address (if ports are still focused)
                            webwalletAddress.forceActiveFocus();
                            // Regenerate keys
                            webwallet.refresh(false)
                            // Hack: Refresh properties
                            webwalletMenu.a = !webwalletMenu.a
                            // Reset key change flag
                            webwalletMenu.keysChanged = false
                        }
                    }

                    MoneroComponents.StandardButton {
                        height: 24
                        small: true
                        text: qsTr("Pairing code") + translationManager.emptyString
                        tooltip: qsTr("Display connection pairing code") + translationManager.emptyString
                        visible: !webwalletMenu.keysChanged

                        onClicked: {
                            informationPopup.title  = qsTr("Pairing code") + translationManager.emptyString
                            informationPopup.text = qsTr(webwalletMenu.pairCode)
                            informationPopup.icon = StandardIcon.Information
                            informationPopup.open()
                            informationPopup.onCloseCallback = null
                        }
                    }

                    Item {
                        Layout.fillWidth: true
                    }

                    MoneroComponents.TextPlain {
                        id: webwalletConnectedLabel
                        visible: webwalletMenu.connected
                        themeTransition: false
                        color: "#00FF00"
                        text: qsTr("Connected") + translationManager.emptyString
                    }

                    Item {
                        Layout.fillWidth: true
                    }

                    MoneroComponents.Label {
                        id: webWalletPortNumTitle
                        Layout.bottomMargin: 5
                        visible: true
                        fontSize: 14
                        text: qsTr("Port range") + translationManager.emptyString
                    }

                    MoneroComponents.Input {
                        id: webWalletPortNumStart
                        Layout.preferredWidth: 50
                        visible: true
                        font.pixelSize: 14
                        font.bold: false
                        horizontalAlignment: TextInput.AlignLeft
                        verticalAlignment: TextInput.AlignVCenter
                        selectByMouse: true
                        color: MoneroComponents.Style.defaultFontColor
                        placeholderText: qsTr("Start (min 49152)")

                        text: persistentSettings.webWalletPortNumStart
                        property int num: parseInt(text)

                        background: Rectangle {
                            color: MoneroComponents.Style.blackTheme ? "transparent" : "white"
                            radius: 3
                            border.color: parent.activeFocus ? MoneroComponents.Style.inputBorderColorActive : MoneroComponents.Style.inputBorderColorInActive
                            border.width: 1
                        }
                        onFocusChanged: {
                            if(focus) return
                            var n = num
                            if(!n || n < 49152)
                                text = n = 49152
                            if(n > 65535)
                                text = n = 65535
                            if(n > webWalletPortNumEnd.num)
                                text = n = webWalletPortNumEnd.num
                            persistentSettings.webWalletPortNumStart = n
                        }
                    }

                    MoneroComponents.Input {
                        id: webWalletPortNumEnd
                        Layout.preferredWidth: 50
                        visible: true
                        font.pixelSize: 14
                        font.bold: false
                        horizontalAlignment: TextInput.AlignLeft
                        verticalAlignment: TextInput.AlignVCenter
                        selectByMouse: true
                        color: MoneroComponents.Style.defaultFontColor
                        placeholderText: qsTr("End (max 65535)")

                        text: persistentSettings.webWalletPortNumEnd
                        property int num: parseInt(text)

                        background: Rectangle {
                            color: MoneroComponents.Style.blackTheme ? "transparent" : "white"
                            radius: 3
                            border.color: parent.activeFocus ? MoneroComponents.Style.inputBorderColorActive : MoneroComponents.Style.inputBorderColorInActive
                            border.width: 1
                        }
                        onFocusChanged: {
                            if(focus) return
                            var n = num
                            if(!n || n < 49152)
                                text = n = 49152
                            if(n > 65535)
                                text = n = 65535
                            if(n < webWalletPortNumStart.num)
                                text = n = webWalletPortNumStart.num
                            persistentSettings.webWalletPortNumEnd = n
                        }
                    }
                }
            }

        }

    }

    ListModel {
        id: fiatPriceProvidersModel
    }

    ListModel {
        id: fiatPriceCurrencyModel
        ListElement {
            data: "xmrusd"
            column1: "USD"
        }
        ListElement {
            data: "xmreur"
            column1: "EUR"
        }
    }

    Component.onCompleted: {
        // Dynamically fill fiatPrice dropdown based on `appWindow.fiatPriceAPIs`
        var apis = appWindow.fiatPriceAPIs;
        fiatPriceProvidersModel.clear();

        var i = 0;
        for (var api in apis){
            if (!apis.hasOwnProperty(api))
               continue;

            fiatPriceProvidersModel.append({"column1": Utils.capitalize(api), "data": api});

            if(api === persistentSettings.fiatPriceProvider)
                fiatPriceProviderDropDown.currentIndex = i;
            i += 1;
        }

        console.log('SettingsLayout loaded');
    }
}
