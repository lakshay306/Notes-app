const Note = require("../models/Note");

exports.createNote = async (req, res) => {
  try {
    const { title, description, visibility } = req.body;
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: "Title and description are required." });
    }
    const note = await Note.create({
      title: title.trim(), description: description.trim(), user: req.userId,
      visibility: visibility === "public" ? "public" : "private"
    });
    const populated = await note.populate("user", "name email");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Could not create note.", error: error.message });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const view = req.query.view || "all";
    let filter = {};
    if (view === "public") {
      filter = { visibility: "public", isDeleted: false, isArchived: false };
    } else {
      filter.user = req.userId;
      if (view === "private") Object.assign(filter, { visibility: "private", isDeleted: false, isArchived: false });
      else if (view === "favorites") Object.assign(filter, { isFavorite: true, isDeleted: false, isArchived: false });
      else if (view === "archived") Object.assign(filter, { isArchived: true, isDeleted: false });
      else if (view === "trash") filter.isDeleted = true;
      else Object.assign(filter, { isDeleted: false, isArchived: false });
    }
    const notes = await Note.find(filter).populate("user", "name email").sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch notes.", error: error.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { title, description, visibility } = req.body;
    const note = await Note.findOne({ _id: req.params.id, user: req.userId, isDeleted: false });
    if (!note) return res.status(404).json({ message: "Note not found." });
    if (title !== undefined) note.title = title.trim();
    if (description !== undefined) note.description = description.trim();
    if (visibility !== undefined) note.visibility = visibility === "public" ? "public" : "private";
    await note.save();
    res.json(await note.populate("user", "name email"));
  } catch (error) {
    res.status(500).json({ message: "Could not update note.", error: error.message });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.userId, isDeleted: false });
    if (!note) return res.status(404).json({ message: "Note not found." });
    note.isFavorite = !note.isFavorite;
    await note.save();
    res.json({ message: "Favorite updated.", isFavorite: note.isFavorite });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.toggleArchive = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.userId, isDeleted: false });
    if (!note) return res.status(404).json({ message: "Note not found." });
    note.isArchived = !note.isArchived;
    await note.save();
    res.json({ message: note.isArchived ? "Note archived." : "Note unarchived." });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId, isDeleted: false },
      { isDeleted: true }, { new: true }
    );
    if (!note) return res.status(404).json({ message: "Note not found." });
    res.json({ message: "Note moved to trash." });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.restoreNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId, isDeleted: true },
      { isDeleted: false, isArchived: false }, { new: true }
    );
    if (!note) return res.status(404).json({ message: "Note not found in trash." });
    res.json({ message: "Note restored." });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.permanentDelete = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId, isDeleted: true });
    if (!note) return res.status(404).json({ message: "Note not found in trash." });
    res.json({ message: "Note permanently deleted." });
  } catch (error) { res.status(500).json({ message: error.message }); }
};