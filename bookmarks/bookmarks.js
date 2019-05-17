const express = require('express')
const xss = require('xss')
const path = require('path')
const BookmarksService = require('../src/bookmarks-service')

const bookmarkRouter = express.Router()
const jsonParser = express.json();

const serializeBookmark = bookmark => ({
    ...bookmark,
    title: xss(bookmark.title),
    url: xss(bookmark.url),
    description: xss(bookmark.description)
})

bookmarkRouter.route('/')
    .get((req, res, next) => {
        BookmarksService.getAllBookmarks(req.app.get('db'))
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { title, url, description, rating } = req.body
        const newBookmark = { title, url, description, rating }

        for (const [key, value] of Object.entries(newBookmark))
            if (value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })

        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
                    .json(serializeBookmark(bookmark))
            })
            .catch(next)
    })

bookmarkRouter.route('/:bookmark_id')
    .all((req, res, next) => {
        BookmarksService.getById(
            req.app.get('db'),
            req.params.bookmark_id
        )
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist` }
                    })
                }
                res.bookmark = bookmark
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeBookmark(res.bookmark))
    })
    .delete((req, res, next) => {
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.bookmark_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { title, url, description, rating } = req.body
        const bookmarkToUpdate = { title, url, description, rating }

        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: { message: `Request body must contain either 'title', 'url', 'description' or 'rating'` }
            })
        }

        BookmarksService.updateBookmark(
            req.app.get('db'),
            req.params.bookmark_id,
            bookmarkToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = bookmarkRouter