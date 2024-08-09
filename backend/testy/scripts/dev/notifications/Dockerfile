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
COPY . /testy
WORKDIR /testy
RUN pip install -r requirements/dev-requirements.txt

