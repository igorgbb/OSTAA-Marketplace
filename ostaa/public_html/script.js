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
function addUser() {
  /**
   * Description: This function is responsible for adding
   * users to the Database, by gathering the Client's input
   * for username and password.
   */
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

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

function addItem() {
    /**
     * This functiion is responsible for adding an Item to the 
     * Database associated with a Username provided by the User.
     */
  const username = document.getElementById("itemUsername").value;
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

document
  .getElementById("userForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    addUser();
  });

document
  .getElementById("itemForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    addItem();
  });
