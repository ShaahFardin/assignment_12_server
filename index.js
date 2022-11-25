const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
        const sellerAddedProductsCollection = client.db('carvana').collection('sellerProduct')

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

        // add a product from seller
        app.post('/addproduct', async(req, res)=>{
            const result = await sellerAddedProductsCollection.insertOne(req.body);
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
        });



        // get all users
        app.get('/users', async(req, res)=>{
            const users = await usersCollecton.find({}).toArray();
            res.send(users)
        })

        // check if admin or not
        app.get('/users/admin/:email', async(req, res)=>{
            const email = req.params.email
            const query = { email: email};
            const user = await usersCollecton.findOne(query);
            res.send({isAdmin : user?.role === "Admin"})
        })


        // delete a user
        app.delete('/users/:id',verifyJWT, async(req, res)=>{
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await usersCollecton.findOne(query);
            if(user?.role !== 'Admin'){
                res.status(403).send({message: 'forbidden access'})
            }
            const id = req.params.id;
            const filter = {_id:ObjectId(id)};
            const result = await usersCollecton.deleteOne(filter)
            res.send(result)
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