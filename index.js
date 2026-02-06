require("dotenv").config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb')

const app = express()

// middleware
app.use(express.json())
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://gardening-community-client.netlify.app'
    ],
    credentials: true
}))

// MongoDB URI
const uri = process.env.MONGODB_URI

if (!uri) {
    console.error("❌ MONGODB_URI is missing in environment variables")
}

// Mongo Client (global – so that Vercel reuse connection)
let client
let gardeners, gardenTips

async function connectDB() {
    if (gardeners && gardenTips) return

    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    })

    await client.connect()

    gardeners = client.db('gardenersDB').collection('gardener')
    gardenTips = client.db('gardenersTipsDB').collection('tips')

    console.log("✅ MongoDB connected")
}

// call once
connectDB().catch(err => console.error("❌ MongoDB connection error:", err))

// health check
app.get('/', (req, res) => {
    res.send('API is running...')
})


// ========== Gardener APIs ==========
app.get('/gardener', async (req, res) => {
    try {
        await connectDB()
        const result = await gardeners.find().toArray()
        res.status(200).send(result)
    } catch (err) {
        console.error(err)
        res.status(500).send({ message: 'Failed to fetch gardeners' })
    }
})

app.post('/gardener', async (req, res) => {
    try {
        await connectDB()
        const data = req.body

        if (!data?.name || !data?.email) {
            return res.status(400).send({ message: 'name and email are required' })
        }

        const result = await gardeners.insertOne(data)
        res.status(201).send(result)
    } catch (err) {
        console.error(err)
        res.status(500).send({ message: 'Failed to create gardener' })
    }
})


// ========== Tips APIs ==========
app.get('/tips', async (req, res) => {
    try {
        await connectDB()
        const result = await gardenTips.find().toArray()
        res.status(200).send(result)
    } catch (err) {
        console.error(err)
        res.status(500).send({ message: 'Failed to fetch tips' })
    }
})

app.post('/tips', async (req, res) => {
    try {
        await connectDB()
        const {
            title,
            plant_type_or_topic,
            difficulty,
            description,
            images,
            category,
            availability
        } = req.body

        if (!title || !description) {
            return res.status(400).send({ message: 'title and description are required' })
        }

        const result = await gardenTips.insertOne({
            title,
            plant_type_or_topic,
            difficulty,
            description,
            images: images || [],
            category,
            availability
        })

        res.status(201).send(result)
    } catch (err) {
        console.error(err)
        res.status(500).send({ message: 'Failed to create tip' })
    }
})

app.put('/tips/:id', async (req, res) => {
    try {
        await connectDB()
        const id = req.params.id

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({ message: 'Invalid tip id' })
        }

        const data = req.body

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
        )

        if (result.matchedCount === 0) {
            return res.status(404).send({ message: 'Tip not found' })
        }

        res.send({ message: 'Tip updated successfully' })
    } catch (err) {
        console.error(err)
        res.status(500).send({ message: 'Failed to update tip' })
    }
})

app.delete('/tips/:id', async (req, res) => {
    try {
        await connectDB()
        const id = req.params.id

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({ message: 'Invalid tip id' })
        }

        const result = await gardenTips.deleteOne({ _id: new ObjectId(id) })

        if (result.deletedCount === 0) {
            return res.status(404).send({ message: 'Tip not found' })
        }

        res.send({ message: 'Tip deleted successfully' })
    } catch (err) {
        console.error(err)
        res.status(500).send({ message: 'Failed to delete tip' })
    }
})

module.exports = app
