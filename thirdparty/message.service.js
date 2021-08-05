account_sid='AC4ac6c498ec339e3e7a3ec1db4f8681ea'
auth_token='0bff30456f80706ec68e814ef0f7d1ad'
console.log("account_sid=", account_sid)
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