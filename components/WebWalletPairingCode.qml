// Copyright (c) 2014-2019, The Monero Project
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
import QtQuick.Controls 2.0
import QtQuick.Dialogs 1.2
import QtQuick.Layouts 1.1
import QtQuick.Controls.Styles 1.4
import QtQuick.Window 2.0
import FontAwesome 1.0

import "." as MoneroComponents
import "effects/" as MoneroEffects
import "../js/Utils.js" as Utils

import moneroComponents.Clipboard 1.0

Item {
    id: root
    visible: false

    property string pairingCode
    
    Clipboard { id: clipboard }

    function open(pc) {
        pairingCode = pc;
        visible = true;
    }

    function close() {
        visible = false;
    }

    ColumnLayout {
        id: mainLayout
        spacing: 10
        anchors { fill: parent; margins: 35 }

        ColumnLayout {
            id: column

            Layout.fillWidth: true
            Layout.alignment: Qt.AlignHCenter
            Layout.maximumWidth: 200

            Label {
                text: qsTr("Pairing code") + translationManager.emptyString
                Layout.fillWidth: true

                font.pixelSize: 16
                font.family: MoneroComponents.Style.fontLight.name

                color: MoneroComponents.Style.defaultFontColor
            }

            Label {
                text: pairingCode.substring(0,3) + ' ' + pairingCode.substring(3)
                Layout.fillWidth: true

                font.pixelSize: 42
                font.family: MoneroComponents.Style.fontMonoRegular.name

                color: MoneroComponents.Style.defaultFontColor
                
                MouseArea {
                    anchors.fill: parent
                    onDoubleClicked: {
                        clipboard.setText(pairingCode)
                        appWindow.showStatusMessage(qsTr("Pairing code copied to clipboard"),3)
                    }
                }
            }

            // Ok button
            RowLayout {
                id: buttons
                Layout.topMargin: 10
                Layout.alignment: Qt.AlignRight

                MoneroComponents.StandardButton {
                    id: okButton
                    small: true
                    text: qsTr("Ok") + translationManager.emptyString
                    onClicked: close()
                }
            }
        }
    }
}
