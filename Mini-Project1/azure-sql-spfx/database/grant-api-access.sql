-- Gives the Function App's managed identity read-only access.
-- Replace both <function-app-name> placeholders, then run this in the sample database signed in as the Entra admin.
CREATE USER [<function-app-name>] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [<function-app-name>];
