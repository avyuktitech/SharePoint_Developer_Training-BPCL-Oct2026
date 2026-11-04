const { app } = require('@azure/functions');
const { createHandlers } = require('../catalog');
const { query } = require('../db');

const handlers = createHandlers(query, {
  allowUnauthenticated: process.env.ALLOW_UNAUTHENTICATED_LOCAL_DEV === 'true'
});

// "anonymous" only turns off Functions keys. App Service Authentication checks the Entra ID token before these run.
const route = (name, path, handler) => app.http(name, { methods: ['GET'], authLevel: 'anonymous', route: path, handler });

route('listTables', 'tables', handlers.listTables);
route('getRows', 'tables/{name}', handlers.getRows);
route('listFiles', 'files', handlers.listFiles);
route('getFileContent', 'files/{id}/content', handlers.getFileContent);
