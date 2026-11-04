const PAGE_SIZE = 10;

// Only these tables and columns can be read. Names come from this list and never from the request,
// so a request can't reach other tables or inject SQL.
const TABLES = {
  Products: {
    description: 'Items in the product catalog',
    key: 'ProductId',
    columns: ['ProductId', 'Name', 'Category', 'UnitPrice', 'InStock']
  },
  Customers: {
    description: 'Customer companies and contacts',
    key: 'CustomerId',
    columns: ['CustomerId', 'Company', 'ContactName', 'City', 'Country']
  },
  Orders: {
    description: 'Orders placed by customers',
    key: 'OrderId',
    columns: ['OrderId', 'CustomerId', 'ProductId', 'Quantity', 'OrderDate', 'Status']
  }
};

const json = (status, body) => ({ status, jsonBody: body });

function positiveInt(value) {
  return /^[1-9]\d{0,8}$/.test(value || '') ? Number(value) : undefined;
}

function safeFileName(name) {
  return name.replace(/[^\w.-]+/g, '_');
}

/** Creates the HTTP handlers. `query` runs SQL, so tests can pass in a fake database. */
function createHandlers(query, { allowUnauthenticated = false } = {}) {
  // App Service Authentication validates the token and adds this header. If authentication was left
  // switched off, requests have no header, and the API refuses them rather than exposing data.
  const guarded = handler => async (request, context) => {
    if (!allowUnauthenticated && !request.headers.get('x-ms-client-principal-id')) {
      return json(401, { error: 'Authentication is required.' });
    }
    try {
      return await handler(request);
    } catch (error) {
      // The details go to the logs. SQL errors aren't sent to the browser.
      context.error(error);
      return json(500, { error: 'The database request failed. See the Function App logs for details.' });
    }
  };

  return {
    listTables: guarded(async () => {
      const tables = [];
      for (const name of Object.keys(TABLES)) {
        const [{ total }] = await query(`SELECT COUNT_BIG(*) AS total FROM dbo.[${name}]`);
        tables.push({ name, description: TABLES[name].description, rowCount: Number(total) });
      }
      return json(200, tables);
    }),

    getRows: guarded(async request => {
      const name = request.params.name;
      if (!Object.prototype.hasOwnProperty.call(TABLES, name)) return json(404, { error: 'Unknown table.' });
      const pageParam = request.query.get('page');
      const page = pageParam === null ? 1 : positiveInt(pageParam);
      if (!page) return json(400, { error: 'The page must be a positive whole number.' });

      const { key, columns } = TABLES[name];
      const [{ total }] = await query(`SELECT COUNT_BIG(*) AS total FROM dbo.[${name}]`);
      const rows = await query(
        `SELECT ${columns.map(c => `[${c}]`).join(', ')} FROM dbo.[${name}] ORDER BY [${key}] OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
        { offset: (page - 1) * PAGE_SIZE, pageSize: PAGE_SIZE }
      );
      return json(200, { name, columns, rows, page, pageSize: PAGE_SIZE, totalRows: Number(total) });
    }),

    listFiles: guarded(async () => {
      const files = await query(
        'SELECT DocumentId AS id, FileName AS name, ContentType AS contentType, Description AS description, DATALENGTH(Content) AS size, UpdatedAt AS updatedAt FROM dbo.Documents ORDER BY FileName'
      );
      return json(200, files);
    }),

    getFileContent: guarded(async request => {
      const id = positiveInt(request.params.id);
      if (!id) return json(400, { error: 'The file id must be a positive whole number.' });
      const [file] = await query('SELECT FileName, ContentType, Content FROM dbo.Documents WHERE DocumentId = @id', { id });
      if (!file) return json(404, { error: 'File not found.' });
      return {
        status: 200,
        body: file.Content,
        headers: {
          'Content-Type': file.ContentType,
          // Stops stored content from running if someone opens this URL directly.
          'Content-Disposition': `attachment; filename="${safeFileName(file.FileName)}"`,
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'private, no-store'
        }
      };
    })
  };
}

module.exports = { createHandlers, PAGE_SIZE, TABLES };
