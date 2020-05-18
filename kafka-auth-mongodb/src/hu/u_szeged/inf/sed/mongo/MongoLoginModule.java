package hu.u_szeged.inf.sed.mongo;

import hu.u_szeged.inf.sed.mongo.internals.MongoSaslClientProvider;
import hu.u_szeged.inf.sed.mongo.internals.MongoSaslServerCallbackHandler;
import hu.u_szeged.inf.sed.mongo.internals.MongoSaslServerProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.security.auth.Subject;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.login.LoginException;
import javax.security.auth.spi.LoginModule;
import java.util.Map;

public class MongoLoginModule implements LoginModule {

    private final Logger log = LoggerFactory.getLogger(MongoLoginModule.class);
    private MongoSaslServerCallbackHandler cbh;

    static {
        MongoSaslServerProvider.initialize();
        MongoSaslClientProvider.initialize();
    }

    @Override
    public void initialize(Subject subject, CallbackHandler callbackHandler, Map<String, ?> sharedState, Map<String, ?> options) {
        this.log.info("MongoLoginModule - initialize");
    }

    @Override
    public boolean login() throws LoginException {
        this.log.info("MongoLoginModule - login");
        return true;
    }

    @Override
    public boolean commit() throws LoginException {
        this.log.info("MongoLoginModule - commit");
        return true;
    }

    @Override
    public boolean abort() throws LoginException {
        this.log.info("MongoLoginModule - abort");
        return false;
    }

    @Override
    public boolean logout() throws LoginException {
        this.log.info("MongoLoginModule - logout");
        return true;
    }
}
