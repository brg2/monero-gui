# Monero GUI remote control (MGRC)

Copyright &copy; 2022 - The Monero Project

## Table of Contents

  - [Overview](#overview)
  - [Security](#security)
    - [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
    - [Authenticated AES256-CBC encryption](#authenticated-aes256-cbc-encryption)
    - [Communication process](#communication-is-secured-using-the-following-process)
  - [3rd party repositories](#3rd-party-repositories)

## Overview
The Monero GUI remote control is a secure mobile web app for remotely controlling the Monero GUI desktop app. 

## Security

MGRC utilizes two-factor authentication (2FA) and AES256-CBC encryption to secure communications between itself and the GUI desktop app without requiring a SSL certificate or static IP address.

### Two-Factor Authentication (2FA)

Two forms of authentication are required to verify the user, one using QR codes scanned by the user's camera phone, and the other read from the desktop app screen.

### Authenticated AES256-CBC encryption

MGRC uses AES256-CBC to encrypt messages sent between server and client instead of relying on HTTPS and SSL inside the browser. By doing this, the user can more easily host the web app from their own computer hardware, instead of needing a registered domain or an authorized SSL certificate.

### Communication process

1. **Scan QR Code** - The user scans the QR code generated from the Monero GUI, which directs the user's browser to the remote control web app hosted from within the Monero GUI desktop app. The URL hash contains a unique API path name, AES256 encryption key and IV inside an encrypted payload encoded using Base64 (i.e http://67.200.243.119:1234/#IKcST4CbRgw5ipEZv+zaug).

2. **Enter 6 digit number** - The encrypted values from step 1 are unlocked using a random 6 digit number shown on the desktop app after the web app is loaded. Every subsequent API request and response is encrypted using a hash of this 6 digit number.

3. **Path, Key and Initial Vector shifting** - The path, key and IV values used for AES encryption are changed with every API request and sent along with each encrypted JSON response.

## 3rd party repositories:
* [Simple-web-server](https://gitlab.com/eidheim/Simple-Web-Server)
* [QtAES](https://github.com/bricke/Qt-AES)
