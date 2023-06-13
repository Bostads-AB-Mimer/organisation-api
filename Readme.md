# Organisation API

The Organisation API is a simple REST API built using Node.js, Express, and TypeScript that interacts with a Neo4j database. It allows users to perform CRUD operations on the database, retrieving and managing information about the organization's cost pools, responsibility areas, properties, and users. It also performs a scheduled input (cronjob) every 24 hours fetching, adding, updating and deleting selected users from the Microsoft Active directory, trough the Microsoft Graph API. 

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [File Structure](#file-structure)

## Installation

1. Clone the repository to your local machine.
2. Run `npm install` to install the required dependencies.
3. Create a `.env` file in the root directory and populate the required environment variables.
4. Run `npm run build` to compile the TypeScript code into JavaScript. The compiled code will be in the `dist` directory.
5. Run `npm start` to start the server.

## Usage

The API provides several endpoints to interact with the organization data.

## API Endpoints

- `/api/users`: Retrieve user records. (GET)
- `/api/costpools`: Retrieve cost pool records. (GET)
- `/api/responsibilityareas`: Retrieve responsibility area records. (GET)
  - `/api/responsibilityareas`: Create a relationship between a user, responsibility area, and cost pool. (POST)
  - `/api/responsibilityareas`: Delete a relationship between a user, responsibility area, and cost pool. (DELETE)
- `/api/properties`: Retrieve property records. (GET)

For the POST and DELETE operations on `/api/responsibilityareas`, the following parameters are required in the request body:

- `employeeId`: The ID of the employee.
- `responsibilityArea`: The ID of the responsibility area.
- `jobTitle`: The title of the job.

Please note that the DELETE operation removes the relationship between the user and the specified responsibility area, as well as between the user and the associated cost pool. The POST operation creates these relationships if they don't already exist.

## Environment Variables

Your `.env` file should include the following variables:

- `NEO4J_URI`: The URI of your Neo4j instance.
- `NEO4J_USER`: The username for your Neo4j database.
- `NEO4J_PASSWORD`: The password for your Neo4j database.
- `MICROSOFT_TENANTID`= The tenant AD for the microsoft graph API. 
- `MICROSOFT_CLIENTID`= The client id for the microsoft graph API.
- `MICROSOFT_SECRETVALUE`= The Secret value for the microsoft graph API.

## File Structure

- `src`:
  - `config`: Configuration for the database connection.
    - `db.ts` : Connection with the neo4j database
  - `controllers`: Controller functions for handling API requests.
    - `costPoolController.ts`
    - `responsibilityAreasController.ts`
    - `userController.ts`
  - `middleware`: Middleware functions for the API.
    - `auth.ts`
    - `error-handler.ts`
  - `integrations`: Code for integrating with the Microsoft Graph API.
    - `microsoftGraphAPI.ts`
  - `routes`: Definitions for the API endpoints.
    - `costPoolRoutes.ts`
    - `propertiesRoutes.ts`
    - `responsibilityAreasRoutes.ts`
    - `userRoutes.ts`
  - `services`: Services for data processing.
    - `UserService.ts` : Populates the database with users from Active diretory.
  - `scheduler`: Code for running scheduled tasks.
    - `cronJob.ts`
  - `index.ts`: Entry point for the API.
- `.env`: File for environment variables.
- `.gitignore`
- `Dockerfile`
- `package-lock.json`
- `package.json`
- `tsconfig.json`
- `structure.lua`
