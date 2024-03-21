import express from "express";
import path from "path";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import jwt  from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Connect to MongoDB
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);



// Database Name
const dbName = "auth";

// Collection Name
const collectionName = "users";

// Middleware
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set view engine
app.set("view engine", "ejs");

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    const db = client.db(dbName);
    return db.collection(collectionName);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
}

// Insert user into MongoDB
async function insertUser(user) {
  const usersCollection = await connectToDatabase();
  try {
    // Basic validation
    if (!user.username || typeof user.username !== "string") {
      throw new Error("Username is required and must be a string");
    }
    if (!user.email || typeof user.email !== "string") {
      throw new Error("Email is required and must be a string");
    }

    const result = await usersCollection.insertOne(user);
    console.log("User inserted:", result.insertedId);
    return result.insertedId;
  } catch (err) {
    console.error("Error inserting user:", err);
    throw err;
  }
}

// Retrieve users from MongoDB
async function getUsers() {
  const usersCollection = await connectToDatabase();
  try {
    const users = await usersCollection.find({}).toArray();
    console.log("Users retrieved:", users);
    return users;
  } catch (err) {
    console.error("Error retrieving users:", err);
    throw err;
  }
}

// Routes

// Success page
app.get("/suc", (req, res) => {
  res.render("suc");
});

app.get("/", (req, res) => {
    const { token } = req.cookies;
    if (token) {
        res.render("logout"); // Render logout page if token exists
    } else {
        res.render("login"); // Render login page if no token
    }
});
// Login route

app.post("/login", (req, res) => { // Change route to handle POST requests
    res.cookie("token", "mamtadarling", {
        
        httpOnly: true,
        expires: new Date(Date.now() + 60*100000), // Set expiration time for the cookie (10 minutes),
        
    });
    res.redirect("/"); // Redirect to the home page
});

// Logout route
app.get("/logout", (req, res) => { // Change route to handle POST requests
    res.clearCookie("token", null,{
        httpOnly: true,
        expires: new Date(Date.now()) // Set expiration to a past date (instant expiration)
    });
    res.redirect("/");
});

// Home route (renders login/logout page)



// Contact form submission route
app.post("/contact", async (req, res) => {
  console.log(req.body);
  try {
    // Insert user data
    await insertUser({ username: req.body.name, email: req.body.email });
    res.redirect("/suc");
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Error inserting user");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
