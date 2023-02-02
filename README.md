# MyFlix-movie-app - The Backend

## Table of Contents

- [Overview](#overview)
- [Links](#links)
- [Process](#process)
  - [Programming Languages](#programming-languages)
  - [Dependencies](#dependencies)
- [Features](#features)
  - [Data Operations Enabled by HTTP Requests](#data-operations-enabled-by-http-requests)
  - [Authentication and Authorization](#authentication-and-authorization)
  - [Data Validation and Security](#data-validation-and-security)

## Overview

The MyFlix movie app will provide users with access to information about different movies, directors, and genres. Users will be able to register, update their personal information, and manage a list of their favourite movies.

The server-side comprises a well-designed REST API and architected NoSQL database, built using JavaScript, Node.js, Express and MongoDB.

## Links

- [Documentation](https://myflix-movie-app-elenauj.onrender.com/documentation.html)
- [API](https://myflix-movie-app-elenauj.onrender.com/)
- [Code URL](https://https://github.com/ElenaUJ/MyFlix-movie-app)

## Process

### Programming Languages

- JavaScript
- HTML/CSS

### Dependencies

- MongoDB version 6.0.3
- Node.js version 18.12.1
  - express 4.18.2
  - bcrypt 5.1.0
  - body-parser 1.20.1
  - cors 2.8.5
  - express 4.18.2
  - express-validator 6.14.3
  - jsonwebtoken 9.0.0
  - mongoose 6.8.4
  - morgan 1.10.0
  - passport 0.6.0
  - passport-jwt 4.0.1
  - passport-local 1.0.0
- [ESLint rules](https://github.com/mydea/simple-pokedex-app/blob/master/.eslintrc)
- [Prettier configuration](https://stackoverflow.com/questions/55430906/prettier-single-quote-for-javascript-and-json-double-quote-for-html-sass-and-c)

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
