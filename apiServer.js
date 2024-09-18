// import statement
const express = require('express');
var cors = require('cors');
const app = express();

//port declaration
const port = 3000;


// middlewares
app.use(express.json());// process json
app.use(express.urlencoded({ extended: true }));
app.use(cors());


//database connection string with MongoClient
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://pranitpoudel15:mrmaster123123@giftdelivery.hqlwv.mongodb.net/";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


// Global variable declartion for users and orders
var userCollection;
var orderCollection;

client.connect(err => {
    userCollection = client.db("giftdelivery").collection("users");
    orderCollection = client.db("giftdelivery").collection("orders");

    // message to display after successful database connection
    console.log('Database up!\n')

});


// Root route for the server, responds with a welcome message in HTML
app.get('/', (req, res) => {

    // Sending an HTML response to the client
    res.send('<h3>Welcome to Gift Delivery server app!</h3>')
})



// Route to test retrieval of user data from MongoDB
app.get('/getUserDataTest', (req, res) => {

    console.log("GET request received\n");

    userCollection.find({}, { projection: { _id: 0 } }).toArray(function (err, docs) {
        if (err) {
            console.log("Some error.. " + err + "\n");
            res.send(err);
        } else {
            console.log(JSON.stringify(docs) + " have been retrieved.\n");
            res.status(200).send("<h1>" + JSON.stringify(docs) + "</h1>");
        }

    });

});


// Route to test retrieval of order data from MongoDB
app.get('/getOrderDataTest', (req, res) => {

    // Logging that a GET request was received
    console.log("GET request received\n");


     // Finding all documents in the orderCollection, excluding the '_id' field from the result (using projection)
    orderCollection.find({}, { projection: { _id: 0 } }).toArray(function (err, docs) {
        if (err) {
            console.log("Some error.. " + err + "\n");
            res.send(err);
        } else {
            console.log(JSON.stringify(docs) + " have been retrieved.\n");
            res.status(200).send("<h1>" + JSON.stringify(docs) + "</h1>");
        }

    });
});

// POST endpoint to verify user login credentials
app.post('/verifyUser', (req, res) => {

    // Log the incoming POST request with the body data (login credentials)
    console.log("POST request received : " + JSON.stringify(req.body) + "\n");

    loginData = req.body;

     // Query the userCollection to find a user with matching email and password
    // Exclude the '_id' field from the results using projection
    userCollection.find({ email: loginData.email, password: loginData.password }, { projection: { _id: 0 } }).toArray(function (err, docs) {
        if (err) {
            console.log("Some error.. " + err + "\n");
            res.send(err);
        } else {
            console.log(JSON.stringify(docs) + " have been retrieved.\n");
            res.status(200).send(docs);
        }

    });

});


// POST endpoint to handle order data submission
app.post('/postOrderData', function (req, res) {

    // Log the incoming POST request along with the body data (order details)
    console.log("POST request received : " + JSON.stringify(req.body) + "\n");

    // Insert the received order data into the 'orderCollection' in the database
    orderCollection.insertOne(req.body, function (err, result) {
        if (err) {
            console.log("Some error.. " + err + "\n");
            res.send(err);
        } else {
            console.log("Order record with ID " + result.insertedId + " have been inserted\n");
            res.status(200).send(result);
        }

    });

});


// POST endpoint to create a new user
app.post('/createUser', (req, res) => {

    // Log the incoming POST request along with the body data (user details)
    console.log("POST request received : " + JSON.stringify(req.body) + "\n");

    const newUser = req.body; // Capture the new user's details from the request body


    // Insert the new user data into the 'userCollection' in the database
    userCollection.insertOne(newUser, (err, result) => {
        if (err) {
            console.error("Error inserting user into database: ", err);
            res.status(500).send("Error inserting user into database");
        } else {
            console.log("New user added: ", result.insertedId);
            res.status(201).send({ message: "User created successfully", userId: result.insertedId });
        }
    });
});



// POST endpoint to get past orders for a user
app.post('/getPastOrders', (req, res) => {

    // Log the incoming GET request with body
    console.log("GET request received : " + JSON.stringify(req.body) + "\n");


    const userEmail = req.body.email; // The logged-in user's email sent from the client

    // Retrieve orders that match the logged-in user's email
    orderCollection.find({ customerEmail: userEmail }).toArray((err, orders) => {
        if (err) {
            console.error("Error retrieving orders from the database: ", err);
            res.status(500).send("Error retrieving orders");
        } else {
            console.log("Orders retrieved for user:", userEmail);
            res.status(200).send(orders); // Send the orders back to the client
        }
    });
});


// DELETE endpoint to delete selected orders
app.delete('/deleteSelectedOrders', (req, res) => {

      // Log the incoming DELETE request with body
      console.log("DELETE request received : " + JSON.stringify(req.body) + "\n");


    const userEmail = req.body.email;
    const selectedOrders = req.body.orders; // Array of order numbers

    // Check if the userEmail or selectedOrders are missing
    if (!userEmail || !Array.isArray(selectedOrders) || selectedOrders.length === 0) {
        console.log("Invalid request");
        return res.status(400).send({ message: 'Invalid request. No orders selected or user email is missing.' });
       
    }

    // Only delete the orders specified in the selectedOrders array and matching the user's email
    orderCollection.deleteMany({ customerEmail: userEmail, orderNumber: { $in: selectedOrders } }, (err, result) => {
        if (err) {
            console.error("Error deleting orders from the database: ", err);
            return res.status(500).send("Error deleting orders");
        } else if (result.deletedCount === 0) {
            return res.status(404).send({ message: 'No orders found to delete.' });
        } else {
            console.log("Delete successful   " + result.deletedCount +"   order deleted");
            return res.status(200).send({ deletedCount: result.deletedCount }); // Send the number of deleted orders
        }
    });
});




// server listening on declared port with console message 
app.listen(port, () => {
    console.log(`Gift Delivery server app listening at http://localhost:${port}`)
});
