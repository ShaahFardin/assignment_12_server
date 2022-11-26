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
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send('forbidden access')
        }
        req.decoded = decoded;
        next()
    })
}

const verifyAdmin = async (req, res, next) => {
    const decodedEmail = req.decoded.email;
    const query = { email: decodedEmail };
    const user = await usersCollecton.findOne(query);
    if (user?.role !== 'Admin') {
        res.status(403).send({ message: 'forbidden access' })
    }
    next()
}

async function run() {
    try {

        const usersCollecton = client.db('carvana').collection('users');
        const allCarsCollection = client.db('carvana').collection('allCars');
        // const volkswagenCollection = client.db('carvana').collection('volkswagen')
        // const buggattiCollection = client.db('carvana').collection('buggatti')
        const bookingsCollection = client.db('carvana').collection('bookings')
        // const sellerAddedProductsCollection = client.db('carvana').collection('sellerProduct')
        const shownAddProductCollection = client.db('carvana').collection('advertisedProduct')

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

        app.get('/allcars/:brandName', async (req, res) => {
            const brandName = req.params.brandName
            const query = { brandName: brandName }
            const result = await allCarsCollection.find(query).toArray();
            res.send(result)
        })
        // add a product under a category
        app.post('/allcars/:brandName', async (req, res) => {
            const result = allCarsCollection.insertOne(req.body);
            res.send(result)
        })
        // get users specific car
        app.get('/allcars', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await allCarsCollection.find(query).toArray();
            res.send(result)
        })
        app.delete('/allcars/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await allCarsCollection.deleteOne(filter)
            res.send(result)
        })


        // // volkswagen car collection
        // app.get('/category/volkswagen', async (req, res) => {
        //     const result = await volkswagenCollection.find({}).toArray();
        //     res.send(result)
        // })


        // // buggati car collection
        // app.get('/category/buggatti', async (req, res) => {
        //     const result = await buggattiCollection.find({}).toArray();
        //     res.send(result)
        // })

        // save bookings to the database
        app.post('/bookings', async (req, res) => {
            const result = await bookingsCollection.insertOne(req.body)
            res.send(result)
        })

        // // add a product from seller
        // app.post('/addproduct', async(req, res)=>{
        //     const result = await sellerAddedProductsCollection.insertOne(req.body);
        //     res.send(result)
        // })
        // get seller specific product
        // app.get('/myproduct', async(req, res)=>{
        //     const email = req.query.email;
        //     const query = {email: email};
        //     const result = await sellerAddedProductsCollection.find(query).toArray();
        //     res.send(result)
        // })

        // show advertisement in homepage
        app.post('/shownAddProductCollection', async (req, res) => {
            const result = await shownAddProductCollection.insertOne(req.body);
            res.send(result)
        })

        // product to advertise in the home page
        app.get('/addverisedProduct', async (req, res) => {
            const id = req.params.id;
            const query = {};
            const result = await shownAddProductCollection.find(query).toArray();
            res.send(result)
        })

        // get user specific bookings
        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: "forbidden access" })
            }
            const query = {
                email: email
            }
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings)
        });



        // get all users
        app.get('/users', verifyJWT, async (req, res) => {
            const users = await usersCollecton.find({}).toArray();
            res.send(users)
        })

        // check if admin or not
        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            const query = { email: email };
            const user = await usersCollecton.findOne(query);
            res.send({ isAdmin: user?.role === "Admin" })
        })
        // check seller
        app.get('/users/seller/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            const query = { email: email };
            const user = await usersCollecton.findOne(query);
            res.send({ isSeller: user?.role === "Seller" })
        })


        // delete a user
        app.delete('/users/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollecton.findOne(query);
            if (user?.role !== 'Admin') {
                res.status(403).send({ message: 'forbidden access' })
            }
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollecton.deleteOne(filter)
            res.send(result)
        })




        // verify user
        app.put('/users/admin/:id', verifyJWT, async (req, res) => {

            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollecton.findOne(query);
            if (user?.role !== "Admin") {
                return res.status(403).send({
                    message: 'forbidden access'
                })
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    verified: true
                }
            }
            const result = await usersCollecton.updateOne(filter, updatedDoc, options)
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