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
from operator import methodcaller
from typing import Any, Optional

from django.apps import AppConfig
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from packaging import version
from pluggy import HookimplMarker, HookspecMarker
from rest_framework.request import Request
from rest_framework.reverse import reverse

hookspec = HookspecMarker('testy')
hookimpl = HookimplMarker('testy')

URLS_SENTINEL = object()


class TestyPluginConfig(AppConfig):
    package_name: Optional[str] = None
    verbose_name: str = ''
    description: str = ''
    version: str = ''
    plugin_base_url: str = ''
    author: str = ''
    author_email: str = ''
    middlewares: Optional[list[str]] = None
    min_version: Optional[str] = None
    max_version: Optional[str] = None
    index_reverse_name: Optional[str] = None
    urls_module: Optional[str] = None
    _validators = [
        '_validate_package_name',
        '_validate_urls_module',
        '_validate_min_version',
        '_validate_max_version',
    ]

    @classmethod
    def is_valid(cls) -> bool:
        for validator_name in cls._validators:
            call_validator = methodcaller(validator_name)
            call_validator(cls)
        return True

    @classmethod
    def verbose_dict(cls, request: Optional[Request] = None) -> dict[str, Any]:
        plugin_dict = {
            'Name': cls.verbose_name,
            'Package': cls.package_name,
            'Author': cls.author,
            'Author email': cls.author_email,
            'Description': cls.description,
            'Version': cls.version,
        }
        if cls.index_reverse_name and request and cls.urls_module is not URLS_SENTINEL:
            plugin_dict['Plugin index'] = request.build_absolute_uri(
                reverse(f'plugins:{cls.package_name}:{cls.index_reverse_name}'),
            )
        return plugin_dict

    @classmethod
    def _validate_package_name(cls):
        if not cls.package_name:
            raise ImproperlyConfigured('Please provide valid package name')

    @classmethod
    def _validate_urls_module(cls):
        if cls.urls_module is None:
            raise ImproperlyConfigured(
                'Please provide valid python module import path as string in format "package_name.api.urls" '
                'or set urls_module to URLS_SENTINEL if your plugin doesnt provide any urls.\n'
                f'Source of error is {cls.package_name}',
            )

    @classmethod
    def _validate_min_version(cls):
        if cls.min_version is None:
            return
        if version.parse(settings.VERSION) < version.parse(cls.min_version):
            raise ImproperlyConfigured(
                f'Plugin "{cls.package_name}" requires min version {cls.min_version} of TestY.\n'
                f'Source of error is {cls.package_name}',
            )

    @classmethod
    def _validate_max_version(cls):
        if cls.max_version is None:
            return
        if version.parse(settings.VERSION) < version.parse(cls.min_version):
            raise ImproperlyConfigured(
                f'Plugin {cls.package_name} requires max version {cls.max_version} of TestY.'
                f'Source of error is {cls.package_name}',
            )


class PluginEntrypointHookSpecs:

    @hookspec
    def config(self) -> type[TestyPluginConfig]:
        """Get plugin config class hook."""
