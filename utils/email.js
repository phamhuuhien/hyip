var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'daicaca311@gmail.com',
        pass: 'thuoctay'
    }
});

var mailOptions = {
    from: 'daicaca311@gmail.com',
    to: 'h.studio87@gmail.com',
    subject: 'Withdraw successful',
    text: 'That was easy!'
};

function sendMail(message) {
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports.sendMail = sendMail;