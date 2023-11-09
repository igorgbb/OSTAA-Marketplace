/*
 * Author: Igor Gabriel Bezerra Bernardon, John Ko
 * Date: 11/07/2023
 * Class: CSC 337
 * Instructor: Benjamin Dicken
 *
 * Description: This script is responsible for setting up
 * the client side of the OSTAA Marketplace application.
 * Allowing the client to send requests to create users,
 * login, add listings, purchase listings, display listings
 * etc.
 */

function addUser() {
  /**
   * Description: This function is responsible for adding
   * users to the marketplace, by gathering the Client's input
   * for username and password and sending a request to the server.
   *
   * Parameters: None
   *
   * Return: None
   */
  const username = document.getElementById("usernameCreate").value;
  const password = document.getElementById("passwordCreate").value;

  fetch("/add/user/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => alert(data.message || data.error))
    .catch((error) => console.error("Error:", error));
}

function login() {
  /**
   * Description: This function is responsible for sending
   * a login request to the server and loging the user in.
   * The request is to /account/login/
   *
   * Parameters: None
   *
   * Return: None
   */
  let us = document.getElementById("usernameLogin").value;
  let pw = document.getElementById("passwordLogin").value;
  let data = { username: us, password: pw };
  let p = fetch("/account/login/", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
  p.then((response) => {
    return response.text();
  }).then((text) => {
    console.log(text);
    if (text.startsWith("SUCCESS")) {
      alert(text);
      var welcomeMsg = "Welcome " + us + "! What would you like to do?";
      localStorage.setItem("welcomeMsg", welcomeMsg);
      localStorage.setItem("username", us);
      window.location.href = "./home.html";
    } else {
      document.getElementById("loginFail").innerText =
        "Issue logging with that info";
    }
  });
}

function createListings() {
  /**
   * Description: This function is responsible for sending
   * a request to /add/item/:username to create a listing
   * for the user.
   *
   * Parameters: None
   *
   * Return: None
   */
  const username = localStorage.getItem("username");
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const image = document.getElementById("image").files[0]; // Get the file from the file input
  const price = parseFloat(document.getElementById("price").value);
  const stat = document.getElementById("stat").value;

  // Create a FormData object to hold the form data
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("image", image); // Append the image file
  formData.append("price", price);
  formData.append("stat", stat);

  fetch(`/add/item/${username}`, {
    method: "POST",
    body: formData, // Send the form data
    // Don't set Content-Type header, the browser will set it with the correct boundary
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((error) => {
          throw new Error(error.error);
        });
      }
      return response;
    })
    .then(() => {
      // navigate to home.html or refresh the page
      window.location.href = "/home.html";
    })
    .catch((error) => {
      // handle the error
      console.error("Error:", error);
    });
}

function searchListings() {
  /**
   * Description: This function is responsible for sending
   * a request to the server searching for listings, and
   * displaying the listing results in the page.
   *
   * Parameters: None
   *
   * Return: None
   */
  let keyword = document.getElementById("material").value;
  let url = "/search/items/" + keyword;

  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((objects) => {
      populateItems(objects);
    })
    .catch((error) => {
      console.log(error);
    });
}

function viewListings() {
  /**
   * Description: This function is responsible for sending
   * a request to the server to get information regarding
   * a the User's associated listings and displaying them
   * on the page.
   *
   * Parameters: None
   *
   * Return: None
   */
  const username = localStorage.getItem("username");
  let url = "/get/listings/" + username;

  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((objects) => {
      populateItems(objects);
    })
    .catch((error) => {
      console.log(error);
    });
}

function viewPurchases() {
  /**
   * Description: This function is responsible for sending
   * a request to the server to get information regarding
   * the User's associated  purchased listings and displaying
   * them on the page.
   *
   * Parameters: None
   *
   * Return: None
   */
  const username = localStorage.getItem("username");
  let url = "/get/purchases/" + username;

  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((objects) => {
      populateItems(objects);
    })
    .catch((error) => {
      console.log(error);
    });
}

function purchaseItem(item) {
  /**
   * Description: This function is responsible for sending
   * a request to the server to purhase an item, and then
   * display the necessary changes on the page.
   *
   * Parameters:
   * item : The item object of the item to be purchased.
   *
   * Return: None
   */
  const itemId = item._id;
  const username = localStorage.getItem("username");

  fetch(`/add/purchase/${itemId}/` + username, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Purchase failed.");
      }
      return response.json();
    })
    .then((data) => {
      alert("Purchase successful!");
      viewPurchases();
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("There was an issue with the purchase.");
    });
}

function populateItems(objects) {
  /**
   * Description: This function is responsible for populating
   * the HTML file with the Listings gattered by a JSON
   * containing the Listings information.
   *
   * Parameters:
   * objects = A JSON object with all the Listings information.
   *
   * Return: None
   */
  const itemListTab = document.getElementById("itemListTab");
  itemListTab.innerHTML = ""; // Clear any existing content
  console.log(objects);

  // Loop through each object and create HTML elements for each listing
  objects.forEach((item) => {
    // Create a container for each item
    let itemDiv = document.createElement("div");
    itemDiv.className = "Item";

    // Add title
    let title = document.createElement("h3");
    title.innerText = item.title;
    itemDiv.appendChild(title);

    if (item.image && item.image.data) {
      let image = document.createElement("img");
      // Assuming `item.image.data` is the buffer received from the server
      // and it's already Base64 encoded.
      let base64String = btoa(
        String.fromCharCode(...new Uint8Array(item.image.data))
      );
      image.src = `data:image/png;base64,${base64String}`;
      image.alt = item.description;
      image.width = 300;
      image.height = 200;
      itemDiv.appendChild(image);
    }

    // Add description
    let description = document.createElement("p");
    description.innerText = item.description;
    itemDiv.appendChild(description);

    // Add price
    let price = document.createElement("p");
    price.innerText = "Price: $" + item.price;
    itemDiv.appendChild(price);

    // Add status
    if (item.stat === "SALE") {
      let purchaseButton = document.createElement("button");
      purchaseButton.innerText = "Purchase Now";
      purchaseButton.onclick = function () {
        purchaseItem(item);
      };
      itemDiv.appendChild(purchaseButton);
    } else {
      // Add status text if not for sale
      let status = document.createElement("p");
      status.innerText = "Status: " + item.stat;
      itemDiv.appendChild(status);
    }

    // Append the itemDiv to the itemListTab
    itemListTab.appendChild(itemDiv);
  });
}

// Submit item
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("itemForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      createListings();
    });
});

// Login
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("userForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      login();
    });
});

// Create User
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("createForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      addUser();
    });
});
