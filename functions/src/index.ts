const functions = require("firebase-functions");

export const sendPdfEmail = functions.https.onRequest((request, response) => {
   functions.logger.info("Hello logs!", {structuredData: true});
   response.send("Hello from Testing!");
 });
