const fs = require('fs');
const pdf = require('pdf-parse');

async function extractPDFMetadata(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        
        const metadata = {
            title: data.info?.Title || null,
            author: data.info?.Author || null,
            subject: data.info?.Subject || null,
            keywords: data.info?.Keywords || null,
            creator: data.info?.Creator || null,
            producer: data.info?.Producer || null,
            creationDate: data.info?.CreationDate || null,
            modificationDate: data.info?.ModDate || null,
            pages: data.numpages || null,
            version: data.version || null,
            textLength: data.text ? data.text.length : 0
        };
        
        console.log(JSON.stringify(metadata, null, 2));
    } catch (error) {
        console.error('Error extracting PDF metadata:', error.message);
        process.exit(1);
    }
}

const filePath = process.argv[2];
if (!filePath) {
    console.error('Please provide a PDF file path as an argument');
    process.exit(1);
}

extractPDFMetadata(filePath);