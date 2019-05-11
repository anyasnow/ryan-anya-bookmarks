module.exports = {
    PORT: process.env.PORT || 7000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DB_URL: process.env.DB_URL || 'postgresql://postgres@localhost/bookmarks',
}