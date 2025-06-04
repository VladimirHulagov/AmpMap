from datetime import datetime

project = 'Testy'
copyright = f'{datetime.now().year}, KNS Group LLC (YADRO)'

# Версия и релиз
version = '2.1.0'

# Имя rst файла
master_doc = 'index'

# Язык
language = 'ru'

# Тема
html_theme = 'sphinx_rtd_theme'

# Логотип
html_logo = 'static/testy.svg'

# Фавикон
html_favicon = 'static/favicon.ico'

# Директория с файлами
html_static_path = ['static']

# Директория с Jinja шаблонами
templates_path = ['templates']

# Игнорируемые файлы
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# Нумерация рисунков
numfig = True



