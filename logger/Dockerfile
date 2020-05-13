FROM python:3

RUN pip3 install kafka-python pymongo

ADD logger.py /

CMD [ "python", "-u", "logger.py" ]



