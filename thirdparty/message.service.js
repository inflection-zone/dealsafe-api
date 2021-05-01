const account_sid = process.env.TWILIO_ACCOUNT_SID;
const auth_token = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(account_sid, auth_token);

module.exports.send_message_sms = async (
    to_phone, 
    message_body, 
    from_phone) => {
    // return new Promise((resolve, reject) => {
    //     resolve('Twilio access details not available');
    // });
    return await client.messages
        .create({
            body: message_body,
            from: from_phone,
            to: to_phone
        });
}

module.exports.send_message_whatsapp = async (
    to_phone, 
    message_body, 
    from_phone) => {
    return new Promise((resolve, reject) => {
        resolve('Twilio access details not available');
    });
    // return await client.messages
    //     .create({
    //         from: `whatsapp:${from_phone}`,
    //         body: message_body,
    //         to: `whatsapp:${to_phone}`
    //     });
}

