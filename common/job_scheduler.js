const cron = require('node-cron');
const env = process.env.NODE_ENV || 'development';
const schedules = require('../config/cron_schedule')[env];
const Logger = require('./Logger');


module.exports.schedule_cron_jobs = () => {

    return new Promise((resolve, reject) => {

        try {

            cron.schedule(schedules.my_schedule, () => {
                console.log('...');
                // (async () => {
                //     await resource_service.cleanup_temp_files();
                // })();

            });

            //2. Schedule appointment reminder notifictions

            // cron.schedule('*/15 * * * *', () => {
            //     console.log('Sending reminders for appointments...');
            //     (async () => {
            //         var appointments = await AppointmentService.GetAppointmentReminders();
            //         for await (var a of appointments){
            //             await AppointmentService.SendAppointmentReminder(a);
            //         }
            //     })();
            //   });

            resolve(true);
        }
        catch (error) {
            reject(error);
        }
    });
}

