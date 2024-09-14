const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
// Use express.json() middleware instead of body-parser
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('your_mongodb_connection_string_here', {
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
        await Finance.findOneAndUpdate(
            { date },
            { date, entries },
            { upsert: true }
        );
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