var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'autowithdrawhyip',
        pass: 'autohyip113'
    }
});

var mailOptions = {
    from: 'autowithdrawhyip@gmail.com',
    to: 'xxxxxxxx',
    subject: 'Withdraw successful',
    text: 'That was easy!'
};

function sendMail(address, title, message) {
    mailOptions.subject = title;
    mailOptions.text = message;
    mailOptions.to = address;
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports.sendMail = sendMail;