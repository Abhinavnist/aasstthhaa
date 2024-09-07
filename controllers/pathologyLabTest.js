const pool = require("../config/db")

// Add a new pathology test
const addPathologyTest = async (req, res) => {
  const {
    name,
    code,
    category_id,
    book_code,
    price,
    price_min,
    price_max,
    description,
  } = req.body

  if (!name || !code || !category_id) {
    return res
      .status(400)
      .json({ message: "Name, code, and category_id are required" })
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO pathology_test (name, code, category_id, book_code, price, price_min, price_max, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        code,
        category_id,
        book_code,
        price,
        price_min,
        price_max,
        description,
      ]
    )

    return res.status(201).json({
      message: "Pathology test added successfully",
      testId: result.insertId,
    })
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error adding pathology test", error })
  }
}

// Update an existing pathology test
const updatePathologyTest = async (req, res) => {
  const { id } = req.params
  const {
    name,
    code,
    category_id,
    book_code,
    price,
    price_min,
    price_max,
    description,
  } = req.body

  try {
    const [result] = await pool.query(
      `UPDATE pathology_test 
         SET name = COALESCE(?, name), 
             code = COALESCE(?, code), 
             category_id = COALESCE(?, category_id), 
             book_code = COALESCE(?, book_code), 
             price = COALESCE(?, price), 
             price_min = COALESCE(?, price_min), 
             price_max = COALESCE(?, price_max), 
             description = COALESCE(?, description)
         WHERE id = ?`,
      [
        name,
        code,
        category_id,
        book_code,
        price,
        price_min,
        price_max,
        description,
        id,
      ]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pathology test not found" })
    }

    return res
      .status(200)
      .json({ message: "Pathology test updated successfully" })
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating pathology test", error })
  }
}

// Delete a pathology test
const deletePathologyTest = async (req, res) => {
  const { id } = req.params

  try {
    const [result] = await pool.query(
      "DELETE FROM pathology_test WHERE id = ?",
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pathology test not found" })
    }

    return res
      .status(200)
      .json({ message: "Pathology test deleted successfully" })
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting pathology test", error })
  }
}

// Get all pathology tests
const getAllPathologyTests = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM pathology_test")
    return res.status(200).json({ pathologyTests: rows })
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error retrieving pathology tests", error })
  }
}

// Get pathology test by ID
const getPathologyTestById = async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await pool.query(
      "SELECT * FROM pathology_test WHERE id = ?",
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "Pathology test not found" })
    }

    return res.status(200).json({ pathologyTest: rows[0] })
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error retrieving pathology test", error })
  }
}

module.exports = {
  addPathologyTest,
  updatePathologyTest,
  deletePathologyTest,
  getAllPathologyTests,
  getPathologyTestById,
}
