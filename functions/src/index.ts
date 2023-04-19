const functions = require("firebase-functions");
const admin =  require("firebase-admin");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

admin.initializeApp(functions.config().firebase);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPdfEmail = void 0;
exports.sendPdfEmail = functions.https.onRequest((req: { body: { pdf: any; email: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; send: { (arg0: string): void; new(): any; }; }; }) => {
  const { pdf, email } = req.body;
		const msg ={
			to: email,
			from: "jubileeinvestmentsdmv@gmail.com",
			templateId: "d-84afb1e8c21747729f8de1fc0bb0bbb7",
			subject: "Thanks for your purchase",
			dynamicTemplateData: {
				pdf: pdf,
			},
		};

		try {
			sgMail.send(msg)
			res.status(200).send('Email sent successfully!');
		} catch(error) {
			console.error(error);
			res.status(500).send('Error sending email!');
		}
});
