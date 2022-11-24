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

async function run() {
    try {

        const usersCollecton = client.db('carvana').collection('users');

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
            res.send({result, token})
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