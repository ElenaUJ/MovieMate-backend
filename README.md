# MovieMate - The Backend

## Table of Contents

- [Overview](#overview)
- [Links](#links)
- [Features](#features)
  - [Data Operations Enabled by HTTP Requests](#data-operations-enabled-by-http-requests)
  - [Authentication and Authorization](#authentication-and-authorization)
  - [Data Validation and Security](#data-validation-and-security)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setting Up Your MongoDB Database](#setting-up-your-mongodb-database)
  - [How to Run](#how-to-run)
- [Process](#process)
  - [Main Technologies and Dependencies](#main-technologies-and-dependencies)
  - [Linting and Formatting](#linting-and-formatting)
  - [API Documentation](#api-documentation)

## Overview

The MovieMate movie app will provide users with access to information about different movies, directors, and genres. Users will be able to register, update their personal information, and manage a list of their favourite movies.

The server-side comprises a well-designed REST API and architected NoSQL database, built using JavaScript, Node.js, Express and MongoDB.

## Links

- [API Documentation](https://myflix-movie-app-elenauj.onrender.com/documentation.html)
- [API](https://myflix-movie-app-elenauj.onrender.com/)
- [Code URL](https://github.com/ElenaUJ/MyFlix-movie-app)

## Features

### Data Operations Enabled by HTTP Requests

- Returns a list of ALL movies to the user
- Returns data (description, genre, director, image URL, whether it’s featured or not) about a single movie by title to the user
- Returns data about a genre (description) by name/title (e.g., “Drama”)
- Returns all movies with a certain genre by name/title
- Returns data about a director (bio, birth year, death year) by name
- Returns all movies by a certain director by name
- Allows new users to register
- Allows users to update their user info (username, password, email, date of birth)
- Allows users to add a movie to their list of favorites
- Allows users to remove a movie from their list of favorites
- Allows existing users to deregister

### Authentication and Authorization

For this app, basic HTTP authentication has been implemented for user login, and JWT-based authentication for all other requests (except user registration which is accessible to anonynmous users).

_This is an unfinished solution, because right now a user would be authorized to access other user's information or even make changes. I am planning to address this in the future._

### Data Validation and Security

CORS middleware is implemented.

Passwords are hashed.

Data input via user registration and update are validated on the backend (username, password, email are required, username is not to contain special characters, email has to be in email format).

## Getting Started

### Prerequisites

Ensure you have the following prerequisites installed on your system:

- Node.js
- npm

### Setting Up Your MongoDB Database

Before running the project, you'll need to set up your own MongoDB database instance. Here's how:

**Installation of MongoDB**

Install MongoDB locally or use an existing MongoDB server.

**Database Creation**

Create a new MongoDB database for this project (e.g., `myFlixDB`) with the following basic structure:

_Collections:_

- `users`: Stores user data
- `movies`: Stores movie data

_Relationships:_

- Users can save movies to their favorites list.

Please note that this is a simplified explanation. For more information about the database schema and relationships, please reach out to me via ulbrichtjones@gmail.com.

For detailed instructions on creating a MongoDB database, please refer to the [MongoDB Documentation](https://docs.mongodb.com/manual/administration/install-community/).

### How to Run

**Installation**

1. _Clone the Repository:_
   Open your terminal and enter the following command to clone the repository:

   `git clone https://github.com/ElenaUJ/MyFlix-movie-app.git`

2. _Navigate to the Project Directory:_
   Change your working directory to the project folder by entering this command:

   `cd MovieMate-backend`

3. _Install Dependencies:_
   Run the following command to install the required dependencies:

   `npm install`

**Configuration**

1. Open the project in your preferred code editor.

2. Open the `index.js` file.

3. Comment out the remote database connection line:

```js
// mongoose.connect(process.env.CONNECTION_URI);
```

4. Uncomment the local database connection line:

```js
mongoose.connect('mongodb://localhost:27017/myFlixDB');
```

5. Save your changes.

**Run the App:**

1. Start the project using the following command:

   `npm start`

2. Open your web browser and go to `http://localhost:8080` to access the application.

If all goes well, you should see the project running locally.

## Process

### Main Technologies and Dependencies

**Technologies:** Node.js, Express, MongoDB

**Dependencies:** For a complete list of dependencies, please refer to the [package.json](./package.json) file.

### Linting and Formatting

- ESLint Rules: [View rules](https://github.com/mydea/simple-pokedex-app/blob/master/.eslintrc)
- Prettier configuration: [View configuration](https://stackoverflow.com/questions/55430906/prettier-single-quote-for-javascript-and-json-double-quote-for-html-sass-and-c)
