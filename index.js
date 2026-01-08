require("dotenv").config()
const express = require('express')
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const { ServerApiVersion } = require('mongodb');
const app = express()
const port = 5000


// middleware
app.use(express.json());
app.use(cors());

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
        await client.connect(); // REQUIRED

        const gardeners = client
            .db('gardenersDB')
            .collection('gardener');

        // for gardener
        app.get('/gardener', async (req, res) => {
            const result = await gardeners.find().toArray();
            res.send(result);
        });

        app.post('/gardener', async (req, res) => {
            const result = await gardeners.insertOne(req.body);
            res.send(result);
        });




        // for tips

        const gardenTips = client
            .db('gardenersTipsDB')
            .collection('tips');

        app.get('/tips', async (req, res) => {
            const result = await gardenTips.find().toArray();
            res.send(result);
        });

        app.post('/tips', async (req, res) => {
            const result = await gardenTips.insertOne(req.body);
            res.send(result);
        });

        // UPDATE tip
        app.put("/tips/:id", async (req, res) => {
            const id = req.params.id;
            const data = req.body;

            const filter = { _id: new ObjectId(id) };

            const updateDoc = {
                $set: {
                    title: data.title,
                    plant_type_or_topic: data.plant_type_or_topic,
                    difficulty: data.difficulty,
                    description: data.description,
                    images: data.images,       // array
                    category: data.category,
                    availability: data.availability
                }
            };

            const result = await gardenTips.updateOne(filter, updateDoc);
            res.send(result);
        });

        app.delete("/tips/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const result = await gardenTips.deleteOne(filter);

            res.send(result);
        });



        console.log("MongoDB connected");
    } catch (error) {
        console.error(error);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
