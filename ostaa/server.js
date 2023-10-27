/*
 * Author: Igor Gabriel Bezerra Bernardon, John Ko
 * Date: 10/30/2023
 * Class: CSC 337
 * Instructor: Benjamin Dicken
 *
 * Description:
 */
const mongoose = require("mongoose");
const express = require("express");
const bp = require("body-parser");
const app = express();
const port = 80;

// DB stuff
const db = mongoose.connection;
const mongoDBURL = "mongodb://127.0.0.1/ostaa";
mongoose.connect(mongoDBURL, { useNewUrlParser: true });
const Schema = mongoose.Schema;
db.on("error", () => {
  console.log("MongoDB connection error:");
});

/**
 * Each chat object will contain an Alias, a message,
 * and the time it was posted.
 */
var ChatSchema = new mongoose.Schema({
  alias: String,
  message: String,
  time: {
    type: Date,
    default: Date.now,
  },
});
var Chat = mongoose.model("Chat", ChatSchema);

var ItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  price: Number,
  stat: String,
});
var Item = mongoose.model("Item", ItemSchema);

// Define the UserSchema
var UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  listings: [
    {
      type: Schema.Types.ObjectId,
      ref: "Item",
    },
  ],
  purchases: [
    {
      type: Schema.Types.ObjectId,
      ref: "Item",
    },
  ],
});

var User = mongoose.model("User", UserSchema);

app.use(express.static("public_html"));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(bp.json());

// /get/users/ (GET) Should return a JSON array containing the information for every user in the database.
app.get("/get/users/", (req, res) => {
  User.find({}, (err, users) => {
    if (err) {
      res.status(500).send({ error: "Failed to fetch users" });
    } else {
      res.json(users);
    }
  });
});

// /get/items/ (GET) Should return a JSON array containing the information for every item in the database.
app.get("/get/items/", (req, res) => {
  Item.find({}, (err, items) => {
    if (err) {
      res.status(500).send({ error: "Failed to fetch items" });
    } else {
      res.json(items);
    }
  });
});

// /get/listings/USERNAME (GET) Should return a JSON array containing every listing (item)for the user USERNAME.
app.get("/get/listings/:username", (req, res) => {
  const username = req.params.username;

  // Find user by username
  User.findOne({ username: username })
    .populate("listings") // populate listings of that user
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ error: "Failed to fetch listings" });
      } else if (!user) {
        res.status(404).send({ error: "User not found" });
      } else {
        res.json(user.listings);
      }
    });
});

// /get/purchases/USERNAME (GET) Should return a JSON array containing every purchase (item) for the user USERNAME
app.get("/get/purchases/:username", (req, res) => {
  const username = req.params.username;

  // Find user by username
  User.findOne({ username: username })
    .populate("purchases") // populate purchases of that user
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ error: "Failed to fetch purchases" });
      } else if (!user) {
        res.status(404).send({ error: "User not found" });
      } else {
        res.json(user.purchases);
      }
    });
});

// /search/users/KEYWORD (GET) Should return a JSON list of every user whose username has the substring KEYWORD.
app.get("/search/users/:keyword", (req, res) => {
  const keyword = req.params.keyword;

  // Create a case-insensitive regular expression search
  const regex = new RegExp(keyword, "i");

  // Find users by username containing the keyword
  User.find({ username: regex }, (err, users) => {
    if (err) {
      res.status(500).send({ error: "Failed to search for users" });
    } else {
      res.json(users);
    }
  });
});

// /search/items/KEYWORD (GET) Should return a JSON list of every item whose description has the substring KEYWORD.
app.get("/search/items/:keyword", (req, res) => {
  const keyword = req.params.keyword;

  // Create a case-insensitive regular expression search
  const regex = new RegExp(keyword, "i");

  // Find items by description containing the keyword
  Item.find({ description: regex }, (err, items) => {
    if (err) {
      res.status(500).send({ error: "Failed to search for items" });
    } else {
      res.json(items);
    }
  });
});

// /add/user/ (POST) Should add a user to the database. The username and password should be sent as POST parameter(s).
app.post("/add/user/", (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .send({ error: "Both username and password are required" });
  }

  // Create a new user instance
  const newUser = new User({
    username: username,
    password: password,
    listings: [],
    purchases: [],
  });

  // Save the new user to the database
  newUser.save((err, savedUser) => {
    if (err) {
      if (err.code === 11000) {
        // Duplicate key error (username already exists)
        return res.status(400).send({ error: "Username already exists" });
      }
      return res.status(500).send({ error: "Failed to add user" });
    }
    res
      .status(201)
      .send({ message: "User added successfully", userId: savedUser._id });
  });
});

/**
 * /add/item/USERNAME (POST) Should add an item to the database. The items information
 * (title, description, image, price, status) should be included as POST parameters.
 * The item should be added the USERNAMEs list of listings.
 */
app.post("/add/item/:username", (req, res) => {
  const username = req.params.username;
  const { title, description, image, price, stat } = req.body;

  // Check if all necessary parameters are provided
  if (!title || !description || !image || !price || stat === undefined) {
    return res
      .status(400)
      .send({ error: "All item information must be provided" });
  }

  // Create a new item instance
  const newItem = new Item({
    title,
    description,
    image,
    price,
    stat,
  });

  // Save the new item to the database
  newItem.save((err, savedItem) => {
    if (err) {
      return res.status(500).send({ error: "Failed to add item" });
    }

    // Add the saved item's ID to the user's list of listings
    User.findOneAndUpdate(
      { username: username },
      { $push: { listings: savedItem._id } }, // Push the the item to the User's listings list
      { new: true, useFindAndModify: false }, // Return updated document and disable deprecated 'findAndModify'
      (err, user) => {
        if (err) {
          return res
            .status(500)
            .send({ error: "Failed to update user listings" });
        } else if (!user) {
          return res.status(404).send({ error: "User not found" });
        }
        res
          .status(201)
          .send({ message: "Item added successfully", itemId: savedItem._id });
      }
    );
  });
});

app.listen(port, () =>
  console.log(`App listening at http://localhost:${port}`)
);
