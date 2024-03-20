# TestY TMS - Test Management System
# Copyright (C) 2023 KNS Group LLC (YADRO)
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# Also add information on how to contact you by electronic and paper mail.
#
# If your software can interact with users remotely through a computer
# network, you should also make sure that it provides a way for users to
# get its source.  For example, if your program is a web application, its
# interface could display a "Source" link that leads users to an archive
# of the code.  There are many ways you could offer source, and different
# solutions will be better for different programs; see section 13 for the
# specific requirements.
#
# You should also get your employer (if you work as a programmer) or school,
# if any, to sign a "copyright disclaimer" for the program, if necessary.
# For more information on this, and how to apply and follow the GNU AGPL, see
# <http://www.gnu.org/licenses/>.

import logging
import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.management.base import BaseCommand
from django.core.validators import validate_email

logger = logging.getLogger(__name__)
UserModel = get_user_model()


class Command(BaseCommand):
    help = 'Seeding default values in database: default superuser.'

    def handle(self, *args, **options) -> None:
        self.create_default_superuser()

    @classmethod
    def create_default_superuser(cls) -> None:
        username = os.environ.get('SUPERUSER_USERNAME', '')
        password = os.environ.get('SUPERUSER_PASSWORD', '')
        company_domain = settings.COMPANY_DOMAIN

        if not all([username, password, company_domain]):
            raise ImproperlyConfigured('Some of required parameters were not provided.')

        email = '{0}@{1}'.format(username, company_domain)
        try:
            validate_email(email)
        except ValidationError as err:
            raise ImproperlyConfigured(str(err))

        if UserModel.objects.exists():
            logger.info('Not creating default superuser')
        else:
            logger.info('Creating default superuser')
            UserModel.objects.create_superuser(username, email, password)
            logger.info(f'Default superuser created:\nusername:{username}\nemail: {email}\n')
