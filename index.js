
require('dotenv').config();
const express = require('express');
const ngrok = require('@ngrok/ngrok');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Multer storage config for uploads folder (absolute path)
const uploadsDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDir);
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	}
});

// Accept only .exe and .apk files
const fileFilter = (req, file, cb) => {
	if (file.mimetype === 'application/vnd.android.package-archive' || file.originalname.endsWith('.exe')) {
		cb(null, true);
	} else {
		cb(new Error('Only .exe and .apk files are allowed!'), false);
	}
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
const app = express();

// Set Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));



// Middleware to set ngrok-skip-browser-warning header
app.use((req, res, next) => {
	res.setHeader('ngrok-skip-browser-warning', 'true');
	next();
});


// Home route
app.get('/', (req, res) => {
	res.render('napp');
});

// Upload route
app.post('/upload', upload.single('file'), (req, res) => {
	res.send('File uploaded successfully!');
});

// Download route (by query parameter)
app.get('/download', (req, res) => {
	const filename = req.query.filename;
	if (!filename) {
		return res.render('napp', { error: 'Filename is required.' });
	}
	const filePath = path.join(uploadsDir, filename);
	if (fs.existsSync(filePath)) {
		res.download(filePath);
	} else {
		res.render('napp', { error: 'File not found.' });
	}
});

// 404 handler for all other routes
app.use((req, res) => {
	res.status(404).send('Not Found');
});

const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Express server running on port ${PORT}`);
	ngrok.connect({
	  addr: PORT,
	  authtoken: process.env.NGROK_AUTHTOKEN,
	  domain: 'violaceous-bifilarly-marlon.ngrok-free.app'
	})
		.then(listener => console.log(`Ingress established at: ${listener.url()}`))
		.catch(err => console.error('ngrok error:', err.message));
});