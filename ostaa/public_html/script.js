/*
 * Author: Igor Gabriel Bezerra Bernardon, John Ko
 * Date: 10/30/2023
 * Class: CSC 337
 * Instructor: Benjamin Dicken
 *
 * Description: This script is responsible for setting up
 * the client side of the testing of OSTAA marketplace application.
 * The user will be able to create User's and Listing's that will
 * be associated with a username provide by the user.
 */
function addUser() {  // need to check the username already exist or not
  /**
   * Description: This function is responsible for adding
   * users to the Database, by gathering the Client's input
   * for username and password.
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

function createListings() {
    /**
     * This function is responsible for adding an Item to the 
     * Database associated with a Username provided by the User.
     */
  const username = document.getElementById("usernameLogin").value;
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const image = document.getElementById("image").value;
  const price = parseFloat(document.getElementById("price").value);
  const stat = document.getElementById("stat").value;

  fetch(`/add/item/${username}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, description, image, price, stat }),
  })
    .then((response) => response.json())
    .then((data) => alert(data.message || data.error))
    .catch((error) => console.error("Error:", error));
}

function login() {
  let us = document.getElementById('usernameLogin').value;
  let pw = document.getElementById('passwordLogin').value;
  let data = {username: us, password: pw};
  let p = fetch('/account/login/', {
    method: 'POST', 
    body: JSON.stringify(data),
    headers: {"Content-Type": "application/json"}
  });
  p.then((response) => {
    return response.text();
  }).then((text) => {
    console.log(text);
    if (text.startsWith('SUCCESS')) {
      alert(text);
      window.location.href = './home.html';
    } else {
      document.getElementById("loginFail").innerText = "Issue loggin with that info";
    }
  });
}

function searchListings() { 
  let keyword = document.getElementById("material").value;
  let url = 'http://localhost:80/search/items/' + keyword;

  fetch(url).then((response) => {
    return response.text();
  }).then((text) => { 
    // add information of items into home.html
  }).catch( (error) => {
    console.log(error);
  });
}

function viewListings() {
  let username = document.getElementById("username").value;
  let url = 'http://localhost:80/get/listings/' + username;

  fetch(url).then((response) => {
    return response.text();
  }).then((text) => { 
    // add information of items into home.html
  }).catch( (error) => {
    console.log(error);
  });
}

function viewPurchases() {
  let username = document.getElementById("username").value;
  let url = 'http://localhost:80/get/purchases/' + username;

  fetch(url).then((response) => {
    return response.text();
  }).then((text) => { 
    // add information of items into home.html
  }).catch( (error) => {
    console.log(error);
  });
}

document
  .getElementById("createForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    addUser();
  });

document
  .getElementById("userForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    login();
  });

document
  .getElementById("itemForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    alert("1");
    createListings();
  });