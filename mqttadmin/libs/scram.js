const crypto = require('crypto');
const srs = require('secure-random-string')

const EQUAL_SIGN_REGEX = /=/g
const COMMA_SIGN_REGEX = /,/g

const HMAC_CLIENT_KEY = 'Client Key'
const HMAC_SERVER_KEY = 'Server Key'

class SCRAM {
    constructor(password, iterations) {
        const sha256 = this.generate(password, iterations, 'sha256')
        const sha512 = this.generate(password, iterations, 'sha512')
        return {"version": 1, "config": {"SCRAM-SHA-512": sha512, "SCRAM-SHA-256": sha256}}
    }

    generate(password, iterations, digestMethod) {
        const salt = srs({length: 25, alphanumeric: true}).toLowerCase()

        const saltedPassword = this.saltPassword(password, salt, iterations, digestMethod);
        const clientKey = this.clientKey(Buffer.from(saltedPassword), digestMethod);
        const storedKey = this.H(Buffer.from(clientKey), digestMethod);
        const serverKey = this.serverKey(saltedPassword, digestMethod);
        return `salt=${Buffer.from(salt).toString('base64')},stored_key=${Buffer.from(storedKey).toString('base64')},server_key=${Buffer.from(serverKey).toString('base64')},iterations=${iterations}`
    }

    saltPassword(password, salt, iterations, digestMethod) {
        return this.hi(this.encodedPassword(password), salt, iterations, digestMethod)
    }

    encodedPassword(password) {
        return this.sanitizeString(password).toString('utf-8')
    }

    sanitizeString(str) {
        return str.replace(EQUAL_SIGN_REGEX, '=3D').replace(COMMA_SIGN_REGEX, '=2C')
    }

    hi(password, salt, iterations, digestMethod) {
        const mac = crypto.createHmac(digestMethod, password)
        mac.update(salt);
        mac.update(Buffer.from('00000001', 'hex'));
        var u1 = mac.digest()
        var prev = u1
        var result = u1
        for (let i = 2; i <= iterations; i++) {
            var ui = this.HMAC(password, prev, digestMethod)
            result = this.xor(result, ui)
            prev = ui
        }
        return result
    }

    HMAC(key, data, digestMethod) {
        return crypto
            .createHmac(digestMethod, key)
            .update(data)
            .digest()
    }

    xor(left, right) {
        const bufferA = Buffer.from(left)
        const bufferB = Buffer.from(right)
        const length = Buffer.byteLength(bufferA)

        const result = []
        for (let i = 0; i < length; i++) {
            result.push(bufferA[i] ^ bufferB[i])
        }

        return Buffer.from(result)
    }

    clientKey(saltedPassword, digestMethod) {
        return this.HMAC(saltedPassword, HMAC_CLIENT_KEY, digestMethod)
    }

    H(data, digestMethod) {
        return crypto
            .createHash(digestMethod)
            .update(data)
            .digest()
    }

    serverKey(saltedPassword, digestMethod) {
        return this.HMAC(saltedPassword, HMAC_SERVER_KEY, digestMethod)
    }
};

module.exports = {
    SCRAM,
};
