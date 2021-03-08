const notification_in_app_service = require('../thirdparty/notification.in_app.service');

exports.initialize_thirdparty_services = async () => {
    return new Promise((resolve, reject) => {
        try {
            notification_in_app_service.initialize();
            resolve(1);
        }
        catch (error) {
            reject(error);
        }
    });

}
