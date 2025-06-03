from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0027_alter_notificationsetting_action_code'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                "CREATE INDEX idx_content_object_history_id ON core_historicallabeleditem (content_object_history_id);",
                "CREATE INDEX idx_history_type ON core_historicallabeleditem (history_type);",
                "CREATE INDEX idx_history_date ON core_historicallabeleditem (history_date);",
            ],
            reverse_sql=[
                "DROP INDEX if exists idx_content_object_history_id;",
                "DROP INDEX if exists idx_history_type;",
                "DROP INDEX if exists idx_history_date;",
            ],
        ),
    ]
