const express = require('express');
const router = express.Router();
const { getAllItems, getItemByCode, createItem, updateItem, deleteItem } = require('../controllers/items.controller');

router.get('/', getAllItems);
router.get('/:code', getItemByCode);
router.post('/', createItem);
router.put('/:code', updateItem);
router.delete('/:code', deleteItem);

module.exports = router;
