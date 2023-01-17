// Copyright (c) 2014-2022, The Monero Project
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

#include <QObject>
#include <QString>
#include <thread>

#include "Wallet.h"

#include <simple-web-server/server_http.hpp>

using HttpServer = SimpleWeb::Server<SimpleWeb::HTTP>;

class WebWallet : public QObject {
    Q_OBJECT
    public:
        Q_INVOKABLE static void start();
        Q_INVOKABLE static void stop();
        Q_INVOKABLE static QString getPublicIPJSON();
        Q_INVOKABLE static int getPort(int portStart, int portEnd);
        Q_INVOKABLE static void refresh(bool notPortNumber);
        Q_INVOKABLE static QString run(Wallet * useWallet, bool requirePassword, QString walletPassword, bool blackTheme, QString walletName);
        Q_INVOKABLE static QString getPairingCode();

    private:
        static HttpServer server;
        static std::thread server_thread;
        static bool started;
        static QString strIP;

        // Use last parameters flag
        static bool useLast;
        
        // pairing string
        static QString _ps;
        // path
        static QString _p;
        // api path
        static QString _ap;
        // key
        static QByteArray _k;
        // initial vector
        static QByteArray _iv;
        // next api path
        static QString _nap;
        // next key
        static QByteArray _nk;
        // next initial vector
        static QByteArray _niv;

        // last api path
        static QString _lap;
        // last key
        static QByteArray _lk;
        // last initial vector
        static QByteArray _liv;

        static void transactionCreatedHandler(
            PendingTransaction *tx, 
            QVector<QString> &destinationAddresses, 
            QString &payment_id, 
            quint32 mixin_count);

};
