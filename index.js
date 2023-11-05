const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middlewares
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cfuzedb.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const database = client.db("bookshelfdb");
//collections
const categories = database.collection("categories");
const books = database.collection("books");


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        //add book category
        app.post('/addCategory', async (req, res)=>{
            const result= await categories.insertOne(req.body);
            res.send(result);
        })
        //get all book categories
        app.get('/categories', async (req, res)=>{
            const result= await categories.find().toArray();
            res.send(result);
        })

        //add book
        app.post('/addBook', async(req, res)=>{
            const result= await books.insertOne(req.body);
            res.send(result);
        })


    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);



app.get('/', async (req, res) => {
    await res.send('Bookshelf Server is running');
})

app.listen(port, () => {
    console.log(`Bookshelf server is running on port:${port}`)
})