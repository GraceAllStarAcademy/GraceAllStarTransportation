const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const csv = require('csv-parser');
const { Readable } = require('stream');
const app = express();

app.use(fileUpload());
app.use(express.static('.')); // Serve static files from root directory

// Serve your index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Handle file upload
app.post('/upload', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    let uploadedFile = req.files.file;
    let results = [];

    // Check if the file is saved in a temporary path or needs to be read from buffer
    let inputStream;
    if (uploadedFile.tempFilePath) {
        // If file is saved in a temporary path, read from it
        inputStream = fs.createReadStream(uploadedFile.tempFilePath);
    } else {
        // Otherwise, create a readable stream from buffer
        inputStream = new Readable();
        inputStream.push(uploadedFile.data); // Push data to stream
        inputStream.push(null); // Indicate end of stream
    }

    inputStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            // Process data here
            let summary = results.reduce((acc, curr) => {
                let key = `${curr.school}-${curr.Time}`;
                if (!acc[key]) {
                    acc[key] = { school: curr.school, Time: curr.Time, count: 0 };
                }
                acc[key].count += 1;
                return acc;
            }, {});

            // Convert the summary object to an array
            let response = Object.values(summary);
            res.json(response); // Send the grouped data as JSON
        })
        .on('error', (error) => {
            console.error('Error processing file:', error);
            res.status(500).send('Error processing file');
        });
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
