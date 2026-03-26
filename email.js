// Module imports
const mailjet = require("node-mailjet").connect("99db77457a46c7a427c5533c8219448d", "a7878a3b82420ba9b80570c5338b9e64");
const appConfig = require("./app_config.js");

const mainSender = {
	Name: "Teatro Musicado SP",
	Email: "contato@teatromusicadosp.com.br",
};

// Send e-mail with predefined template
module.exports.sendEmailWithTemplate = async (to, templateId, variables, subject = undefined) => {
	const emailData = {
		From: mainSender,
		To: [to],
		TemplateID: templateId,
		TemplateLanguage: true,
		Variables: variables,
		Subject: subject,
	};

	// send mail if production environment
	if (appConfig.isProdEnv()) {
		await mailjet.post("send", { version: "v3.1" })
			.request({
				Messages: [emailData],
			});
	} else if (!appConfig.isTestEnv()) {
		console.info("Sending email:");
		console.info(emailData);
	}
};


// Send standalone email
module.exports.sendEmail = async (replyTo, to, subject, message) => {
	const emailData = {
		From: mainSender,
		ReplyTo: replyTo,
		To: [to],
		Subject: subject, // subject
		HTMLPart: message, // html body
	};

	// send mail if production environment
	if (appConfig.isProdEnv()) {
		await mailjet.post("send", { version: "v3.1" })
			.request({
				Messages: [emailData],
			});
	} else if (!appConfig.isTestEnv()) {
		console.info("Sending email:");
		console.info(emailData);
	}
};
