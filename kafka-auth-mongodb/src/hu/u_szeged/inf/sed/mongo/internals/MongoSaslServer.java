package hu.u_szeged.inf.sed.mongo.internals;

import hu.u_szeged.inf.sed.mongo.MongoAuthenticateCallback;
import org.apache.kafka.common.errors.SaslAuthenticationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.security.auth.callback.Callback;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.callback.NameCallback;
import javax.security.sasl.SaslException;
import javax.security.sasl.SaslServer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class MongoSaslServer implements SaslServer {

    private final Logger log = LoggerFactory.getLogger(MongoSaslServer.class);
    public static final String MONGO_MECHANISM = "MONGO";

    private final CallbackHandler callbackHandler;
    private boolean complete;
    private String authorizationId;;

    public MongoSaslServer(CallbackHandler callbackHandler) {
        this.log.info("MongoSaslServer - constructor");
        this.callbackHandler = callbackHandler;
    }

    @Override
    public String getMechanismName() {
        this.log.info("MongoSaslServer - getMechanismName");
        return MONGO_MECHANISM;
    }

    @Override
    public byte[] evaluateResponse(byte[] responseBytes) throws SaslException {
        this.log.info("MongoSaslServer - evaluateResponse");
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

        String response = new String(responseBytes, StandardCharsets.UTF_8);
        this.log.info("MongoSaslServer - response: " + response);
        List<String> tokens = extractTokens(response);
        String authorizationIdFromClient = tokens.get(0);
        String username = tokens.get(1);
        String password = tokens.get(2);

        if (username.isEmpty()) {
            throw new SaslAuthenticationException("Authentication failed: username not specified");
        }
        if (password.isEmpty()) {
            throw new SaslAuthenticationException("Authentication failed: password not specified");
        }

        NameCallback nameCallback = new NameCallback("username", username);
        MongoAuthenticateCallback authenticateCallback = new MongoAuthenticateCallback();
        try {
            callbackHandler.handle(new Callback[]{nameCallback, authenticateCallback});
        } catch (Throwable e) {
            this.log.info("MongoSaslServer - callbackerror: " + e);
            e.printStackTrace();
            throw new SaslAuthenticationException("Authentication failed: credentials for user could not be verified", e);
        }
        if (!authenticateCallback.authenticated())
            throw new SaslAuthenticationException("Authentication failed: Invalid username or password");
        if (!authorizationIdFromClient.isEmpty() && !authorizationIdFromClient.equals(username))
            throw new SaslAuthenticationException("Authentication failed: Client requested an authorization id that is different from username");

        this.authorizationId = username;

        complete = true;
        return new byte[0];
    }

    private List<String> extractTokens(String string) {
        this.log.info("MongoSaslServer - extractTokens");
        List<String> tokens = new ArrayList<>();
        int startIndex = 0;
        for (int i = 0; i < 4; ++i) {
            int endIndex = string.indexOf("\u0000", startIndex);
            if (endIndex == -1) {
                tokens.add(string.substring(startIndex));
                break;
            }
            tokens.add(string.substring(startIndex, endIndex));
            startIndex = endIndex + 1;
        }
        this.log.info("MongoSaslServer - tokens: " + tokens);

        if (tokens.size() != 3)
            throw new SaslAuthenticationException("Invalid SASL/PLAIN response: expected 3 tokens, got " +
                    tokens.size());

        return tokens;
    }

    @Override
    public boolean isComplete() {
        this.log.info("MongoSaslServer - isComplete");
        return complete;
    }

    @Override
    public String getAuthorizationID() {
        this.log.info("MongoSaslServer - getAuthorizationID");
        if (!complete) {
            this.log.info("MongoSaslServer - Authentication exchange has not completed");
            throw new IllegalStateException("Authentication exchange has not completed");
        }
        return authorizationId;
    }

    @Override
    public byte[] unwrap(byte[] incoming, int offset, int len) throws SaslException {
        this.log.info("MongoSaslServer - unwrap");
        if (!complete) {
            this.log.info("MongoSaslServer - Authentication exchange has not completed");
            throw new IllegalStateException("Authentication exchange has not completed");
        }

        return Arrays.copyOfRange(incoming, offset, offset + len);
    }

    @Override
    public byte[] wrap(byte[] outgoing, int offset, int len) throws SaslException {
        this.log.info("MongoSaslServer - wrap");
        if (!complete) {
            this.log.info("MongoSaslServer - Authentication exchange has not completed");
            throw new IllegalStateException("Authentication exchange has not completed");
        }

        return Arrays.copyOfRange(outgoing, offset, offset + len);
    }

    @Override
    public Object getNegotiatedProperty(String propName) {
        this.log.info("MongoSaslServer - getNegotiatedProperty");
        if (!complete) {
            this.log.info("MongoSaslServer - Authentication exchange has not completed");
            throw new IllegalStateException("Authentication exchange has not completed");
        }

        return null;
    }

    @Override
    public void dispose() throws SaslException {
        this.log.info("MongoSaslServer - dispose");
        complete = false;
    }
}
