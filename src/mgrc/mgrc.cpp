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
#include <fstream>
#include <vector>
#include <regex>
#include <boost/algorithm/string.hpp>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/json_parser.hpp>
#include <boost/property_tree/ptree.hpp>

#include "mgrc.h"
#include "mgrc_fileserver.cpp"

using namespace std;
using HttpServer = SimpleWeb::Server<SimpleWeb::HTTP>;
using HttpsClient = SimpleWeb::Client<SimpleWeb::HTTPS>;
namespace pt = boost::property_tree;

HttpServer mgrc::server;
thread mgrc::server_thread;
bool mgrc::started = false;
QString mgrc::strIP = "";

// pairing string
QString mgrc::_ps = "";
// P - path
QString mgrc::_p = "";
// AP - api path
QString mgrc::_ap = "";
// K - key
QByteArray mgrc::_k = "";
// IV - initial vector
QByteArray mgrc::_iv = "";
// NAP - next api path
QString mgrc::_nap = "";
// NK - next key
QByteArray mgrc::_nk = "";
// NIV - next initial vector
QByteArray mgrc::_niv = "";

QString random_string(std::size_t length) {
    const std::string CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    std::random_device random_device;
    std::mt19937 generator(random_device());
    std::uniform_int_distribution<> distribution(0, CHARACTERS.size() - 1);

    QString random_string;

    for (std::size_t i = 0; i < length; ++i)
    {
        random_string += CHARACTERS[distribution(generator)];
    }

    return random_string;
}

Q_INVOKABLE void mgrc::start() {

    if (started) {
        return;
    }
    
    server.config.port = 8080;
    
    // API end point
    server.resource["^/(.+)$"]["POST"] = [](shared_ptr<HttpServer::Response> response, shared_ptr<HttpServer::Request> request) {
        //cout << "After path: " << request->path_match[1].str();

        QString encryptedPayload = QString::fromStdString(request->content.string());

        qCritical() << "Trying payload" << encryptedPayload;

        if (request->path_match[1].str() != _ap.toStdString()) {
            qCritical() << "Wrong path";
            return;
        }

        QAESEncryption encryption(QAESEncryption::AES_256, QAESEncryption::CBC, QAESEncryption::Padding::PKCS7);

        try {
            pt::ptree outJSON;

            QByteArray _ivps = QCryptographicHash::hash((_iv.toHex() + _ps).toUtf8(), QCryptographicHash::Md5);

            qCritical() << "IVPS:" << _ivps.toHex();
            qCritical() << "Encrypted payload:" << encryptedPayload;
            // QString hashCS = QCryptographicHash::hash(strCS.toUtf8(), QCryptographicHash::Sha256).toHex();
            QByteArray decodeText = encryption.decode(QByteArray::fromBase64(encryptedPayload.toUtf8()), _k, _ivps);

            QString decodedString = QString(encryption.removePadding(decodeText));
            qCritical() << "Decrypted payload:" << decodedString;

            if (decodedString == "ok" && !_nk.isNull() && !_niv.isNull() && _nap != "") {
                qCritical() << "Setting next context";
                _k.clear();
                _k = _nk.mid(0, _nk.length());

                _iv.clear();
                _iv = _niv.mid(0, _niv.length());
                _ivps = QCryptographicHash::hash((_iv.toHex() + _ps).toUtf8(), QCryptographicHash::Md5);

                _ap = _nap;
                _nap = "";
                *response << "HTTP/1.1 200 OK\r\n"
                    << "Content-Length: 0\r\n\r\n";
                return;
            }

            std::stringstream buf;

            buf << decodedString.toStdString();

            pt::ptree inJSON;
            read_json(buf, inJSON);

            // auto name = inJSON.get<string>("firstName") + " " + inJSON.get<string>("lastName");
            string _jk = inJSON.get<string>("k");

            // qCritical() << "POST data:" << QString::fromStdString(request->content.string());
            // qCritical() << "Hash CS:" << hashCS;

            string payload = "";
            if (_jk == _k.toHex().toStdString()) {
                // Get the last key
                QByteArray _lk = _k;
                QByteArray _livps = _ivps;

                // Generate next request context
                _nk = QCryptographicHash::hash(random_string(100).toUtf8(), QCryptographicHash::Sha256);
                _niv = QCryptographicHash::hash(random_string(100).toUtf8(), QCryptographicHash::Md5);
                _nap = QCryptographicHash::hash(random_string(100).toUtf8(), QCryptographicHash::Sha256).toHex();
                // _nivps = QCryptographicHash::hash((_iv.toHex() + _ps).toUtf8(), QCryptographicHash::Md5);

                outJSON.put("k", _nk.toHex().toStdString());
                outJSON.put("iv", _niv.toHex().toStdString());
                outJSON.put("p", _nap.toStdString());

                std::stringstream ss;

                pt::write_json(ss, outJSON, false);

                payload = ss.str();

                qCritical() << "API Response:" << QString::fromStdString(payload);

                payload = encryption.encode(QString::fromStdString(payload).toUtf8(), _lk, _livps).toBase64().toStdString();

            } else {
                qCritical() << "Key doesn't match" << QString::fromStdString(_jk) << "!=" << _k.toBase64();
                return;
            }

            // qCritical() << "Encoded API response:" << QString::fromStdString(payload);

            *response << "HTTP/1.1 200 OK\r\n"
                << "Content-Type: application/octet-stream" << "\r\n"
                << "Content-Length: " << payload.length() << "\r\n\r\n"
                << payload;
        } catch(const exception &e) {
            qCritical() << "Bad request" << e.what();
            return;
            // *response << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n"
            //     << e.what();
        }
    };

    server.resource["^/(.+)$"]["GET"] = [](shared_ptr<HttpServer::Response> response, shared_ptr<HttpServer::Request> request) {

        if (request->path_match[1].str() != _p.toStdString()) {
            return;
        }

        // qCritical() << QString::fromStdString(request->path);
        // qCritical() << QString::fromStdString(request->path_match[1].str());

        regex re("^/" + request->path_match[1].str());
  
        string strPath = regex_replace(request->path, re, "/");
        
        try {
            auto web_root_path = boost::filesystem::canonical("src/mgrc/public");
            auto path = boost::filesystem::canonical(web_root_path / strPath);
            // Check if path is within web_root_path
            if(distance(web_root_path.begin(), web_root_path.end()) > distance(path.begin(), path.end()) ||
                !equal(web_root_path.begin(), web_root_path.end(), path.begin()))
            throw invalid_argument("path must be within root path");
            if(boost::filesystem::is_directory(path))
            path /= "index.html";

            SimpleWeb::CaseInsensitiveMultimap header;

            // Uncomment the following line to enable Cache-Control
            // header.emplace("Cache-Control", "max-age=86400");

            auto ifs = make_shared<ifstream>();
            ifs->open(path.string(), ifstream::in | ios::binary | ios::ate);

            if(*ifs) {
                auto length = ifs->tellg();
                ifs->seekg(0, ios::beg);

                header.emplace("Content-Length", to_string(length));
                response->write(header);
                
                FileServer::read_and_send(response, ifs);
            } else {
                throw invalid_argument("could not read file");
            }
        } catch(const exception &e) {
            response->write(SimpleWeb::StatusCode::client_error_bad_request, "Could not open path " + request->path);
        }
    };

    server.on_error = [](shared_ptr<HttpServer::Request> /*request*/, const SimpleWeb::error_code & /*ec*/) {
        // Handle errors here
        // Note that connection timeouts will also call this handle with ec set to SimpleWeb::errc::operation_canceled
    };

    mgrc::server_thread = std::thread([]() {
        // Start server
        server.start([](unsigned short port) {
            started = true;
            qInfo() << "mgrc: Started";
        });
    });
}

Q_INVOKABLE void mgrc::stop() {
    if (!started) {
        return;
    }
    server.stop();
    server_thread.detach();
    started = false;
    // cout << "Server stopped" << endl;
    qInfo() << "mgrc: Stopped";
}

Q_INVOKABLE QString mgrc::getPublicIPJSON() {

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
        { "diagnostic.opendns.com", "/myip" },
        { "checkip.amazonaws.com", "/" }
    };
    
    // Loop through servers and try each one until IP is found
    for (vector<string> serverURL : serverURLs) {
        qInfo() << "mgrc: Fetching public IP from:" << serverURL[0].c_str();
        HttpsClient client(serverURL[0], false);
        try {
            auto r1 = client.request("GET", serverURL[1]);
            strIP = QString::fromStdString(r1->content.string());
            qInfo() << "mgrc: Fetched public IP:" << strIP;
            break;
        } catch (const SimpleWeb::system_error &e) {
            // Continue to the next URL
        }
    }

    if (QString::compare(strIP, "", Qt::CaseInsensitive) == 0) {
        qWarning() << "mgrc: Fetch public IP failed. Please check your internet connection or the server host list. Using localhost instead.";
        strIP = "localhost";
    }

    return strIP;

}

Q_INVOKABLE int mgrc::getPort() {
    return server.config.port;
}

Q_INVOKABLE QString mgrc::testEncrypt() {

    QAESEncryption encryption(QAESEncryption::AES_256, QAESEncryption::CBC, QAESEncryption::Padding::PKCS7);

    pt::ptree outJSON;

    // if (strCS == "")
    //     strCS = random_string(10);
    _ps = random_string(6);
    _p = random_string(10);
    // Use same path for API until new path is generated
    _ap = _p;
    _k = QCryptographicHash::hash(_ps.toUtf8(), QCryptographicHash::Sha256);
    _iv = QCryptographicHash::hash(_ps.toUtf8(), QCryptographicHash::Md5);
    
    QByteArray _ivps = QCryptographicHash::hash((_iv.toHex() + _ps).toUtf8(), QCryptographicHash::Md5);

    outJSON.put("k", _k.toHex().toStdString());

    qCritical() << "PS - Pairing string: " << _ps << endl;
    qCritical() << "P - Path: " << _p << endl;
    qCritical() << "K - key: " << _k.toHex() << endl;
    qCritical() << "IV - iv: " << _iv.toHex() << endl;
    qCritical() << "IVPS - ivps: " << _ivps.toHex() << endl;

    QByteArray encodeText = encryption.encode(_ps.toLocal8Bit(), _k, _ivps);
    //QByteArray encodeKey = encryption.encode(_k.toLocal8Bit(), _k, _iv);
    // QByteArray decodeText = encryption.decode(encodeText, hashCK, hashCIV);

    std::stringstream ss;

    pt::write_json(ss, outJSON, false);

    string strJSON = ss.str();

    boost::trim(strJSON);

    string estrJSON = encryption.encode(QString::fromStdString(strJSON).toUtf8(), _k, _ivps).toBase64().toStdString();

    // QByteArray encodeText = encryption.encode(jsonOutput.toLocal8Bit(), hashKey, hashIV);
    QByteArray decodeText = encryption.decode(encodeText, _k, _ivps);

    QString decodedString = QString(encryption.removePadding(decodeText));
    // QString decodedString = decodeText;

    qCritical() << "Plain json payload w/ key:" << QString::fromStdString(strJSON);
    qCritical() << "Encoded key base64:" << QString::fromStdString(estrJSON);
    qCritical() << "Encoded text hex:" << encodeText.toHex();
    qCritical() << "Encoded text base64:" << QString(encodeText.toBase64());
    qCritical() << "Decoded text:" << decodedString;

    qCritical() << _p + "#" + QString(encodeText.toBase64());

    return _p + "#" + QString(encodeText.toBase64());
}
