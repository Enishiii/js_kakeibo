const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB接続
mongoose.connect('mongodb://localhost:27017/kakeibo', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const entrySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['income', 'expense'] },
    category: String,
    amount: Number,
    description: String,
});

const Entry = mongoose.model('Entry', entrySchema);

// Routes
app.get('/entries', async (req, res) => {
    try {
        const entries = await Entry.find();
        res.json(entries);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/entries', async (req, res) => {
    try {
        const newEntry = new Entry(req.body);
        await newEntry.save();
        res.json(newEntry);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.put('/entries/:id', async (req, res) => {
    try {
        const updatedEntry = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (updatedEntry) {
            res.json(updatedEntry);
        } else {
            res.status(404).send('Entry not found');
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.delete('/entries/:id', async (req, res) => {
    try {
        const deletedEntry = await Entry.findByIdAndRemove(req.params.id);
        if (deletedEntry) {
            res.json(deletedEntry);
        } else {
            res.status(404).send('Entry not found');
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
