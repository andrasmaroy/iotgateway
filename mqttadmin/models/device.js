const Validator = require('jsonschema').Validator;
const Zookeeper = require('node-zookeeper-client');
const scram = require('../libs/scram');

async function count() {
    return new Promise((resolve, reject) => {
        var client = Zookeeper.createClient('host.docker.internal:2181');

        client.once('connected', function () {
            client.getChildren('/config/users', function(error, children) {
                if (error) {
                    reject(error);
                }
                resolve(children.length);
                client.close();
            });
        });
        client.connect();
    });
}

async function list() {
    return new Promise((resolve, reject) => {
        var client = Zookeeper.createClient('host.docker.internal:2181');

        client.once('connected', function () {
            client.getChildren('/config/users', function(error, children) {
                if (error) {
                    reject(error);
                }
                entities = []
                children.forEach((child) => {
                    entities.push({"name": child, "type": "zookeeper", "url": "/device/" + child})
                })
                resolve(entities);
                client.close();
            });
        });
        client.connect();
    });
}

async function findById(id) {
    return new Promise((resolve, reject) => {
        var client = Zookeeper.createClient('host.docker.internal:2181');
        var promises = []

        client.once('connected', function () {
            client.getChildren('/kafka-acl/Topic', function(error, children) {
                if (error) {
                    reject(error);
                }
                children.forEach((child) => {
                    console.log("getting /kafka-acl/Topic/%s", child);
                    promises.push(new Promise((resolve, reject) => {
                        client.getData('/kafka-acl/Topic/' + child, function(error, data) {
                            acl = JSON.parse(data.toString('utf8'))
                            if (error) {
                                console.log("failed to get /kafka-acl/Topic/%s", child)
                                console.log(error)
                            }
                            var topics = {}
                            acl.acls.filter(acl => acl.principal === "User:" + id).forEach((rule) => {
                                if (rule.operation !== "Read" && rule.operation !== "Write") {
                                    return
                                }
                                if (child in topics) {
                                    topics[child] = "rw"
                                } else if (rule.operation === "Read") {
                                    topics[child] = "r"
                                } else if (rule.operation === "Write") {
                                    topics[child] = "w"
                                }
                            })
                            resolve(topics)
                        })
                    }))
                })
            })
            client.getData('/config/users/' + id, function(error, data) {
                if (error) {
                    reject(error)
                }
                Promise.all(promises).then((values) => {
                    var topics = {}
                    values.forEach((topic) => {
                        Object.assign(topics, topic)
                    })
                    client.close();
                    resolve({"name": id, "type": "zookeeper", "url": "/device/" + id, "password": data.toString('utf8'), "topics": topics, "superuser": false})
                })
            });
        });
        client.connect();
    })
}

async function remove(id) {
    return new Promise((resolve, reject) => {
        var client = Zookeeper.createClient('host.docker.internal:2181');

        client.once('connected', function () {
            client.remove('/config/users/' + id, function(error, data) {
                if (error) {
                    reject(error)
                }
                resolve()
                client.close();
            });
        });
        client.connect();
    })
}

class Device {
    constructor(data) {
        var v = new Validator();
        var schema = {
            name: {type: String},
            type: {type: String},
            password: {type: String},
            topics: {type: Object}, // { "public/#" : "r", "/device/bar/foo/#" : "rw" }
            superuser: {type: Boolean},
            required: ["name", "password"]
        };
        var result = v.validate(data, schema, {throwError: true});
        Object.assign(this, result.instance);
        this.url = "/device/" + this.name;
        this.scramuser = new scram.SCRAM(this.password, 4096);
        return this;
    }

    async updateacl(topics, name, topic) {
        return new Promise((resolve, reject) => {
            var client = Zookeeper.createClient('host.docker.internal:2181');
            client.once('connected', function () {
                console.log('Connected to the server.');
                client.exists('/kafka-acl/Topic/' + topic, function(error, aclstat) {
                    if (aclstat) {
                        console.log('Topic \'/kafka-acl/Topic/' + topic + '\' exists, getting data');
                        client.getData('/kafka-acl/Topic/' + topic, function(error, data) {
                            var acl = JSON.parse(data.toString('utf8'))
                            console.log(acl)
                            if (topics[topic] === 'r' || topics[topic] === 'rw') {
                                acl.acls.push({"principal": "User:" + name, "permissionType": "Allow", "operation": "Read", "host": "*"})
                            } else if (topics[topic] === 'w' || topics[topic] === 'rw') {
                                acl.acls.push({"principal": "User:" + name, "permissionType": "Allow", "operation": "Write", "host": "*"})
                            }
                            acl.acls.push({"principal": "User:" + name, "permissionType": "Allow", "operation": "Describe", "host": "*"})
                            console.log(JSON.stringify(acl));
                            client.setData('/kafka-acl/Topic/' + topic, Buffer.from(JSON.stringify(acl)), function(error, stat) {
                                if (error) {
                                    console.log('failed to set topic acl')
                                    console.log(error)
                                    client.close()
                                    reject();
                                }
                                console.log('Node: /kafka-acl/Topic/%s is successfully created.', topic);
                                client.close()
                                resolve();
                            })
                        });
                    } else {
                        console.log('Topic \'/kafka-acl/Topic/' + topic + '\' doesn\'t exist, creating');
                        var acl = {"version": 1, "acls": []}
                        if (topics[topic] === 'r' || topics[topic] === 'rw') {
                            acl.acls.push({"principal": "User:" + name, "permissionType": "Allow", "operation": "Read", "host": "*"})
                        }
                        if (topics[topic] === 'w' || topics[topic] === 'rw') {
                            acl.acls.push({"principal": "User:" + name, "permissionType": "Allow", "operation": "Write", "host": "*"})
                        }
                        acl.acls.push({"principal": "User:" + name, "permissionType": "Allow", "operation": "Describe", "host": "*"})
                        console.log(JSON.stringify(acl));
                        client.create('/kafka-acl/Topic/' + topic, Buffer.from(JSON.stringify(acl)), function(error) {
                            if (error) {
                                console.log('failed to set topic acl')
                                console.log(error)
                                client.close()
                                reject();
                            }
                            console.log('Node: /kafka-acl/Topic/%s is successfully created.', topic);
                            client.close()
                            resolve();
                        })
                    }
                });
            })
            client.connect();
        })
    }

    async save() {
        return new Promise((resolve, reject) => {
            var client = Zookeeper.createClient('host.docker.internal:2181');
            var path = "/config/users/" + this.name;
            var name = this.name;
            var type = this.type;
            var topics = this.topics;
            var scramuser = this.scramuser;
            var promises = []
            var updateacl = this.updateacl

            client.once('connected', function () {
                console.log('Connected to the server.');

                client.exists(path, function(error, stat) {
                    if (stat) {
                        client.setData(path, Buffer.from(JSON.stringify(scramuser)), function (error) {
                            if (error) {
                                console.log('Failed to create node: %s due to: %s.', path, error);
                                client.close();
                                reject(error);
                            } else {
                                console.log('Node: %s is successfully created.', path);
                                client.close();
                                resolve();
                            }
                        });
                    } else {
                        promises.push(new Promise((innerResolve, innerReject) => {
                            client.create(path, Buffer.from(JSON.stringify(scramuser)), function (error) {
                                if (error) {
                                    console.log('Failed to create node: %s due to: %s.', path, error);
                                    innerReject(error);
                                } else {
                                    console.log('Node: %s is successfully created.', path);
                                    innerResolve()
                                }
                            });
                        }))

                        for (var topic in topics) {
                            console.log(topic)
                            promises.push(updateacl(topics, name, topic))
                        }
                        Promise.all(promises).then(() => {
                            client.close();
                            resolve()
                        })
                    }
                });
            });

            client.connect();
        })
    }
};

module.exports = {
    Device,
    count,
    list,
    findById,
    remove,
};
