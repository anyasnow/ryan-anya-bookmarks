const BookmarksService = {
    getAllBookmarks(knex) {
        return knex.select('*').from('bookmarks')
    },

    getById(knex, id) {
        return knex.from('bookmarks').select('*').where('id', id).first()
    },

    deleteBookmark(knex, id) {
        return knex
            .from('bookmarks')
            .where({ id })
            .delete()
    },

    insertBookmark(knex, newBookmark) {
        return knex
            .insert(newBookmark)
            .into('bookmarks')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },

    updateBookmark(knex, id, newBookmarkFields) {
        return knex
            .from('bookmarks')
            .where({ id })
            .update(newBookmarkFields)
    }
}


module.exports = BookmarksService