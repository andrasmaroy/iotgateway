package hu.u_szeged.inf.sed.mongo.internals;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.Provider;
import java.security.Security;

public class MongoSaslServerProvider extends Provider {

    private final Logger log = LoggerFactory.getLogger(MongoSaslServerProvider.class);

    private static final long serialVersionUID = 1L;

    @SuppressWarnings("deprecation")
    protected MongoSaslServerProvider() {
        super("SASL/MONGO Server Provider", 1.0, "SASL/Mongo Server Provider for Kafka");
        log.info("MongoSaslServerProvider - constructor");
        put("SaslServerFactory." + MongoSaslServer.MONGO_MECHANISM, MongoSaslServerFactory.class.getName());
    }

    public static void initialize() {
        LoggerFactory.getLogger(MongoSaslServerProvider.class).info("MongoSaslServerProvider - initialize");
        Security.addProvider(new MongoSaslServerProvider());
    }
}
