const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray, makeMaliciousBookmarks } = require('./bookmarks.fixtures')

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

    describe(`GET /api/bookmarks`, () => {
        context(`Given there are bookmarks in the database`, () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach(`insert bookmarks`, () => {
                return db
                    .insert(testBookmarks)
                    .into('bookmarks')
            })

            it(`GET /api/bookmarks responds with 200 and all of the bookmarks`, () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .expect(200, testBookmarks)
            })
        })

        context(`Given no bookmarks`, () => {
            it(`Responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .expect(200, [])
            })
        })

        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark, sanitizedBookmark } = makeMaliciousBookmarks()

            before(`insert malicious bookmark`, () => {
                return db.insert(maliciousBookmark).into('bookmarks')
            })

            it(`Removes XSS attack content`, () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(sanitizedBookmark.title)
                        expect(res.body[0].description).to.eql(sanitizedBookmark.description)
                    })
            })
        })
    })

    describe(`GET /api/bookmarks/:bookmarks_id`, () => {
        context(`Given there are bookmarks in the database`, () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach(`insert bookmarks`, () => {
                return db
                    .insert(testBookmarks)
                    .into('bookmarks')
            })

            it(`GET /api/bookmarks/:bookmarks_id responds with 200 and the specified bookmark`, () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .expect(200, expectedBookmark)
            })
        })

        context(`Given no bookmarks`, () => {
            it(`Responds with 404`, () => {
                const bookmarkId = 12345
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .expect(404, {
                        error: {
                            message: `Bookmark doesn't exist`
                        }
                    })
            })
        })

        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark, sanitizedBookmark } = makeMaliciousBookmarks()

            beforeEach(`insert malicious bookmark`, () => {
                return db.insert(maliciousBookmark).into('bookmarks')
            })

            it(`Removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/bookmarks/${maliciousBookmark.id}`)
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(sanitizedBookmark.title)
                        expect(res.body.description).to.eql(sanitizedBookmark.description)
                    })
            })
        })
    })

    describe(`POST /api/bookmarks`, () => {
        it(`creates a bookmark, responding with 201 and the new bookmark`, () => {
            const newBookmark = {
                title: 'Test title',
                url: 'test.url',
                description: 'Test description',
                rating: 3
            }

            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.title).to.be.a('string')
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.url).to.be.a('string')
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.description).to.be.a('string')
                    expect(res.body.rating).to.be.a('number')
                    expect(res.body.rating).to.be.above(0)
                    expect(res.body.rating).to.be.below(6)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
                })
                .then(res =>
                    supertest(app)
                        .get(`/api/bookmarks/${res.body.id}`)
                        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                        .expect(res.body)
                )
        })
        const requiredFields = ['title', 'url', 'description', 'rating']

        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'Test title',
                url: 'test.url',
                description: 'Test description',
                rating: 3
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newBookmark[field]

                return supertest(app)
                    .post('/api/bookmarks')
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .send(newBookmark)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })
    })

    describe(`DELETE /api/bookmarks/:bookmark_id`, () => {
        context(`Given no bookmarks`, () => {
            it(`Responds with 404`, () => {
                const bookmarkId = 12345
                return supertest(app)
                    .delete(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .expect(404, {
                        error: {
                            message: `Bookmark doesn't exist`
                        }
                    })
            })
        })

        context(`Given there are bookmarks`, () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach(`insert bookmarks`, () => {
                return db.insert(testBookmarks).into('bookmarks')
            })

            it(`responds with 204 and deletes the specified bookmark`, () => {
                const idToDelete = 3
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToDelete)

                return supertest(app)
                    .delete(`/api/bookmarks/${idToDelete}`)
                    .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/bookmarks`)
                            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                            .expect(expectedBookmarks)
                    })
            })
        })
    })

})