import { CronJob } from 'cron';
import { updateUsers } from '../services/UserService';

export function scheduleJobs(): void {
  // This cron job is scheduled to run every day at 12:00 AM.
  const job = new CronJob('0 0 * * *', async function () {
    console.log('Running update users job at:', new Date());

    try {
      await updateUsers();
      console.log('Users update completed successfully.');
    } catch (error) {
      console.error('Users update failed:', error);
    }
  });

  job.start();
}
