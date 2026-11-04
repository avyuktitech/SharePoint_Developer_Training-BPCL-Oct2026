const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandlers, PAGE_SIZE } = require('../src/catalog');

const signedIn = { 'x-ms-client-principal-id': 'user-1' };

function request({ params = {}, query = {}, headers = signedIn } = {}) {
  return {
    params,
    query: new URLSearchParams(query),
    headers: new Headers(headers)
  };
}

function setup(answer = () => []) {
  const calls = [];
  const errors = [];
  const query = async (text, params) => {
    calls.push({ text, params });
    return answer(text, params);
  };
  return { handlers: createHandlers(query), calls, errors, context: { error: e => errors.push(e) } };
}

test('every route refuses a request that App Service Authentication did not sign in', async () => {
  const { handlers, calls, context } = setup();
  for (const handler of Object.values(handlers)) {
    const res = await handler(request({ headers: {} }), context);
    assert.equal(res.status, 401);
  }
  assert.equal(calls.length, 0);
});

test('local development mode can skip the sign-in check', async () => {
  const handlers = createHandlers(async () => [], { allowUnauthenticated: true });
  const res = await handlers.listFiles(request({ headers: {} }), {});
  assert.equal(res.status, 200);
});

test('listTables returns each allowed table with its row count', async () => {
  const { handlers, context } = setup(() => [{ total: '7' }]);
  const res = await handlers.listTables(request(), context);
  assert.equal(res.status, 200);
  assert.deepEqual(res.jsonBody.map(t => [t.name, t.rowCount]), [['Products', 7], ['Customers', 7], ['Orders', 7]]);
});

test('getRows reads the requested page using parameters', async () => {
  const rows = [{ ProductId: 11 }];
  const { handlers, calls, context } = setup(text => (text.includes('COUNT_BIG') ? [{ total: 25 }] : rows));
  const res = await handlers.getRows(request({ params: { name: 'Products' }, query: { page: '2' } }), context);
  assert.equal(res.status, 200);
  assert.deepEqual(res.jsonBody.rows, rows);
  assert.equal(res.jsonBody.totalRows, 25);
  assert.deepEqual(calls[1].params, { offset: PAGE_SIZE, pageSize: PAGE_SIZE });
  assert.match(calls[1].text, /ORDER BY \[ProductId\] OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY/);
});

test('getRows refuses tables outside the allow list without running SQL', async () => {
  const { handlers, calls, context } = setup();
  for (const name of ['Documents', 'sys.tables', 'Products]; DROP TABLE Orders;--', 'constructor', '__proto__', 'products']) {
    const res = await handlers.getRows(request({ params: { name } }), context);
    assert.equal(res.status, 404, name);
  }
  assert.equal(calls.length, 0);
});

test('getRows refuses an invalid page', async () => {
  const { handlers, calls, context } = setup();
  for (const page of ['0', '-1', '1.5', 'abc', '', '1;DROP', '99999999999']) {
    const res = await handlers.getRows(request({ params: { name: 'Products' }, query: { page } }), context);
    assert.equal(res.status, 400, page);
  }
  assert.equal(calls.length, 0);
});

test('listFiles never selects the file content', async () => {
  const { handlers, calls, context } = setup();
  await handlers.listFiles(request(), context);
  assert.doesNotMatch(calls[0].text.replace('DATALENGTH(Content)', ''), /Content\b(?!Type)/);
});

test('getFileContent returns bytes with headers that stop content from running', async () => {
  const content = Buffer.from('<svg/>');
  const { handlers, calls, context } = setup(() => [{ FileName: 'my "logo".svg', ContentType: 'image/svg+xml', Content: content }]);
  const res = await handlers.getFileContent(request({ params: { id: '3' } }), context);
  assert.equal(res.status, 200);
  assert.equal(res.body, content);
  assert.deepEqual(calls[0].params, { id: 3 });
  assert.equal(res.headers['Content-Type'], 'image/svg+xml');
  assert.equal(res.headers['Content-Disposition'], 'attachment; filename="my_logo_.svg"');
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
});

test('getFileContent handles bad and unknown ids', async () => {
  const { handlers, calls, context } = setup(() => []);
  assert.equal((await handlers.getFileContent(request({ params: { id: '1 OR 1=1' } }), context)).status, 400);
  assert.equal(calls.length, 0);
  assert.equal((await handlers.getFileContent(request({ params: { id: '99' } }), context)).status, 404);
});

test('database errors are logged but not sent to the browser', async () => {
  const failure = new Error('Login failed for user secret-server');
  const { handlers, errors, context } = setup(() => { throw failure; });
  const res = await handlers.listFiles(request(), context);
  assert.equal(res.status, 500);
  assert.doesNotMatch(JSON.stringify(res.jsonBody), /secret-server/);
  assert.deepEqual(errors, [failure]);
});
