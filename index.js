const bluebird = require('bluebird');
const http = require('http');
const he = require('he');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json')));

AWS.config.update({
	accessKeyId: config.AWS_ACCESS_KEY,
	secretAccessKey: config.AWS_KEY_SECRET,
	region: config.AWS_REGION
});

const polly = new AWS.Polly();
bluebird.promisifyAll(polly);

http.createServer(function(req, res) {
	if(req.url === "/") res.end("hi");
	else if(req.url.startsWith("/api/synthesize/")) {
		const str = decodeURIComponent(req.url.substring(16));
		console.log(str);
		polly.synthesizeSpeechAsync({
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
