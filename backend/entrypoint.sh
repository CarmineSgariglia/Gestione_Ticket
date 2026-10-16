#!/bin/sh
set -e

echo "Attesa avvio database PostgreSQL..."
python -c "
import os, time, psycopg
host = os.environ.get('POSTGRES_HOST', 'db')
port = os.environ.get('POSTGRES_PORT', '5432')
user = os.environ.get('POSTGRES_USER', 'gestionale_user')
password = os.environ.get('POSTGRES_PASSWORD', 'gestionale_pass')
dbname = os.environ.get('POSTGRES_DB', 'gestionale_db')
for i in range(30):
    try:
        conn = psycopg.connect(host=host, port=port, user=user, password=password, dbname=dbname)
        conn.close()
        print('Database PostgreSQL connesso!')
        break
    except Exception as e:
        print(f'Tentativo {i+1}/30: database non ancora pronto ({e})...')
        time.sleep(2)
"

echo "Esecuzione migrazioni database..."
python manage.py makemigrations core --noinput
python manage.py migrate --noinput

echo "Raccolta file statici Django..."
python manage.py collectstatic --noinput

echo "Popolamento iniziale database (seed_data)..."
python manage.py seed_data

echo "Avvio server Gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
