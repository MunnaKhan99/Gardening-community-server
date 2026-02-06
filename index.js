require("dotenv").config()
const express = require('express')
const cors = require('cors');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');

const app = express()
const PORT = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173', 'https://gardening-community-client.netlify.app'],
    credentials: true
}));

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const gardeners = client.db('gardenersDB').collection('gardener');
        const gardenTips = client.db('gardenersTipsDB').collection('tips');

        // ========== Gardener APIs ==========
        app.get('/gardener', async (req, res) => {
            try {
                const result = await gardeners.find().toArray();
                res.status(200).send(result);
            } catch (err) {
                res.status(500).send({ message: 'Failed to fetch gardeners' });
            }
        });

        app.post('/gardener', async (req, res) => {
            try {
                const data = req.body;

                if (!data?.name || !data?.email) {
                    return res.status(400).send({ message: 'name and email are required' });
                }

                const result = await gardeners.insertOne(data);
                res.status(201).send(result);
            } catch (err) {
                res.status(500).send({ message: 'Failed to create gardener' });
            }
        });

        // ========== Tips APIs ==========
        app.get('/tips', async (req, res) => {
            try {
                const result = await gardenTips.find().toArray();
                res.status(200).send(result);
            } catch (err) {
                res.status(500).send({ message: 'Failed to fetch tips' });
            }
        });

        app.post('/tips', async (req, res) => {
            try {
                const {
                    title,
                    plant_type_or_topic,
                    difficulty,
                    description,
                    images,
                    category,
                    availability
                } = req.body;

                if (!title || !description) {
                    return res.status(400).send({ message: 'title and description are required' });
                }

                const result = await gardenTips.insertOne({
                    title,
                    plant_type_or_topic,
                    difficulty,
                    description,
                    images: images || [],
                    category,
                    availability
                });

                res.status(201).send(result);
            } catch (err) {
                res.status(500).send({ message: 'Failed to create tip' });
            }
        });

        app.put("/tips/:id", async (req, res) => {
            try {
                const id = req.params.id;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ message: 'Invalid tip id' });
                }

                const data = req.body;

                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: {
                        title: data.title,
                        plant_type_or_topic: data.plant_type_or_topic,
                        difficulty: data.difficulty,
                        description: data.description,
                        images: data.images || [],
                        category: data.category,
                        availability: data.availability
                    }
                };

                const result = await gardenTips.updateOne(filter, updateDoc);

                if (result.matchedCount === 0) {
                    return res.status(404).send({ message: 'Tip not found' });
                }

                res.status(200).send(result);
            } catch (err) {
                res.status(500).send({ message: 'Failed to update tip' });
            }
        });

        app.delete("/tips/:id", async (req, res) => {
            try {
                const id = req.params.id;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ message: 'Invalid tip id' });
                }

                const filter = { _id: new ObjectId(id) };
                const result = await gardenTips.deleteOne(filter);

                if (result.deletedCount === 0) {
                    return res.status(404).send({ message: 'Tip not found' });
                }

                res.status(200).send(result);
            } catch (err) {
                res.status(500).send({ message: 'Failed to delete tip' });
            }
        });

        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('API is running...')
})

module.exports = app;

