#!/bin/sh
echo "Waiting for postgres..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"
python manage.py migrate --no-input
python manage.py seed_db
python manage.py collectstatic --no-input
gunicorn root.wsgi:application -c scripts/gunicorn.conf.py
