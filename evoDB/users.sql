CREATE TABLE [dbo].[users]
(
  [Username] NVARCHAR(255) NOT NULL PRIMARY KEY,
  [PasswordHash] NVARCHAR(255) NOT NULL
)
