const pool = require("../config/db")

const addDrugDetail = async (req, res) => {
  const { category_id, type_id, name, price, composition, side_effects } =
    req.body
  console.log(req.body)

  try {
    const [result] = await pool.query(
      "INSERT INTO drug_detail (category_id, type_id, name, price, composition, side_effects) VALUES (?, ?, ?, ?, ?, ?)",
      [category_id, type_id, name, price, composition, side_effects]
    )

    return res.status(201).json({
      message: "Drug detail added successfully",
      drugId: result.insertId,
    })
  } catch (error) {
    return res.status(500).json({ message: "Error adding drug detail", error })
  }
}

const updateDrugDetail = async (req, res) => {
  const { id } = req.params
  const { category_id, type_id, name, price, composition, side_effects } =
    req.body

  try {
    const [result] = await pool.query(
      `UPDATE drug_detail 
         SET category_id = COALESCE(?, category_id), 
             type_id = COALESCE(?, type_id), 
             name = COALESCE(?, name), 
             price = COALESCE(?, price), 
             composition = COALESCE(?, composition), 
             side_effects = COALESCE(?, side_effects)
         WHERE id = ?`,
      [category_id, type_id, name, price, composition, side_effects, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Drug detail not found" })
    }

    return res.status(200).json({ message: "Drug detail updated successfully" })
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating drug detail", error })
  }
}

const deleteDrugDetail = async (req, res) => {
  const { id } = req.params

  try {
    const [result] = await pool.query("DELETE FROM drug_detail WHERE id = ?", [
      id,
    ])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Drug detail not found" })
    }

    return res.status(200).json({ message: "Drug detail deleted successfully" })
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting drug detail", error })
  }
}

const getAllDrugDetails = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT dd.id, 
                dc.name AS category_name, 
                dt.name AS type_name, 
                dd.name, 
                dd.price, 
                dd.composition, 
                dd.side_effects 
         FROM drug_detail dd 
         JOIN drug_category dc ON dd.category_id = dc.id 
         JOIN drug_type dt ON dd.type_id = dt.id`
    )

    return res.status(200).json({ drugDetails: rows })
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error retrieving drug details", error })
  }
}

const getDrugDetailById = async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await pool.query(
      `SELECT dd.id, 
                dc.name AS category_name, 
                dt.name AS type_name, 
                dd.name, 
                dd.price, 
                dd.composition, 
                dd.side_effects 
         FROM drug_detail dd 
         JOIN drug_category dc ON dd.category_id = dc.id 
         JOIN drug_type dt ON dd.type_id = dt.id 
         WHERE dd.id = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "Drug detail not found" })
    }

    return res.status(200).json({ drugDetail: rows[0] })
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error retrieving drug detail", error })
  }
}

module.exports = {
  addDrugDetail,
  updateDrugDetail,
  deleteDrugDetail,
  getAllDrugDetails,
  getDrugDetailById,
}
