package hu.u_szeged.inf.sed.mongo.internals;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.security.auth.callback.CallbackHandler;
import javax.security.sasl.SaslClient;
import javax.security.sasl.SaslClientFactory;
import javax.security.sasl.SaslException;
import java.util.Map;

public class MongoSaslClientFactory implements SaslClientFactory {

    private final Logger log = LoggerFactory.getLogger(MongoSaslClientFactory.class);

    @Override
    public SaslClient createSaslClient(String[] strings, String s, String s1, String s2, Map<String, ?> configs, CallbackHandler callbackHandler) throws SaslException {
        this.log.info("MongoSaslClientFactory - createSaslClient");
        boolean supported = false;
        for (String mech : strings) {
            if (mech.equals(MongoSaslClient.MONGO_MECHANISM)) // Don't bother traversing the getMechanismNames output...
                supported = true;
        }
        if (!supported)
            throw new SaslException(String.format("Mechanism \'%s\' is not supported. Only MONGO is supported.", strings));

        return new MongoSaslClient(configs, callbackHandler);
    }

    @Override
    public String[] getMechanismNames(Map<String, ?> map) {
        this.log.info("MongoSaslClientFactory - getMechanismNames");
        return new String[]{MongoSaslClient.MONGO_MECHANISM};
    }
}
