/**
 * This script demonstrates how to set up automated database backups
 *
 * For Unix/Linux/Mac systems:
 * 1. Install the script as a cron job:
 *    - Open crontab: `crontab -e`
 *    - Add a line like this to run daily at 2 AM:
 *      0 2 * * * node /path/to/your/server/scripts/backupDatabase.js >> /path/to/backup-logs.log 2>&1
 *
 * For Windows systems:
 * 1. Use Windows Task Scheduler:
 *    - Open Task Scheduler
 *    - Create a new task
 *    - Set trigger to run daily at 2 AM
 *    - Set action to run: node.exe
 *    - Add arguments: "C:\\path\\to\\your\\server\\scripts\\backupDatabase.js"
 *
 * Cloud deployment options:
 * - If deployed on cloud platforms like Heroku or AWS:
 *   - Use platform-specific scheduled tasks (Heroku Scheduler, AWS CloudWatch Events)
 *   - Consider storing backups in cloud storage (S3, Google Cloud Storage)
 *
 * Important Note:
 * MongoDB Atlas (cloud-hosted MongoDB) includes automatic backups in paid tiers.
 * If you're using MongoDB Atlas, you might not need this script.
 */

console.log(`
===== Database Backup Configuration Guide =====

For Unix/Linux/Mac systems:
1. Install the script as a cron job by running:
   crontab -e

2. Add a line like this to run daily at 2 AM:
   0 2 * * * node ${__dirname}/backupDatabase.js >> ${__dirname}/../logs/backup-logs.log 2>&1

For Windows systems:
1. Open Command Prompt as Administrator
2. Run this command to create a scheduled task:
   schtasks /create /sc DAILY /tn "PortfolioDBBackup" /tr "node ${__dirname}\\backupDatabase.js" /st 02:00

Alternatively, use Windows Task Scheduler GUI to set up the task.

===== Cloud Deployment Options =====
If using cloud services, consider:
- Heroku: Use Heroku Scheduler add-on
- AWS: Use CloudWatch Events/EventBridge
- Google Cloud: Use Cloud Scheduler
- Microsoft Azure: Use Azure Functions with Timer trigger

===== Testing =====
To test if the backup works, run:
node ${__dirname}/backupDatabase.js

The backup will be saved to: ${__dirname}/../backups/
`);
