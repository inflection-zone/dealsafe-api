const firebaseAdmin = require('firebase-admin');
const Logger = require('../common/Logger');

module.exports.initialize = () => {
    var adminApp = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.applicationDefault(),
    });
}

module.exports.send_message_device = async (deviceToken, message) => {

    try {
        message.token = deviceToken;
        if(deviceToken == null){
            Logger.Log('Invalid device token!');
            return;
        }
        Logger.Log('Sending notification to token: ', deviceToken);
        var response = await firebaseAdmin.messaging().send(message);
        Logger.Log('Successfully sent notification to token: ', deviceToken);
        return response;
    }
    catch (error) {
        var errorMessage = 'Error sending notification to token: ' + deviceToken;
        Logger.LogError(errorMessage, 500, error.message);
    }
}

module.exports.send_message_multiple_devices = async (deviceTokens, message) => {

    try {
        message.tokens = deviceTokens;
        Logger.Log('Sending notification to tokens: ', deviceTokens.toString());
        var response = await firebaseAdmin.messaging().sendMulticast(message);
        Logger.Log('Successfully sent notification to token: ', deviceTokens);
        return response;
    }
    catch (error) {
        var errorMessage = 'Error sending notification to token: ' + deviceTokens;
        Logger.LogError(errorMessage, 500, error.message);
    }
}

module.exports.send_message_topic = async (topic, message) => {

    try {
        message.topic = topic;
        Logger.Log('Sending notification to topic: ', topic);
        var response = await firebaseAdmin.messaging().send(message);
        Logger.Log('Successfully sent notification to topic: ', topic);
        return response;
    }
    catch (error) {
        var errorMessage = 'Error sending notification to topic: ' + topic;
        Logger.LogError(errorMessage, 500, error.message);
    }
}

module.exports.format_message_notification = (notificationType, title, body) => {

    var message = {
        data: { type: notificationType },
        notification: {
            title: title,
            body: body
        },
        android: {
            ttl: 3600 * 1000, // 1 hour in milliseconds
            priority: 'normal',
            notification: {
                title: title,
                body: body,
                color: '#f45342'
            }
        },
        apns: {
            headers: {
                'apns-priority': '10'
            },
            payload: {
                aps: {
                    alert: {
                        title: title,
                        body: body,
                    },
                    badge: 2,
                    message: {
                        type: notificationType
                    }
                }
            }
        }
    }
    return message;
}


module.exports.format_message_notification_with_data = (notificationType, title, body, customData) => {

    var message = {
        data: {
            type: notificationType,
            customData: customData
        },
        notification: {
            title: title,
            body: body
        },
        android: {
            ttl: 3600 * 1000, // 1 hour in milliseconds
            priority: 'normal',
            notification: {
                title: title,
                body: body,
                //'customData': 'customData'
            }
        },
        apns: {
            headers: {
                'apns-priority': '10'
            },
            payload: {
                aps: {
                    alert: {
                        title: title,
                        body: body,
                    },
                    badge: 2,
                    message: {
                        type: notificationType,
                        //'customData': 'customData'
                    }
                }
            }
        }
    }
    return message;
}

function get_access_token() {
    
    return new Promise(function (resolve, reject) {

        var gcreds = process.env.GOOGLE_APPLICATION_CREDENTIALS.toString();

        const key = require(gcreds);
        const jwtClient = new google.auth.JWT(
            key.client_email,
            null,
            key.private_key,
            SCOPES,
            null
        );
        jwtClient.authorize(function (err, tokens) {
            if (err) {
                reject(err);
                return;
            }
            resolve(tokens.access_token);
        });
    });
}
