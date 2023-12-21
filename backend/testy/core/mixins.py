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
import mimetypes
from pathlib import Path
from typing import Optional, Tuple, Union

from django.conf import settings
from django.db.models.fields.files import FieldFile
from django.http import FileResponse, HttpResponse
from PIL import Image
from rest_framework import status
from rest_framework.response import Response


class MediaViewMixin:
    def retrieve_filepath(
        self,
        file: FieldFile,
        request,
        generate_thumbnail: bool = True,
        source_filename: Optional[str] = None
    ) -> Union[Response, FileResponse]:
        """
        Get filename to return in response, taking size from query parameters into account.

        Args:
            file: field file from model instance.
            request: user request.
            generate_thumbnail: defines if thumbnail with not existing parameters should be created or not.
            source_filename: content type and filename of downloaded object and not by processed filepath.

        Returns:
            FileResponse or Response with nginx redirection header depending on your config.
        """
        try:
            if source_filename:
                content_type, _ = mimetypes.guess_type(source_filename, strict=True)
            else:
                content_type, _ = mimetypes.guess_type(file.path, strict=True)
            is_attachment = 'image/' not in content_type
            old_path = Path(file.path)
            old_file_name = old_path.name
            new_file_name = self.get_filename(
                file.path,
                request,
                generate_thumbnail,
                is_attachment
            )
            return self.get_formatted_response(
                file,
                is_attachment,
                old_file_name != new_file_name,
                new_file_name,
                content_type,
                source_filename
            )
        except IOError:
            return Response(status=status.HTTP_404_NOT_FOUND)

    @staticmethod
    def get_formatted_response(
        file: FieldFile,
        is_attachment: bool,
        is_modified: bool,
        new_file_name: str,
        content_type: str,
        name_for_downloading: str,
    ) -> Union[Response, FileResponse]:
        """
        Get response to return for user.

        Args:
            file: field file from model instance.
            is_attachment: defines if media file should be returned as attachment or not.
            is_modified: defines if requested file is source or modified one (size params changed).
            new_file_name: name of a new file.
            content_type: type of media.
            name_for_downloading: name for a file that will be downloaded.

        Returns:
            Response or File response depending on config parameters.
        """
        content_disposition = 'attachment' if is_attachment else 'inline'
        if name_for_downloading:
            content_disposition = f'{content_disposition}; filename={name_for_downloading}'
        if settings.TESTY_ALLOW_FILE_RESPONSE:
            if not is_modified:
                return FileResponse(file, as_attachment=is_attachment, content_type=content_type)
            new_parts = Path(file.path).parts[:-1] + (new_file_name,)
            new_file_path = Path(*new_parts)
            with open(new_file_path, 'rb') as new_file:
                file_data = new_file.read()
            response = HttpResponse(file_data, content_type=content_type)
            response['Content-Disposition'] = content_disposition
            return response
        response = HttpResponse(content_type=content_type)
        response['Content-Disposition'] = content_disposition
        if not is_modified:
            response['X-Accel-Redirect'] = file.url
            return response
        new_url = Path(*Path(file.url).parts[:-1] + (new_file_name,))
        response['X-Accel-Redirect'] = new_url
        return response

    def get_filename(self, filepath: str, request, generate_thumbnail: bool, is_attachment: bool) -> str:
        """
        Get filename depending on parameters provided in user request, if file with provided files does not exist
        creates one if generate_thumbnail is set to True.

        Args:
            filepath: path to source file.
            request: user request.
            generate_thumbnail: defines if thumbnail with not existing parameters should be created or not.

        Returns:
            Filename including extension as str.
        """
        old_path = Path(filepath)
        if is_attachment:
            return old_path.name
        generated = False
        full_image = Image.open(filepath)
        new_parts = list(old_path.parts[:-1])
        converted_suffix, width, height = self.get_modification_suffix_with_params(
            request,
        )
        new_parts.append(f'{old_path.stem}{converted_suffix}{old_path.suffix}')
        new_path = Path(*new_parts)
        if not generate_thumbnail:
            return new_path.name
        thumbnail = full_image.copy()
        if width or height:
            generated = True
            thumbnail.thumbnail(
                (width if width else thumbnail.width, height if height else thumbnail.height),
            )
        if generated:
            thumbnail.save(new_path)
        return new_path.name

    @staticmethod
    def get_modification_suffix_with_params(request) -> Union[Tuple[str, str, str], Tuple[str, int, int]]:
        """
        Get file suffix and image parameters based on size from request parameters.

        Args:
            request: user request
        Returns:
            Suffix to add at the end of src file name to find or create file and size parameters.
        """
        if width := request.query_params.get('width', ''):
            width = int(width)
        if height := request.query_params.get('height', ''):
            height = int(height)
        modification_params = (width, height)
        if not any(modification_params):
            return '', '', ''
        return f'@{width}x{height}', width, height
