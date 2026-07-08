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