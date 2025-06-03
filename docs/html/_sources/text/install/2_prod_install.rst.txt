.. _prod_install:

Production инсталляция
======================

1. Перейдите в директорию ``{testy_root}/nginx`` и запустите ``make_ssl.sh`` для создания самоподписанных SSL сертификатов для протокола HTTPS.
Проверьте, что файлы сертификатов появились в текущей директории

2. Скопируйте ``{testy_root}/.env.template`` в ``{testy_root}/.env``

3. Измените следующие переменные в скопированном файле ``{testy_root}/.env``:

 - *SECRET_KEY* - секретный ключ
 - *SUPERUSER_USERNAME* - имя (логин) администратора TestY
 - *SUPERUSER_PASSWORD* - пароль администратора TestY
 - *VITE_APP_API_ROOT*  - TestY url. Если планируется использовать доменное имя,
   то нужно его тут указать (например, https://testy.mycompany.ru). В противном случае укажите IP адрес
   (например, https://100.99.88.77)

4. Запустите TestY ``sudo docker compose up`` (или ``docker compose up`` если текущий пользователь залогинен как root).
Иногда для Windows при запуске может появляться ошибка ``entrypoint.sh: no such file or directory``.
Решение этой проблемы смотрите в разделе :ref:`known_problems`.

5. Дождитесь старта всех контейнеров.

.. code-block:: sh

    $ sudo docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
    NAMES             PORTS                                      STATUS
    nginx             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp   Up ** seconds
    notifications                                                Up ** seconds
    testy             0.0.0.0:8001->8000/tcp                     Up ** seconds
    testy_celery                                                 Up ** seconds (healthy)
    testy_pgbouncer   0.0.0.0:5436->5432/tcp                     Up ** seconds (healthy)
    testy_db          0.0.0.0:5435->5432/tcp                     Up ** seconds (healthy)
    testy_redis       0.0.0.0:6380->6379/tcp                     Up ** seconds (healthy)

*Замечание: контейнер* ``testy-frontend`` *завершает работу в течении нескольких секунд после запуска.
Это ожидаемое поведение, контейнер требуется только для сборки frontend приложения в виде статичного JS файла.*

6. Откройте в браузере URL, указанный в п.3 в переменной *VITE_APP_API_ROOT*.
Используйте в качестве логина и пароля данные из п.3, переменные *SUPERUSER_USERNAME* и *SUPERUSER_PASSWORD*

Рекомендации к production инсталляции
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- Используйте нормальные (не самоподписанные) сертификаты
- Измените *VOLUMES_PATH* чтобы при повторном деплое системы сохранить данные
- Используйте не дефолтные логин и пароль для доступа в PostgreSQL
- Измените логин и пароль администратора
- Установите переменную *HOST_NAME* переменную для nginx в ``{testy_root}/.env``
- Если окружение поддерживает работу docker для не-root пользователя, то требуется указать в переменной окружения *UID* пользователя
- В случае если вы перенесли TestY в собственный репозиторий (сделали fork), то измените
  *VITE_APP_REPO_URL, VITE_APP_BUG_REPORT_URL* in ``{testy_report}/.env``, чтобы указать
  ссылки на репозиторий и ссылку на bug tracker систему
