storage-service/
├── .README.md                  # documentation
├── .env                        # environtment variables
├── .gitignore
├── package.json
├── server.js                   # enter point
├── config/
│   ├── index.js                # settings (.env loading)
│   └── projects.json           # auth token per project
├── middleware/
│   └── auth.js                 # oauth middleware
├── routes/
│   └── storage.js              # generic routes
├── controllers/
│   └── storageController.js
├── services/
│   └── storageService.js       # input/output logic
├── utils/
│   └── errors.js               # error handling
└── storage/                    # root storage folder
    └── project_1/
        └── data.json
    └── project_2/
        └── data.json


routes:

POST   /storage/project/:project_name   → create_project
DELETE /storage/:project                → delete_project
GET    /storage/:project                → list_files
GET    /storage/:project/:filename      → get_file
POST   /storage/:project/:filename      → create_or_replace_file
PUT    /storage/:project/:filename      → update_file
PATCH  /storage/:project/:filename      → patch_file