-- Creates the sample tables and data. Safe to run again: it replaces these four tables only.
-- It has no GO separators, so it runs as-is in the Azure portal's Query editor.

DROP TABLE IF EXISTS dbo.Orders;
DROP TABLE IF EXISTS dbo.Customers;
DROP TABLE IF EXISTS dbo.Products;
DROP TABLE IF EXISTS dbo.Documents;

CREATE TABLE dbo.Products (
  ProductId INT NOT NULL PRIMARY KEY,
  Name NVARCHAR(100) NOT NULL,
  Category NVARCHAR(50) NOT NULL,
  UnitPrice DECIMAL(10, 2) NOT NULL,
  InStock BIT NOT NULL
);

CREATE TABLE dbo.Customers (
  CustomerId INT NOT NULL PRIMARY KEY,
  Company NVARCHAR(100) NOT NULL,
  ContactName NVARCHAR(100) NOT NULL,
  City NVARCHAR(50) NOT NULL,
  Country NVARCHAR(50) NOT NULL
);

CREATE TABLE dbo.Orders (
  OrderId INT NOT NULL PRIMARY KEY,
  CustomerId INT NOT NULL REFERENCES dbo.Customers (CustomerId),
  ProductId INT NOT NULL REFERENCES dbo.Products (ProductId),
  Quantity INT NOT NULL,
  OrderDate DATE NOT NULL,
  Status NVARCHAR(20) NOT NULL
);

CREATE TABLE dbo.Documents (
  DocumentId INT IDENTITY(1, 1) NOT NULL PRIMARY KEY,
  FileName NVARCHAR(200) NOT NULL,
  ContentType NVARCHAR(100) NOT NULL,
  Description NVARCHAR(200) NOT NULL,
  Content VARBINARY(MAX) NOT NULL,
  UpdatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
);

INSERT INTO dbo.Products (ProductId, Name, Category, UnitPrice, InStock) VALUES
(101, N'Trail backpack, 30 L', N'Outdoor', 79.00, 1),
(102, N'Insulated bottle', N'Outdoor', 24.50, 1),
(103, N'Wireless headset', N'Electronics', 129.99, 0),
(104, N'Standing desk', N'Office', 349.00, 1),
(105, N'Ergonomic chair', N'Office', 219.00, 1),
(106, N'USB-C dock', N'Electronics', 89.00, 1),
(107, N'Desk lamp', N'Office', 39.00, 1),
(108, N'Camping stove', N'Outdoor', 64.00, 0),
(109, N'Noise-cancelling earbuds', N'Electronics', 149.00, 1),
(110, N'Monitor arm', N'Office', 74.00, 1),
(111, N'Hiking poles', N'Outdoor', 45.00, 1),
(112, N'Webcam 4K', N'Electronics', 119.00, 1);

INSERT INTO dbo.Customers (CustomerId, Company, ContactName, City, Country) VALUES
(1, N'Fabrikam Traders', N'Asha Menon', N'Mumbai', N'India'),
(2, N'Northwind Retail', N'Daniel Reyes', N'Austin', N'United States'),
(3, N'Tailspin Outdoors', N'Priya Nair', N'Bengaluru', N'India'),
(4, N'Wingtip Supplies', N'Lena Fischer', N'Berlin', N'Germany'),
(5, N'Adventure Works', N'Omar Haddad', N'Dubai', N'United Arab Emirates'),
(6, N'Proseware Office', N'Grace Lee', N'Singapore', N'Singapore');

INSERT INTO dbo.Orders (OrderId, CustomerId, ProductId, Quantity, OrderDate, Status) VALUES
(5001, 1, 104, 4, '2026-10-02', N'Delivered'),
(5002, 2, 103, 10, '2026-10-05', N'Delivered'),
(5003, 3, 101, 25, '2026-10-09', N'Shipped'),
(5004, 4, 105, 6, '2026-10-12', N'Shipped'),
(5005, 5, 111, 30, '2026-10-15', N'Processing'),
(5006, 6, 106, 15, '2026-10-19', N'Processing'),
(5007, 1, 107, 12, '2026-10-22', N'Delivered'),
(5008, 2, 109, 8, '2026-10-26', N'Shipped'),
(5009, 3, 108, 5, '2026-10-29', N'Cancelled'),
(5010, 4, 110, 9, '2026-11-01', N'Processing'),
(5011, 5, 102, 40, '2026-11-02', N'Processing'),
(5012, 6, 112, 7, '2026-11-03', N'Processing');
