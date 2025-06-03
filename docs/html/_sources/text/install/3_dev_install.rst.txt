.. _dev_install:

Development инсталляция
=======================

1. Скопируйте ``{testy_root}/.env.template`` в ``{testy_root}/.env``

2. Измените следующие переменные в скопированном файле ``{testy_root}/.env``

 - *VITE_APP_API_ROOT* - установите в http://127.0.0.1

3. Запустите TestY ``sudo docker compose -f docker-compose-dev.yml up``
(или ``docker compose -f docker-compose-dev.yml up`` если текущий пользователь залогинен как root).
Иногда для Windows при запуске может появляться ошибка ``entrypoint.sh: no such file or directory``.
Решение этой проблемы смотрите в разделе :ref:`known_problems`.

4. Дождитесь старта всех контейнеров.

.. code-block:: sh

     $ sudo docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
     NAMES             PORTS                    STATUS
     nginx             0.0.0.0:80->80/tcp       Up ** seconds
     notifications                              Up ** seconds
     testy_celery                               Up ** seconds (healthy)
     testy             0.0.0.0:8001->8000/tcp   Up ** seconds
     testy_pgbouncer   0.0.0.0:5436->5432/tcp   Up ** seconds (healthy)
     testy-frontend    0.0.0.0:3000->3000/tcp   Up ** seconds
     testy_db          0.0.0.0:5435->5432/tcp   Up ** seconds (healthy)
     testy_redis       0.0.0.0:6380->6379/tcp   Up ** seconds (healthy)


5. Откройте в браузере http://127.0.0.1 (не HTTPS!).
Используйте в качестве логина и пароля данные из ``{testy_root}/.env``, переменные *SUPERUSER_USERNAME* и *SUPERUSER_PASSWORD*

