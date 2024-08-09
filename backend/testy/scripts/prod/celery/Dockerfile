FROM python:3.11.9-alpine

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

RUN apk update && \
    apk add --virtual build-deps gcc musl-dev && \
    apk add postgresql-dev && \
    apk add netcat-openbsd &&  \
    apk add build-base python3-dev && \
    apk add libffi-dev && \
    apk add git

RUN mkdir /testy
WORKDIR /testy

COPY ./requirements/requirements.txt /testy/requirements/
COPY . /testy

RUN pip install -r requirements/requirements.txt

