const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const notes = require("../controllers/noteController");

router.use(auth);
router.get("/", notes.getNotes);
router.post("/", notes.createNote);
router.put("/:id", notes.updateNote);
router.patch("/:id/favorite", notes.toggleFavorite);
router.patch("/:id/archive", notes.toggleArchive);
router.patch("/:id/restore", notes.restoreNote);
router.delete("/:id/permanent", notes.permanentDelete);
router.delete("/:id", notes.deleteNote);

module.exports = router;