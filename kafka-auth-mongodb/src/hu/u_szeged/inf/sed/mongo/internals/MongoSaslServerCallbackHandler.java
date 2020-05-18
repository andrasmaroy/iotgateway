package hu.u_szeged.inf.sed.mongo.internals;

import hu.u_szeged.inf.sed.mongo.MongoAuthenticateCallback;
import org.apache.kafka.common.security.auth.AuthenticateCallbackHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.security.auth.callback.Callback;
import javax.security.auth.callback.UnsupportedCallbackException;
import javax.security.auth.login.AppConfigurationEntry;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class MongoSaslServerCallbackHandler implements AuthenticateCallbackHandler {

    private final Logger log = LoggerFactory.getLogger(MongoSaslServerCallbackHandler.class);

    private List<AppConfigurationEntry> jaasConfigEntries;

    @Override
    public void configure(Map<String, ?> configs, String mechanism, List<AppConfigurationEntry> jaasConfigEntries) {
        this.log.info("MongoServerCallbackHandler - configure");
        this.jaasConfigEntries = jaasConfigEntries;
    }

    @Override
    public void close() {
        this.log.error("MongoServerCallbackHandler - close");
    }

    @Override
    public void handle(Callback[] callbacks) throws IOException, UnsupportedCallbackException {
        this.log.info("MongoServerCallbackHandler - handle");
        for (Callback callback : callbacks) {
            if (callback instanceof MongoAuthenticateCallback) {
                MongoAuthenticateCallback mongoCallback = (MongoAuthenticateCallback) callback;
                mongoCallback.authenticated(true);
            }
        }
    }
}
