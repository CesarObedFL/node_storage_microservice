# JSON Storage Microservice

A lightweight, secure, and extensible Node.js microservice for storing and managing JSON files organized by project. Built with Express 5, it provides a file‑based NoSQL‑like API with OAuth‑style token authentication.

## Features
- Project‑based storage – Each project has its own folder inside the storage/ directory.
- Full CRUD for JSON files – Create, read, update, replace, and delete JSON documents.
- Record‑level operations – Treat JSON files as arrays of records (like Firebase) with auto‑generated IDs.
- Token authentication – Each project uses a unique Bearer token; tokens can be created/revoked via an admin API.
- Master token – Administrative endpoints are protected by a master token.
- Secure by design – Prevents path traversal attacks and validates all inputs.
- Modern ES modules – Uses import/export and Node.js 20+.
- Comprehensive test suite – 36+ integration tests with Vitest and Supertest.

## Technologies
- Node.js (v20+)
- Express 5
- Vitest + Supertest for testing

dotenv for configuration
ES Modules ("type": "module")

# Installation
bash

```
git clone <repository-url>
cd node_storage_microservice
pnpm install   # or npm install
```

# Configuration
Create a .env file in the config/ directory:

```
PORT=3100
STORAGE_PATH=./storage
MASTER_TOKEN=your_master_token_here
```

# Static project tokens (optional, can also be created via admin API)
PROJECT_TOKEN_demo=demo123
PROJECT_TOKEN_test=test456
MASTER_TOKEN – Required for admin endpoints (create/revoke tokens).

PROJECT_TOKEN_* – Optional static tokens; if not provided, tokens can be generated via the admin API.

STORAGE_PATH – Where project folders are stored (default: ./storage).

# Authentication
All storage endpoints (under /storage) require a Bearer token in the Authorization header:

text
Authorization: Bearer <project_token>
Admin endpoints (under /admin/tokens) require the master token:

text
Authorization: Bearer <master_token>
Token Management
Use the admin API to create, list, and revoke project tokens:

| Method |	Endpoint |	Description |
| :-------- | :------- | :------- | 
| POST | /admin/tokens | Create a new token for a project |
| GET |	/admin/tokens |	List all projects that have tokens |
| DELETE |	/admin/tokens/:token | Revoke a specific token |


API Endpoints
Health Check

| Method | Endpoint | Description |
| :-------- | :------- | :------- | 
| GET | /health	| Server health status (public) |


Admin & Utilities

| Method | Endpoint | Auth | Description |
| :-------- | :------- | :------- | :------- | 
| GET | /admin/projects | None | List all project folders
| GET | /test| None | Router test (returns {"message":"Router working"})


Project Management

| Method | Endpoint | Auth | Description |
| :-------- | :------- | :------- | :------- |
| POST | /storage/project/:project_name	| Project token	| Create a new project folder |
| DELETE | /storage/:project | Project token | Delete an entire project (folder + contents)


File Operations (CRUD)
All file endpoints use the project name from the URL (:project) and require a valid project token.

| Method | Endpoint | Description |
| :-------- | :------- | :------- | 
| GET | /storage/:project/list | List all .json files in the project |
| GET | /storage/:project/:filename | Retrieve the content of a JSON file |
| POST | /storage/:project/:filename | Create or replace a JSON file (body must be an object) |
| PUT | /storage/:project/:filename	| Merge (update) a JSON file (shallow merge) |
| PATCH | /storage/:project/:filename | Same as PUT (partial merge) |


Record Operations (Array‑based)
Treat a JSON file as an array of objects, each with an auto‑generated id.

| Method | Endpoint | Description |
| :-------- | :------- | :------- |
| GET | /storage/:project/:filename/records | List all records in the file |
| GET | /storage/:project/:filename/records/:record_id | Get a specific record by ID |
| POST | /storage/:project/:filename/records | Add a new record (auto‑generated ID) |
| PUT | /storage/:project/:filename/records/:record_id | Update a record (shallow merge) |
| DELETE | /storage/:project/:filename/records/:record_id | Delete a record by ID |


Note: If the file does not exist, POST /records creates it with an empty array. If the file contains an object instead of an array, it is automatically converted to an array (the object becomes the first record with a generated ID).

# Examples
1. Create a project token (admin)
bash
curl -X POST http://localhost:4000/admin/tokens \
  -H "Authorization: Bearer your_master_token" \
  -H "Content-Type: application/json" \
  -d '{"project": "my_project"}'
Response:

json
{
  "message": "Token created",
  "token": "abc123def456",
  "project": "my_project"
}

2. Create a project
bash
curl -X POST http://localhost:4000/storage/project/my_project \
  -H "Authorization: Bearer abc123def456"

3. Create a JSON file
bash
curl -X POST http://localhost:4000/storage/my_project/data.json \
  -H "Authorization: Bearer abc123def456" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "age": 30}'

4. Add a record
bash
curl -X POST http://localhost:4000/storage/my_project/data.json/records \
  -H "Authorization: Bearer abc123def456" \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob", "age": 25}'
Response:

json
{
  "message": "Record added",
  "id": "k4x7_ab12",
  "record": { "id": "k4x7_ab12", "name": "Bob", "age": 25 }
}

5. List records
bash
curl http://localhost:4000/storage/my_project/data.json/records \
  -H "Authorization: Bearer abc123def456"

6. Delete a project
bash
curl -X DELETE http://localhost:4000/storage/my_project \
  -H "Authorization: Bearer abc123def456"

# Testing
The project includes a full integration test suite using Vitest and Supertest.

bash
# Run all tests
pnpm test

# Run tests with coverage (requires @vitest/coverage-v8)
pnpm test:coverage
Tests cover:

Authentication (missing/invalid tokens)
Project CRUD
File CRUD (create, read, update, patch, delete)
Record CRUD (add, list, get, update, delete)
Error handling (400, 401, 404, 500)
Parameter validation
Security (path traversal prevention)

# Code Conventions
snake_case for variable and function names (e.g., list_files, get_safe_path).

PHP‑style documentation in English (@param, @returns, @throws, @route).

Error messages in English.

ES modules (import/export).

Linting (if configured) should follow standard ESLint rules.


# Contributing
Fork the repository.
Create a feature branch.
Write tests for new functionality.
Ensure all tests pass (pnpm test).
Submit a pull request.


## ☕ Support the Project

If you find this project useful, you can buy me a coffee to keep it going!

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/lato-orange.png)](https://buymeacoffee.com/cesarobedfl)

<b>Follow me! </b> <br>
<p align="left">
    <a href="https://github.com/CesarObedFL">
        <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
    </a>
    <a href="https://www.linkedin.com/in/cesarobedfigueroaluna/">
        <img src="https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
    </a>
</p>

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

Built with ❤️ using Node.js and Express.