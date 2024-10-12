import express from 'express';
import multer from 'multer';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import newsPaper from './models/newsPaper.js';
import news from './models/news.js';
dotenv.config()

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json())

const connect = async () =>{
    try{
          mongoose.set('strictQuery', false);
          await mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
          console.log('Connected MongoDB!')
    }
    catch(error){
          throw error;
    }
};

mongoose.connection.on('disconnected', () =>{
    console.log('mpngoDb Disconnected!')
})

mongoose.connection.on('connected', () =>{
    console.log('mongoDb Connected!')
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

function runPythonScript(newsPaper, imagePath) {
    return new Promise((resolve, reject) => {
        const pythonPath = 'C:\\Users\\DCL\\AppData\\Local\\Microsoft\\WindowsApps\\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\\python.exe'; // <-- Replace with your Python path

        const pythonProcess = spawn(pythonPath, ['ocr_script.py', newsPaper, imagePath], {
            env: {
                ...process.env,
                PATH: process.env.PATH + ';C:\\Program Files\\Tesseract-OCR'
            }
        });

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
            }
        });
    });
}

app.post('/extract-text', upload.single('image'), async (req, res) => {
    const newspaper = req.body.news_paper;
    const imagePath = req.file.path;

    if (!newsPaper || !imagePath) {
        return res.status(400).json({ error: 'Please provide both news_paper and image file.' });
    }
    const newss = await newsPaper.findOne({_id: newspaper})
    try {
        const extractedText = await runPythonScript(newss.coords, imagePath);

        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error(`Error deleting file: ${err.message}`);
            }
        });
        
        const allNews = await news.findOne({headline: extractedText, newsPaper: newspaper})
        if(allNews) res.json({ extractedText: `Valid news of date: ${allNews.createdAt}` });
        else res.json({ extractedText: `Invalid news` });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post('/add-news-paper', async(req, res) =>{
    const {body = {}} = req
    if(!body?.username) return res.status(400).json({ error: 'User name missing.' });
    if(!body?.password) return res.status(400).json({ error: 'Password missing.' });
    if(!body?.name) return res.status(400).json({ error: 'Name missing.' });

    const createN = new newsPaper(body)
    const nesss= await createN.save()
    res.status(200).json(nesss)
})

app.get('/get-news-paper', async(req, res) => {
    const newss = await newsPaper.find({}).select('_id name')
    res.status(200).json(newss);
});


app.post('/add-news', upload.single('image'), async (req, res) => {
    const newspaper = req.body.news_paper;
    const imagePath = req.file.path;

    if (!newsPaper || !imagePath) {
        return res.status(400).json({ error: 'Please provide both news_paper and image file.' });
    }
    const newss = await newsPaper.findOne({_id: newspaper})
    try {
        const extractedText = await runPythonScript(newss.name, imagePath);

        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error(`Error deleting file: ${err.message}`);
            }
        });
        const newNews = await news({headline: extractedText, newsPaper: newspaper})
        await newNews.save()
        res.status(200).json({extractedText: `Successfully add ${extractedText} news!`})
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/', (req, res) => {
    res.status(200).json({ message: 'Server is running!' });
});

app.listen(port, () => {
    connect()
    console.log(`Server running on http://localhost:${port}`);
});
