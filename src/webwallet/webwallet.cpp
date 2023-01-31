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
#include <QDebug>
#include <QCryptographicHash>
#include <thread>
#include <Qt-AES/qaesencryption.h>
#include <simple-web-server/server_http.hpp>
#include <simple-web-server/client_https.hpp>
#include <algorithm>
#include <boost/filesystem.hpp>
#include <boost/dll/runtime_symbol_info.hpp>
#include <fstream>
#include <vector>
#include <regex>
#include <boost/algorithm/string.hpp>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/json_parser.hpp>
#include <boost/property_tree/ptree.hpp>

#include "Wallet.h"

#include "webwallet.h"
#include "webwallet_fileserver.cpp"

using namespace std;
using HttpServer = SimpleWeb::Server<SimpleWeb::HTTP>;
using HttpsClient = SimpleWeb::Client<SimpleWeb::HTTPS>;
namespace pt = boost::property_tree;

HttpServer WebWallet::server;
thread WebWallet::server_thread;
bool WebWallet::started = false;
QString WebWallet::strIP = "";

Wallet * currentWallet;

bool requirePassword = true;

bool WebWallet::useLast = true;

QString wPassword = "";

bool blackTheme = false;

QString wName = "";

int portNumberRangeStart = 56700;
int portNumberRange = 101;

//Random generator
std::random_device rd;
std::mt19937 rng(rd());
std::uniform_int_distribution<int> randPort(portNumberRangeStart, portNumberRangeStart + portNumberRange);

// int portNumber = rand() % portNumberRange + portNumberRangeStart;
int portNumber = randPort(rng);

//Reference to web wallet menu
QObject * webwalletMenu;

// AES Encryption engine
QAESEncryption encryption(QAESEncryption::AES_256, QAESEncryption::CBC, QAESEncryption::Padding::PKCS7);

// pairing string
QString WebWallet::_ps = "";
// P - path key
QString WebWallet::_p = "";
// AP - api path key
QString WebWallet::_ap = "";
// K - key
QByteArray WebWallet::_k = "";
// IV - initial vector
QByteArray WebWallet::_iv = "";
// NAP - next api path key
QString WebWallet::_nap = "";
// NK - next key
QByteArray WebWallet::_nk = "";
// NIV - next initial vector
QByteArray WebWallet::_niv = "";

// LAP - last api path
QString WebWallet::_lap = "";
// LK - last key
QByteArray WebWallet::_lk = "";
// LIV - last initial vector
QByteArray WebWallet::_liv = "";

QString random_string(std::size_t length) {
    const std::string chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const int cSize = chars.size();

    std::uniform_int_distribution<> randString(0, cSize - 1);
    
    QString random_string;

    for (std::size_t i = 0; i < length; ++i)
    {
        random_string += chars[randString(rng)];
    }

    return random_string;
}

QString random_string_pairing(std::size_t length) {
    const std::string chars = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
    const int cSize = chars.size();
    std::uniform_int_distribution<> randString(0, cSize - 1);
    
    QString random_string;

    for (std::size_t i = 0; i < length; ++i)
    {
        random_string += chars[randString(rng)];
    }

    return random_string.toUpper();
}

void WebWallet::transactionCreatedHandler(
    PendingTransaction *tx, 
    QVector<QString> &destinationAddresses, 
    QString &payment_id, 
    quint32 mixin_count) 
{
    if (currentWallet) {
        currentWallet->commitTransactionAsync(tx);
    }
}

Q_INVOKABLE void WebWallet::start() {
    if (started) {
        return;
    }
    
    qInfo() << "Web wallet: Starting";

    server.config.port = portNumber;
    
    // API end point
    server.resource["^/(.*?)/?$"]["POST"] = [](shared_ptr<HttpServer::Response> response, shared_ptr<HttpServer::Request> request) {

        QString encryptedPayload = QString::fromStdString(request->content.string());

        // qCritical() << "Trying payload" << encryptedPayload;

        string curPath = request->path_match[1].str();

        if ((curPath != _ap.toStdString() && curPath != _lap.toStdString()) ||
            (!useLast && curPath == _lap.toStdString())) {
            // qCritical() << "Wrong path";
            *response << "HTTP/1.1 404 Not Found\r\n"
                << "Content-Length: 0\r\n\r\n";
            return;
        }

        QByteArray decodeBytes = "";
        QByteArray _ivps = "";

        pt::ptree outJSON;

        pt::ptree inJSON;

        try {

            _ivps = QCryptographicHash::hash((_iv.toHex() + _ps).toUtf8(), QCryptographicHash::Md5);

            // qCritical() << "IVPS:" << _ivps.toHex();
            // qCritical() << "Encrypted payload:" << encryptedPayload;
            decodeBytes = encryption.decode(QByteArray::fromBase64(encryptedPayload.toUtf8()), _k, _ivps);

            QString decodedString = QString(encryption.removePadding(decodeBytes));
            // qCritical() << "Decrypted payload:" << decodedString;

            std::stringstream buf;

            buf << decodedString.toStdString();
            read_json(buf, inJSON);

            useLast = true;

        } catch(const exception &e) {
            // qCritical() << "Bad request, trying last key";

            try {

                if (!useLast) {
                    // qCritical() << "Trial 2 No use last parameters" << e.what();
                    return;
                }
                
                _ivps = QCryptographicHash::hash((_liv.toHex() + _ps).toUtf8(), QCryptographicHash::Md5);

                // qCritical() << "Trial 2 Last IVPS:" << _ivps.toHex();
                // qCritical() << "Trial 2 Encrypted payload:" << encryptedPayload;
                decodeBytes = encryption.decode(QByteArray::fromBase64(encryptedPayload.toUtf8()), _lk, _ivps);

                QString decodedString = QString(encryption.removePadding(decodeBytes));
                // qCritical() << "Decrypted payload:" << decodedString;

                std::stringstream buf;

                buf << decodedString.toStdString();
                read_json(buf, inJSON);

                // Use last parameters
                
                // Current key = Last key
                _k.clear();
                _k = _lk.mid(0, _lk.length());

                // Current IV = Last IV
                _iv.clear();
                _iv = _liv.mid(0, _liv.length());

                // Current Path = Last path
                _ap = _lap;
                _lap = "";

                useLast = false;

                // End use last parameters

            } catch(const exception &e) {
                qCritical() << "Trial 2 Bad request" << e.what();
                return;
            }
        }

        try {
            string _jk = inJSON.get<string>("k");

            string payload = "";
            if (_jk == _k.toHex().toStdString()) {

                /* Set last parameters */

                // Last key = Next key
                _lk.clear();
                _lk = _k.mid(0, _k.length());

                // Last IV = Next IV
                _liv.clear();
                _liv = _iv.mid(0, _iv.length());

                // Last Path = Next path
                _lap = _ap;
                _ap = "";

                // Last ivps
                QByteArray _livps = _ivps;

                /* End Set last parameters */


                // Handle payload
                if (inJSON.get_child_optional("payload") != boost::none) {
                    pt::ptree _jpload = inJSON.get_child("payload");
                    if (_jpload.get_child_optional("address") != boost::none &&
                        _jpload.get_child_optional("amount") != boost::none) {
                        string _taddress =  _jpload.get<string>("address");
                        string _tamount =  _jpload.get<string>("amount");
                        string _tpass = _jpload.get<string>("password");
                        if (_taddress != "" && _tamount != "" && 
                            !requirePassword || QString::fromStdString(_tpass) == wPassword) {
                            qCritical() << "!!!!!!!!!!!!!!!! Transaction !!!!!!!!!!!!!!!!!!!!!";
                            qCritical() << "Address: " << QString::fromStdString(_taddress);
                            qCritical() << "Amount: " << QString::fromStdString(_tamount);

                            // Destination address
                            QVector<QString> destAddresses;
                            destAddresses << QString::fromStdString(_taddress);

                            // Payment ID - Not used
                            QString paymentId = "";

                            // Destination amounts
                            QVector<QString> destAmounts;
                            destAmounts << QString::fromStdString(_tamount);

                            // Mixin count = 10 (11 including self)
                            quint32 mixinCount = 10;

                            // Priority - Automatic (0)
                            PendingTransaction::Priority priority = PendingTransaction::Priority::Priority_Low;
                            
                            currentWallet->createTransactionAsync(
                                destAddresses,
                                paymentId,
                                destAmounts,
                                mixinCount,
                                priority
                            );
                        }
                    }
                }

                // Generate next request context
                _nk = QCryptographicHash::hash(random_string(100).toUtf8(), QCryptographicHash::Sha256);
                _niv = QCryptographicHash::hash(random_string(100).toUtf8(), QCryptographicHash::Md5);
                _nap = QCryptographicHash::hash(random_string(100).toUtf8(), QCryptographicHash::Sha256).toHex();

                // Build json response
                outJSON.put("k", _nk.toHex().toStdString());
                outJSON.put("iv", _niv.toHex().toStdString());
                outJSON.put("p", _nap.toStdString());
                outJSON.put("bal", currentWallet == NULL ? "" : std::to_string(currentWallet->balance()));
                outJSON.put("rp", requirePassword ? 1 : 0);
                outJSON.put("self", currentWallet == NULL ? "" : currentWallet->address(0, 0).toStdString());
                outJSON.put("bt", blackTheme ? 1 : 0);
                outJSON.put("name", wName.toStdString());

                std::stringstream ss;

                pt::write_json(ss, outJSON, false);

                payload = ss.str();

                // qCritical() << "API Response:" << QString::fromStdString(payload);

                payload = encryption.encode(QString::fromStdString(payload).toUtf8(), _lk, _livps).toBase64().toStdString();

                _k.clear();
                _k = _nk.mid(0, _nk.length());

                // Current IV = Next IV
                _iv.clear();
                _iv = _niv.mid(0, _niv.length());
                _ivps = QCryptographicHash::hash((_iv.toHex() + _ps).toUtf8(), QCryptographicHash::Md5);

                // Current Path = Next path
                _ap = _nap;
                _nap = "";

                /* End Set Current Parameters */

                // Update UI
                if(webwalletMenu != NULL) {
                    QMetaObject::invokeMethod(webwalletMenu, "showConnected", Qt::QueuedConnection);
                }

            } else {
                // qCritical() << "Key doesn't match" << QString::fromStdString(_jk) << "!=" << _k.toBase64();
                return;
            }

            *response << "HTTP/1.1 200 OK\r\n"
                << "Content-Type: application/octet-stream" << "\r\n"
                << "Content-Length: " << payload.length() << "\r\n\r\n"
                << payload;
        } catch(const exception &e) {
            qCritical() << "Bad request" << e.what();
            return;
        }
    };

    server.resource["^/(.+)$"]["GET"] = [](shared_ptr<HttpServer::Response> response, shared_ptr<HttpServer::Request> request) {

        string s = request->path_match[1].str();
        // qCritical() << "GET Request: " << QString::fromStdString(s);

        // Check path root token against _p
        if (s.substr(0, s.find("/")) != _p.toStdString()) {
            return;
        }

        // qCritical() << QString::fromStdString(request->path);
        // qCritical() << QString::fromStdString(request->path_match[1].str());

        regex re("^/" + _p.toStdString());
  
        string strPath = regex_replace(request->path, re, "/");
        
        try {
            auto web_root_path = boost::dll::program_location().parent_path();
            web_root_path /= "webwallet";
            auto path = boost::filesystem::canonical(web_root_path / strPath);
            bool isIndex = false;
            // Check if path is within web_root_path
            if(distance(web_root_path.begin(), web_root_path.end()) > distance(path.begin(), path.end()) ||
              !equal(web_root_path.begin(), web_root_path.end(), path.begin()))
              throw invalid_argument("path must be within root path");
            if(boost::filesystem::is_directory(path)) {
                path /= "index.html";
                isIndex = true;
            }

            // qCritical() << QString::fromStdString(path.string());

            SimpleWeb::CaseInsensitiveMultimap header;

            auto ifs = make_shared<ifstream>();
            ifs->open(path.string(), ifstream::in | ios::binary | ios::ate);

            if(*ifs) {
                auto length = ifs->tellg();
                ifs->seekg(0, ios::beg);

                header.emplace("Content-Length", to_string(length));
                if (!isIndex) {
                    header.emplace("Cache-Control", "max-age=30672000");
                }
                
                string ext = s.substr(s.find_last_of(".") + 1);
                if (ext == "svg") {
                    header.emplace("Content-Type", "image/svg+xml");
                } else if (ext == "png") {
                    header.emplace("Content-Type", "image/png");
                }
                response->write(header);
                
                WebWalletFileServer::read_and_send(response, ifs);
            } else {
                throw invalid_argument("could not read file");
            }
        } catch(const exception &e) {
            response->write(SimpleWeb::StatusCode::client_error_bad_request, "Could not open path " + request->path + ". " + e.what());
        }
    };

    server.on_error = [](shared_ptr<HttpServer::Request> /*request*/, const SimpleWeb::error_code & /*ec*/) {
        // Handle errors here
        // Note that connection timeouts will also call this handle with ec set to SimpleWeb::errc::operation_canceled
    };

    WebWallet::server_thread = std::thread([]() {
        // Start server
        server.start([](unsigned short port) {
            started = true;
            qInfo() << "Web wallet: Started";
        });
    });
}

Q_INVOKABLE void WebWallet::stop() {
    if (!started) {
        return;
    }
    server.stop();
    server_thread.detach();
    started = false;
    
    qInfo() << "Web wallet: Stopped";
}

Q_INVOKABLE QString WebWallet::getPublicIPJSON() {

    // Return cached IP if already retrieved
    if (QString::compare(strIP, "", Qt::CaseInsensitive) != 0) {
        return strIP;
    }

    // Plaintext Public IP feedback servers (HTTPS only)
    // i.e. { "Hostname", "Path" }
    list<vector<string>> serverURLs = {
        { "api.ipify.org", "/" },
        { "www.icanhazip.com", "/" },
        { "ipecho.net", "/plain" },
        { "myip.dnsomatic.com", "/" }
    };
    
    // Try until IP is found
    int retries = serverURLs.size();
    while (retries-- > 0 && QString::compare(strIP, "", Qt::CaseInsensitive) == 0) {
        int randIndex = rand() % serverURLs.size();
        auto sURL = serverURLs.begin();
        std::advance(sURL, randIndex);
        vector<string> serverURL = vector<string> (*sURL);
        qInfo() << "Web wallet: Fetching public IP from:" << serverURL[0].c_str();
        HttpsClient client(serverURL[0], false);
        try {
            auto r1 = client.request("GET", serverURL[1]);
            strIP = QString::fromStdString(r1->content.string());
            
            regex ipre("^\\d+\\.\\d+\\.\\d+\\.\\d+$");
            if (!regex_match(strIP.toStdString(), ipre)) {
                qCritical() << "Web wallet: IP parse error: " << serverURL[0].c_str() << ": " << strIP;
                strIP = "";
                continue;
            }

            qInfo() << "Web wallet: Fetched public IP:" << strIP;
            break;
        } catch (const SimpleWeb::system_error &e) {
            // Continue to the next URL
        }
    }

    if (QString::compare(strIP, "", Qt::CaseInsensitive) == 0) {
        qWarning() << "Web wallet: Fetch public IP failed. Please check your internet connection or the server host list. Using localhost instead.";
        strIP = "localhost";
    }

    return strIP;

}

Q_INVOKABLE int WebWallet::getPort(int portStart, int portEnd) {
    if(portStart < 49152)
        portStart = 49152;
    if(portEnd < 49152)
        portEnd = 49152;
    if(portStart > 65535)
        portStart = 65535;
    if(portEnd > 65535)
        portEnd = 65535;
    if(portEnd < portStart)
        portEnd = portStart;
    portNumberRangeStart = portStart;
    portNumberRange = portEnd - portStart + 1;
    // qCritical() << "Server port:" << portNumber;

    if(portNumber < portStart || portNumber > portEnd) {
        portNumber = randPort(rng);
        // Restart web wallet server to take new port number
        WebWallet::stop();
        WebWallet::start();
    }
    return portNumber;
}

Q_INVOKABLE void WebWallet::refresh(bool notPortNumber) {
    if(!notPortNumber) {
        portNumber = randPort(rng);
        // Restart web wallet server to take new port number
        WebWallet::stop();
        WebWallet::start();
    }

    pt::ptree outJSON;

    _ps = random_string_pairing(6);
    _p = random_string(10);
    // Use same path for API until new path is generated
    _ap = _p;
    _k = QCryptographicHash::hash(_ps.toUtf8(), QCryptographicHash::Sha256);
    _iv = QCryptographicHash::hash(_ps.toUtf8(), QCryptographicHash::Md5);
    
    QByteArray _ivps = QCryptographicHash::hash((_iv.toHex() + _ps).toUtf8(), QCryptographicHash::Md5);

    outJSON.put("k", _k.toHex().toStdString());
    QByteArray encodeText = encryption.encode(_ps.toLocal8Bit(), _k, _ivps);

    std::stringstream ss;

    pt::write_json(ss, outJSON, false);

    string strJSON = ss.str();

    boost::trim(strJSON);

    QByteArray decodeBytes = encryption.decode(encodeText, _k, _ivps);

    QString decodedString = QString(encryption.removePadding(decodeBytes));

    if(webwalletMenu) {
        // Reset key change flag
        webwalletMenu->setProperty("keysChanged", false);
        // Hack: Refresh properties
        webwalletMenu->setProperty("a", !webwalletMenu->property("a").toBool());
    }

    // Debugging information
    //string estrJSON = encryption.encode(QString::fromStdString(strJSON).toUtf8(), _k, _ivps).toBase64().toStdString();
    // qCritical() << "PS - Pairing string: " << _ps << Qt::endl;
    // qCritical() << "P - Path: " << _p << Qt::endl;
    // qCritical() << "K - key: " << _k.toHex() << Qt::endl;
    // qCritical() << "IV - iv: " << _iv.toHex() << Qt::endl;
    // qCritical() << "IVPS - ivps: " << _ivps.toHex() << Qt::endl;
    // qCritical() << "Plain json payload w/ key:" << QString::fromStdString(strJSON);
    // qCritical() << "Encoded key base64:" << QString::fromStdString(estrJSON);
    // qCritical() << "Encoded text hex:" << encodeText.toHex();
    // qCritical() << "Encoded text base64:" << QString(encodeText.toBase64());
    // qCritical() << "Decoded text:" << decodedString;
    // qCritical() << _p + "#" + QString(encodeText.toBase64());

    return;
}

Q_INVOKABLE QString WebWallet::run(Wallet * useWallet, bool passwordRequired, QString walletPassword, bool isBlackTheme, QString walletName, QObject *wwMenu) {
    if (useWallet != NULL) {
        currentWallet = useWallet;
    }
    //qCritical() << "Web wallet running";
    webwalletMenu = wwMenu;

    requirePassword = passwordRequired;
    wPassword = walletPassword;
    blackTheme = isBlackTheme;
    wName = walletName;


    if (_p == "") {
        WebWallet::refresh(true);
    }


    QByteArray _ivps = QCryptographicHash::hash((_iv.toHex() + _ps).toUtf8(), QCryptographicHash::Md5);
    QByteArray encodeText = encryption.encode(_ps.toLocal8Bit(), _k, _ivps);
    return _p + "/#" + QString(encodeText.toBase64());

}

Q_INVOKABLE QString WebWallet::getPairingCode() {
    return QString(_ps);
}
