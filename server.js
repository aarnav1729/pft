const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://aarnavsingh836:Cucumber1729@rr.oldse8x.mongodb.net/?retryWrites=true&w=majority&appName=rr', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define schema and model
const financeSchema = new mongoose.Schema({
    date: String,
    entries: Array
});

const Finance = mongoose.model('Finance', financeSchema);

// API endpoints
app.post('/save', async (req, res) => {
    const { date, entries } = req.body;
    try {
        const existingData = await Finance.findOne({ date });

        if (existingData) {
            existingData.entries.push(...entries);
            await existingData.save();
        } else {
            const newFinance = new Finance({ date, entries });
            await newFinance.save();
        }

        res.send('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).send('Error saving data');
    }
});

app.get('/fetch', async (req, res) => {
    try {
        const finances = await Finance.find();
        res.json(finances);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});