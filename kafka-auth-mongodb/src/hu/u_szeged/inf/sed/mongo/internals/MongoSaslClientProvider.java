package hu.u_szeged.inf.sed.mongo.internals;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.Provider;
import java.security.Security;

public class MongoSaslClientProvider extends Provider {

    private final Logger log = LoggerFactory.getLogger(MongoSaslClientProvider.class);

    private static final long serialVersionUID = 1L;

    @SuppressWarnings("deprecation")
    protected MongoSaslClientProvider() {
        super("SASL/MONGO Client Provider", 1.0, "SASL/MONGO Client Provider for Kafka");
        log.info("MongoSaslClientProvider - constructor");
        put("SaslClientFactory." + MongoSaslClient.MONGO_MECHANISM, MongoSaslClientFactory.class.getName());
    }

    public static void initialize() {
        LoggerFactory.getLogger(MongoSaslClientProvider.class).info("MongoSaslClientProvider - initialize");
        Security.addProvider(new MongoSaslClientProvider());
    }
}
