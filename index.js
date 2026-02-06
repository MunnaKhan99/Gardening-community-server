require("dotenv").config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');

const app = express();

// middleware
app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://gardening-community-client.netlify.app'
    ],
    credentials: true
}));

// MongoDB URI
const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error("❌ MONGODB_URI is missing in environment variables");
}

// Mongo Client (global – reuse connection on Vercel)
let client;
let gardeners, gardenTips;
let isConnected = false;

async function connectDB() {
    if (isConnected) return;

    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    await client.connect();

    gardeners = client.db('gardenersDB').collection('gardener');
    gardenTips = client.db('gardenersTipsDB').collection('tips');

    isConnected = true;
    console.log("✅ MongoDB connected");
}

// health check
app.get('/', (req, res) => {
    res.send('API is running...');
});

// ========== Gardener APIs ==========
app.get('/gardener', async (req, res) => {
    try {
        await connectDB();
        const result = await gardeners.find().toArray();
        res.status(200).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to fetch gardeners' });
    }
});

app.post('/gardener', async (req, res) => {
    try {
        await connectDB();
        const data = req.body;

        if (!data?.name || !data?.email) {
            return res.status(400).send({ message: 'name and email are required' });
        }

        const result = await gardeners.insertOne(data);
        res.status(201).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to create gardener' });
    }
});

// ========== Tips APIs ==========
app.get('/tips', async (req, res) => {
    try {
        await connectDB();
        const { author_email } = req.query;
        const query = author_email ? { author_email } : {};
        const result = await gardenTips.find(query).toArray();
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to fetch tips' });
    }
});

app.post('/tips', async (req, res) => {
    try {
        await connectDB();
        const {
            title,
            plant_type_or_topic,
            difficulty,
            description,
            images,
            category,
            availability,
            author_name,
            author_email
        } = req.body;

        if (!title || !description || !author_email) {
            return res.status(400).send({ message: 'title, description, author_email are required' });
        }

        const result = await gardenTips.insertOne({
            title,
            plant_type_or_topic,
            difficulty,
            description,
            images: images || [],
            category,
            availability,
            author_name,
            author_email,
            likes: 0
        });

        res.status(201).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to create tip' });
    }
});

app.put('/tips/:id', async (req, res) => {
    try {
        await connectDB();
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({ message: 'Invalid tip id' });
        }

        const data = req.body;

        const result = await gardenTips.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    title: data.title,
                    plant_type_or_topic: data.plant_type_or_topic,
                    difficulty: data.difficulty,
                    description: data.description,
                    images: data.images || [],
                    category: data.category,
                    availability: data.availability
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send({ message: 'Tip not found' });
        }

        res.send({ message: 'Tip updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to update tip' });
    }
});

app.delete('/tips/:id', async (req, res) => {
    try {
        await connectDB();
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({ message: 'Invalid tip id' });
        }

        const result = await gardenTips.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to delete tip' });
    }
});

// ===== Local + Vercel compatible export =====

// Local run
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

// Verccel serverless export
module.exports = app;
