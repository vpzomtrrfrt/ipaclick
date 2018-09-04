const bluebird = require('bluebird');
const http = require('http');
const he = require('he');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json')));
const indexHTML = fs.readFileSync(path.resolve(__dirname, 'index.html'));

AWS.config.update({
	accessKeyId: config.AWS_ACCESS_KEY,
	secretAccessKey: config.AWS_KEY_SECRET,
	region: config.AWS_REGION
});

const polly = new AWS.Polly();
const synthesizeSpeech = bluebird.promisify(polly.synthesizeSpeech.bind(polly));

http.createServer(function(req, res) {
	if(req.url === "/") {
		res.writeHead(200, {"Content-type": "text/html", "Content-length": indexHTML.length});
		res.write(indexHTML);
		res.end();
	}
	else if(req.url.startsWith("/api/synthesize/")) {
		const str = decodeURIComponent(req.url.substring(16));
		console.log(str);
		synthesizeSpeech({
			Text: '<phoneme alphabet="ipa" ph="'+he.encode(str)+'"></phoneme>',
			OutputFormat: "mp3",
			TextType: "ssml",
			VoiceId: "Joanna"
		})
		.then(function(result) {
			console.log(result);
			res.writeHead(200, {"Content-type": "audio/mpeg", "Content-length": result.AudioStream.length});
			res.write(result.AudioStream);
			res.end();
		})
		.catch(console.error);
	}
	else {
		res.writeHead(404, {"Content-type": "text/plain"});
		res.end("404 Not Found");
	}
}).listen(process.env.PORT || 4000);

console.log("hi");
