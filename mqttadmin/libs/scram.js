const crypto = require('crypto');

const EQUAL_SIGN_REGEX = /=/g
const COMMA_SIGN_REGEX = /,/g

const HMAC_CLIENT_KEY = 'Client Key'
const HMAC_SERVER_KEY = 'Server Key'

class SCRAM {
  /**
   * Hi() is, essentially, PBKDF2 [RFC2898] with HMAC() as the
   * pseudorandom function (PRF) and with dkLen == output length of
   * HMAC() == output length of H()
   *
   * @returns {Buffer}
   */
  hi(password, salt, iterations, digestDefinition) {
      const mac = crypto.createHmac(digestDefinition.type, password)
      mac.update(salt);
      mac.update(Buffer.from('00000001', 'hex'));
      var u1 = mac.digest()
      var prev = u1
      var result = u1
      for (let i = 2; i <= iterations; i++) {
        var ui = this.HMAC(password, prev)
        result = this.xor(result, ui)
        prev = ui
      }
      return result
  }

  /**
   * Apply the exclusive-or operation to combine the octet string
   * on the left of this operator with the octet string on the right of
   * this operator.  The length of the output and each of the two
   * inputs will be the same for this use
   *
   * @returns {Buffer}
   */
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
  /**
   * @param {Connection} connection
   * @param {Logger} logger
   * @param {Function} saslAuthenticate
   * @param {DigestDefinition} digestDefinition
   */
  constructor(password) {
    this.digestDefinition = { length: 32, type: 'sha256', minIterations: 4096 }

    const digestType = this.digestDefinition.type.toUpperCase()
    this.PREFIX = `SASL SCRAM ${digestType} authentication`

    this.salt = '1dn3xv4cymyfoq8xp27pnbky88'
    this.generate(password)
  }

  generate(password) {
    const saltedPassword = this.saltPassword(password);
    const clientKey = this.clientKey(Buffer.from(saltedPassword));
    const storedKey = this.H(Buffer.from(clientKey));
    const serverKey = this.serverKey(saltedPassword);
    console.log({"SCRAM-SHA-256": { salt: Buffer.from(this.salt, 'utf8').toString('base64'), stored_key: storedKey, server_key: serverKey, iterations: 4096}})
  }

  saltPassword(password) {
    const salt = this.salt
    const iterations = 4096
    return this.hi(this.encodedPassword(password), salt, iterations, this.digestDefinition)
  }

  static sanitizeString(str) {
    return str.replace(EQUAL_SIGN_REGEX, '=3D').replace(COMMA_SIGN_REGEX, '=2C')
  }

  /**
   * @private
   */
  encodedPassword(password) {
    return SCRAM.sanitizeString(password).toString('utf-8')
  }

  /**
   * @private
   */
  H(data) {
    return crypto
      .createHash(this.digestDefinition.type)
      .update(data)
      .digest()
  }

  /**
   * @private
   */
  HMAC(key, data) {
    return crypto
      .createHmac(this.digestDefinition.type, key)
      .update(data)
      .digest()
  }

  clientKey(saltedPassword) {
    return this.HMAC(saltedPassword, HMAC_CLIENT_KEY)
  }

  serverKey(saltedPassword) {
    return this.HMAC(saltedPassword, HMAC_SERVER_KEY)
  }
};

module.exports = {
    SCRAM,
};
