
var MailComposer = require("mailcomposer").MailComposer;
const aws = require('aws-sdk');
const fs = require('fs');
const path = require('path');

module.exports.send_email = async (
    to_email_addresses,
    cc_email_addresses,
    from_email_address,
    email_subject,
    email_text,
    email_html) => {
    try {
        aws.config.update({ region: process.env.AWS_REGION });
        const SES = new aws.SES({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
        });
        var params = {
            Destination: {
                CcAddresses: cc_email_addresses,
                ToAddresses: to_email_addresses
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: email_html ? email_html : email_text
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: email_subject
                }
            },
            Source: from_email_address,
        };

        var send_action = await SES.sendEmail(params).promise()
        return send_action;
    }
    catch (error) {
        throw new Error(error.message);
    }
}

module.exports.send_email_with_attachment = async (
    to_email_addresses,
    cc_email_addresses,
    from_email_address,
    email_subject,
    email_text,
    email_html,
    attachments) => {
    try {
        aws.config.update({ region: process.env.AWS_REGION });
        const SES = new aws.SES({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
        });
        var temp_attachments = [];
        for (var i = 0; i < attachments.length; i++) {
            temp_attachments.push({ path: attachments[i] });
        }
        var mail = await new MailComposer({
            from: from_email_address,
            replyTo: cc_email_addresses,
            to: to_email_addresses,
            subject: email_subject,
            text: email_html ? email_html : email_text,
            attachments: temp_attachments,
        });
        return new Promise((resolve, reject) => {
            mail.compile().build(async (err, message) => {
                if (err) {
                    reject(`Error sending raw email: ${err}`);
                }
                var sendRawEmailPromise = await SES.sendRawEmail({ RawMessage: { Data: message } }).promise();
                resolve(sendRawEmailPromise);
            });
        });
    }
    catch (error) {
        throw new Error(error.message);
    }
}

