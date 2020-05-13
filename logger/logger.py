from kafka import KafkaConsumer
import pymongo
from datetime import datetime


print("Connecting to mongodb://logdb:27017/")
mongo_client = pymongo.MongoClient("mongodb://logdb:27017/")
print("Connected to logdb")

consumer = KafkaConsumer(
        bootstrap_servers='broker:9092',
        security_protocol='SASL_PLAINTEXT',
        sasl_mechanism='SCRAM-SHA-256',
        sasl_plain_username='iotgatewaylogger',
        sasl_plain_password='iotgatewaylogpass')
consumer.subscribe(pattern='.*')
try:
    while True:
        msg = consumer.poll(0.1)
        for message in consumer:
            # message value and key are raw bytes -- decode if necessary!
            # e.g., for unicode: `message.value.decode('utf-8')`
            print("on_message "+message.topic+" "+str(message.value))
            log_dict = {"datetime": datetime.now(), "topic": message.topic, "payload": str(message.value)}
            mongo_client['logdb']['logs'].insert_one(log_dict)
            print("saved to logdb "+message.topic+" "+str(message.value))

except KeyboardInterrupt:
    pass

finally:
    consumer.close()
