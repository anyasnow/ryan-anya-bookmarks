const express = require('express')
const bookmarkRouter = express.Router()
const uuid = require('uuid/v4')
const logger = require('./logger.js')
const bookmarks = require('../src/store.js');
const bodyParser = express.json();


bookmarkRouter
    .route('/bookmarks')
    .get((req, res) => {
            res.json(bookmarks);
    })
    .post(bodyParser, (req, res) => {
        const { title, url } = req.body;
        if (!title) {
            logger.error(`Title is required`);
            return res
                .status(400)
                .send('missing title');
        }

        // get an id
        const id = uuid();

        const bookmark = {
            id,
            title,
            url
        };

        bookmarks.push(bookmark);

        logger.info(`Bookmark with id ${id} created`);

        res
            .status(201)
            .location(`http://localhost:8000/bookmarks/${id}`)
            .json(bookmarks)
        });
    

bookmarkRouter
    .route('/bookmarks/:id')
    .get((req, res) => {const { id } = req.params;
  const bookmark = bookmarks.find(book => book.id == id);

  // make sure we found a bookmark
  if (!bookmark) {
    logger.error(`Bookmark with id ${id} not found.`);
    return res
      .status(404)
      .send('Bookmark Not Found');
  }

  res.json(bookmark);
})

    .delete((req, res) => {
        const { id } = req.params;
        const bookmarkIndex = bookmarks.findIndex(item => item.id == id);

        if (bookmarkIndex === -1) {
            logger.error(`List with id ${id} not found.`);
            return res
                .status(404)
                .send('Not Found');
        }

        bookmarks.splice(bookmarkIndex, 1);

        logger.info(`List with id ${id} deleted.`);
        res
            .status(204)
            .end();
        })

module.exports = bookmarkRouter