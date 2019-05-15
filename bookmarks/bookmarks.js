const express = require('express')
const xss = require('xss')
const logger = require('./logger.js')
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
                    .location(`/bookmarks/${bookmark.id}`)
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

module.exports = bookmarkRouter