from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tests_description', '0023_is_archive_for_history'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                "CREATE INDEX idx_historicaltestcase_id_history ON tests_description_historicaltestcase(id, history_id DESC);",
            ],
            reverse_sql=[
                "DROP INDEX idx_historicaltestcase_id_history;",
            ],
        ),
    ]
