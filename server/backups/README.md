# MongoDB Database Backup System

This directory stores automated backups of your MongoDB database.

## Backup Format

Backups are stored as compressed archives with the naming format:

```portfolio-YYYY-MM-DDTHH-MM-SS.gz

```

## Backup Retention

By default, the system keeps the 5 most recent backups and automatically deletes older ones.

## Manual Backup

To manually trigger a backup:

```bash
node ../scripts/backupDatabase.js
```

## Restoring from Backup

To restore from a backup:

```bash
node ../scripts/restoreDatabase.js
```

This will:

1. Show you a list of available backups
2. Ask you to select which backup to restore
3. Confirm before proceeding with restoration
4. Restore the database from the selected backup

⚠️ **WARNING**: Restoration will overwrite the current database. Make sure you know what you're doing!

## Automated Backups

See `../scripts/setupBackupCron.js` for instructions on setting up automated backups using:

- Cron jobs (Linux/Mac)
- Task Scheduler (Windows)
- Cloud-based schedulers (Heroku, AWS, etc.)

## Backup Storage Best Practices

For production systems:

1. Store backups in multiple locations (not just on the same server)
2. Consider cloud storage options (AWS S3, Google Cloud Storage, etc.)
3. Encrypt sensitive backup data
4. Regularly test backup restoration processes
