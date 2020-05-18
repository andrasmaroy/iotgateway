package hu.u_szeged.inf.sed.mongo.internals;

import hu.u_szeged.inf.sed.mongo.MongoLoginModule;
import org.apache.kafka.common.security.JaasContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.login.AppConfigurationEntry;
import javax.security.sasl.SaslClient;
import javax.security.sasl.SaslException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class MongoSaslClient implements SaslClient {

    private final Logger log = LoggerFactory.getLogger(MongoSaslServer.class);
    public static final String MONGO_MECHANISM = "MONGO";
    static final String SEPARATOR = "\u0000";

    private final CallbackHandler callbackHandler;
    private final Map<String, ?> configs;
    private boolean complete;
    private String authorizationId;;

    public MongoSaslClient(Map<String, ?> configs, CallbackHandler callbackHandler) {
        this.log.info("MongoSaslClient - constructor");
        this.configs = configs;
        this.callbackHandler = callbackHandler;
    }

    @Override
    public String getMechanismName() {
        this.log.info("MongoSaslClient - getMechanismName");
        return MONGO_MECHANISM;
    }

    @Override
    public boolean hasInitialResponse() {
        this.log.info("MongoSaslClient - hasInitialResponse");
        return true;
    }

    @Override
    public byte[] evaluateChallenge(byte[] challenge) throws SaslException {
        /*
         * Message format (from https://tools.ietf.org/html/rfc4616):
         *
         * message   = [authzid] UTF8NUL authcid UTF8NUL passwd
         * authcid   = 1*SAFE ; MUST accept up to 255 octets
         * authzid   = 1*SAFE ; MUST accept up to 255 octets
         * passwd    = 1*SAFE ; MUST accept up to 255 octets
         * UTF8NUL   = %x00 ; UTF-8 encoded NUL character
         *
         * SAFE      = UTF1 / UTF2 / UTF3 / UTF4
         *                ;; any UTF-8 encoded Unicode character except NUL
         */
        if (complete) {
            throw new IllegalStateException("Mongo authentication already completed");
        }
        this.log.info("MongoSaslClient - evaluateChallenge");
        this.log.info("MongoSaslServer - challenge: " + new String(challenge, StandardCharsets.UTF_8));
        String response = String.format("%s%s%s%s%s", "foo", SEPARATOR, "foo", SEPARATOR, "client-secret");
        complete = true;
        // return new byte[0];
        return response.getBytes(Charset.forName("UTF-8"));
    }

    @Override
    public boolean isComplete() {
        this.log.info("MongoSaslClient - isComplete");
        return complete;
    }

    @Override
    public byte[] unwrap(byte[] incoming, int offset, int len) throws SaslException {
        this.log.info("MongoSaslClient - unwrap");
        if (!complete)
            throw new IllegalStateException("Authentication exchange has not completed");
        return Arrays.copyOfRange(incoming, offset, offset + len);
    }

    @Override
    public byte[] wrap(byte[] outgoing, int offset, int len) throws SaslException {
        this.log.info("MongoSaslClient - wrap");
        if (!complete)
            throw new IllegalStateException("Authentication exchange has not completed");
        return Arrays.copyOfRange(outgoing, offset, offset + len);
    }

    @Override
    public Object getNegotiatedProperty(String propName) {
        this.log.info("MongoSaslClient - getNegotiatedProperty");
        return null;
    }

    @Override
    public void dispose() throws SaslException {
        this.log.info("MongoSaslClient - dispose");
        complete = false;
    }
}
