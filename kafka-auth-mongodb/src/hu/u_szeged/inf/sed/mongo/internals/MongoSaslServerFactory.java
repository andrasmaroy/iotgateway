package hu.u_szeged.inf.sed.mongo.internals;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.security.auth.callback.CallbackHandler;
import javax.security.sasl.SaslException;
import javax.security.sasl.SaslServer;
import javax.security.sasl.SaslServerFactory;
import java.util.Map;

public class MongoSaslServerFactory implements SaslServerFactory {

    private final Logger log = LoggerFactory.getLogger(MongoSaslServerFactory.class);

    @Override
    public SaslServer createSaslServer(String mechanism, String protocol, String serverName, Map<String, ?> props, CallbackHandler callbackHandler) throws SaslException {
        this.log.info("MongoSaslServerFactory - createSaslServer");
        if (!MongoSaslServer.MONGO_MECHANISM.equals(mechanism))
            throw new SaslException(String.format("Mechanism \'%s\' is not supported. Only PLAIN is supported.", mechanism));

        return new MongoSaslServer(callbackHandler);
    }

    @Override
    public String[] getMechanismNames(Map<String, ?> props) {
        this.log.info("MongoSaslServerFactory - getMechanismNames");
        return new String[]{MongoSaslServer.MONGO_MECHANISM};
    }
}
