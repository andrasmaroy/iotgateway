package hu.u_szeged.inf.sed.mongo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.security.auth.callback.Callback;

public class MongoAuthenticateCallback implements Callback {

    private final Logger log = LoggerFactory.getLogger(MongoAuthenticateCallback.class);

    private boolean authenticated;

    public MongoAuthenticateCallback() {
        this.log.info("MongoAuthenticateCallback - constructor");
        this.authenticated = true;
    }

    /**
     * Returns true if client password matches expected password, false otherwise.
     * This state is set the server-side callback handler.
     */
    public boolean authenticated() {
        this.log.info("MongoAuthenticateCallback - authenticated");
        return this.authenticated;
    }

    /**
     * Sets the authenticated state. This is set by the server-side callback handler
     * by matching the client provided password with the expected password.
     *
     * @param authenticated true indicates successful authentication
     */
    public void authenticated(boolean authenticated) {
        this.log.info("MongoAuthenticateCallback - authenticated");
        this.authenticated = authenticated;
    }
}
