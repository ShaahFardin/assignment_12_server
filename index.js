const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = process.env.REACT_APP_MONGO_URI;
const client = new MongoClient(uri,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverApi: ServerApiVersion.v1
    });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send('forbidden access')
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {
    try {

        const usersCollecton = client.db('carvana').collection('users');
        const volkswagenCollection = client.db('carvana').collection('volkswagen')
        const buggattiCollection = client.db('carvana').collection('buggatti')
        const bookingsCollection = client.db('carvana').collection('bookings')

        // save user to database
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: user,
            }
            const result = await usersCollecton.updateOne(filter, updatedDoc, options)
            console.log(result);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
            res.send({ result, token })
        })



        // volkswagen car collection
        app.get('/category/volkswagen', async (req, res) => {
            const result = await volkswagenCollection.find({}).toArray();
            res.send(result)
        })


        // buggati car collection
        app.get('/category/buggatti', async (req, res) => {
            const result = await buggattiCollection.find({}).toArray();
            res.send(result)
        })

        // save bookings to the database
        app.post('/bookings', async (req, res) => {
            const result = await bookingsCollection.insertOne(req.body)
            res.send(result)
        })

        // get user specific bookings
        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if(email !== decodedEmail){
                return res.status(403).send({message: "forbidden access"})
            }
            const query = {
                email: email
            }
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings)
        })

        console.log('MongoDb Database connected');

    } finally {

    }
}
run().catch(error => console.log(error))


app.get('/', (req, res) => {
    res.send("Final project carvana server is running");
});
app.listen(port, console.log(`Carvana server is running on port ${port}`))