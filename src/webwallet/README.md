# Monero GUI - Web wallet

## Overview
A secure web app extension of the Monero GUI desktop app. 

## Security

The app utilizes [AES-256 encryption](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) to secure [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) communication between client and server without requiring the app to use [HTTPS](https://en.wikipedia.org/wiki/HTTPS), digital certificates, registered domains or static IP addresses. This makes it easier for users to host the web app from their own computer, reducing the need to trust remote hosts running closed source software. The following process explains how this is done:

1. **Scan QR Code** - The user scans a [QR code](https://en.wikipedia.org/wiki/QR_code) generated from the Monero GUI which opens the web wallet in the user's web browser.

2. **Enter 6 character pairing code** - The user enters a pairing code shown from the desktop app to decrypt the hash stored in the URL from step 1 and every subsequent API request and response.

3. **Single use requests** - Along with using the 6 character pairing code as an input parameter to decrypt responses, new key seeds used for all encryption parameters are automatically generated every 3 seconds or with every request to avoid being stolen, reused or decrypted by brute force attacks.

## Dependencies

### Desktop (Server)
* [Simple-web-server](https://gitlab.com/eidheim/Simple-Web-Server)
* [QtAES](https://github.com/bricke/Qt-AES)

### Web wallet (Client)
* [jquery](https://github.com/jquery/jquery)
* [crypto-js](https://github.com/brix/crypto-js)
* [qrcodejs](https://github.com/davidshimjs/qrcodejs)

### Public IP discovery services
* [ipify](https://www.ipify.org/)
* [icanhazip](https://icanhazip.com/)
* [ipecho](https://ipecho.net/plain)
* [dnsomatic](https://myip.dnsomatic.com/)

---
Copyright &copy; 2022 - [The Monero Project](https://github.com/monero-project)