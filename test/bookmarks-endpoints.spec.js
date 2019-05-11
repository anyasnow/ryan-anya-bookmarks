const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe(`Bookmarks App`, () => {
    let db

    before(`make knex instance`, () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    before(`clean the table`, () => db('bookmarks').truncate())
    afterEach(`cleanup`, () => db('bookmarks').truncate())
    after(`disconnect from db`, () => db.destroy())

    describe(`GET /bookmarks`, () => {
        context(`Given there are bookmarks in the database`, () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach(`insert bookmarks`, () => {
                return db
                    .insert(testBookmarks)
                    .into('bookmarks')
            })

            it(`GET /bookmarks responds with 200 and all of the bookmarks`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .expect(200, testBookmarks)
            })
        })

        context(`Given no bookmarks`, () => {
            it(`Responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .expect(200, [])
            })
        })
    })

    describe(`GET /bookmarks/:bookmarks_id`, () => {
        context(`Given there are bookmarks in the database`, () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach(`insert bookmarks`, () => {
                return db
                    .insert(testBookmarks)
                    .into('bookmarks')
            })

            it(`GET /bookmarks/:bookmarks_id responds with 200 and the specified bookmark`, () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .expect(200, expectedBookmark)
            })
        })

        context(`Given no bookmarks`, () => {
            it(`Responds with 404`, () => {
                const bookmarkId = 12345
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .expect(404, {
                        error: {
                            message: `Bookmark doesn't exist`
                        }
                    })
            })
        })
    })
})