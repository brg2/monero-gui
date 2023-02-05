# Monero GUI - Web wallet

## Overview
A secure web app extension of the Monero GUI wallet. Created to replace the need to provide private keys or seed phrases for current Monero mobile wallets.

## Usage
1. Install the [Monero GUI](https://github.com/monero-project/monero-gui/releases) and sync it to the [Monero blockchain](https://www.getmonero.org/downloads/#blockchain).
2. Open and login to a wallet
3. Goto Settings > Interface
4. Enable the "Web wallet" checkbox
5. Scan the QR code with a mobile device to open the web wallet app in a browser
6. Enter the 6 character "Pairing code"
7. Tap the QR button to scan a merchant's QR address code
8. Enter an amount to send or tap the infinity button to use your wallet's full balance.
9. Tap "Send"
10. Confirm and you're done!

*Note: Only one web wallet is allowed to connect at a time. Clicking the "Refresh" button will create a new connection while stopping any currently running connections.*

## Security

* **AES-256** - Along with using random API endpoint paths, pairing codes and server port numbers, the app utilizes [AES-256 encryption](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) to secure [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) communication between the client and server without requiring the use of [HTTPS](https://en.wikipedia.org/wiki/HTTPS), digital certificates, registered domains or static IP addresses. This makes it easier for users to host the web app from their own computer, reducing the need to trust remote hosts running closed source software that could track and/or sell their information.

* **Client-side hash strings** - All information used to restore app connections is stored, visible and accessible only to the client in the hash string of the app URL.

* **Single-use keys** - New key seeds used for all encryption parameters are automatically generated every 3 seconds or with every request to avoid being stolen, reused or decrypted by brute force attacks.

* **Pairing codes** - Known only by the desktop app and the user, this decrypts keys in the app URL and all app communication.

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
Copyright &copy; 2023 - [The Monero Project](https://github.com/monero-project)