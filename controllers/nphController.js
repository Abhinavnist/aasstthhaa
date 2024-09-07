const pool = require("../config/db")
const { hashPassword } = require("../services/common")
const generateRandomPassword = require("../utils/randomPassword")

const addNPH = async (req, res) => {
  const {
    business_name,
    owner_name,
    mobile,
    email,
    gst_no,
    address,
    nabl_license,
    supporting_docs,
    zone_id,
  } = req.body
  console.log(req.body)

  if (!business_name || !mobile || !zone_id) {
    return res
      .status(400)
      .json({ message: "Business name, mobile, and zone_id are required" })
  }
  const connection = await pool.getConnection()
  try {
    // Start a transaction
    await connection.beginTransaction()

    // Insert address
    const [addressResult] = await connection.query(
      "INSERT INTO address (address_line1, address_line2, city_block, district, state, zipcode) VALUES (?, ?, ?, ?, ?, ?)",
      [
        address.address_line1,
        address.address_line2,
        address.city_block,
        address.district,
        address.state,
        address.zipcode,
      ]
    )
    const addressId = addressResult.insertId

    // Insert ID proof for nabl_license
    const [licenseResult] = await connection.query(
      "INSERT INTO id_proof (proof_type, proof_no, proof) VALUES (?, ?, ?)",
      [nabl_license.proof_type, nabl_license.proof_no, nabl_license.proof]
    )
    const licenseId = licenseResult.insertId

    // Insert supporting documents
    const [docResult] = await connection.query(
      "INSERT INTO support_doc (entity_id, name, document) VALUES (?, ?, ?)",
      [null, supporting_docs.name, supporting_docs.document]
    )
    const supportDocId = docResult.insertId

    // Insert Nodal Patholab House
    const [nphResult] = await connection.query(
      "INSERT INTO nph (business_name, owner_name, mobile, email, gst_no, address_id, nabl_license_id, support_doc_id, zone_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        business_name,
        owner_name,
        mobile,
        email,
        gst_no,
        addressId,
        licenseId,
        supportDocId,
        zone_id,
      ]
    )

    const nphId = nphResult.insertId

    // Hash password (assuming you have a hashing function available)
    const hashedPassword = await hashPassword(generateRandomPassword(8))

    const roleId = 7 // Role ID for eclinic

    const [userResult] = await connection.query(
      `INSERT INTO users (email, password, role_id, ref_id)
       VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, roleId, nphId]
    )

    // Commit the transaction
    await connection.query("COMMIT")

    return res.status(201).json({
      message: "Nodal Patholab House added successfully",
      nphId: nphResult.insertId,
    })
  } catch (error) {
    // Rollback the transaction in case of error
    await connection.query("ROLLBACK")

    // Log the error and return a more detailed message
    console.error("Error adding Nodal Patholab House:", error)

    return res.status(500).json({
      message: "Error adding Nodal Patholab House",
      error: error.message || "Unknown error",
    })
  }
}

const getAllNPH = async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT 
          nph.id as nphId, 
          nph.business_name, 
          nph.owner_name, 
          nph.mobile, 
          nph.email, 
          nph.gst_no, 
          JSON_OBJECT(
            'zone_id', zone.id,
            'zone_name', zone.name
          ) AS zone,
          JSON_OBJECT(
            'address_line1', address.address_line1,
            'address_line2', address.address_line2,
            'city_block', address.city_block,
            'district', address.district,
            'state', address.state,
            'zipcode', address.zipcode
          ) AS address,
          JSON_OBJECT(
            'proof_type', id_proof.proof_type,
            'proof_no', id_proof.proof_no,
            'proof', id_proof.proof
          ) AS nabl_license,
          JSON_OBJECT(
            'name', support_doc.name,
            'document', support_doc.document
          ) AS supporting_docs
        FROM 
          nph 
        INNER JOIN 
          address ON nph.address_id = address.id
        INNER JOIN 
          id_proof ON nph.nabl_license_id = id_proof.id
        INNER JOIN 
          support_doc ON nph.support_doc_id = support_doc.id
        INNER JOIN
          zone ON nph.zone_id = zone.id`
    )

    return res.status(200).json(results)
  } catch (error) {
    console.error("Error fetching NPH records:", error)
    return res.status(500).json({
      message: "Error fetching NPH records",
      error: error.message || "Unknown error",
    })
  }
}

const getNPHById = async (req, res) => {
  const { id } = req.params

  try {
    const [results] = await pool.query(
      `SELECT 
          nph.id as nphId, 
          nph.business_name, 
          nph.owner_name, 
          nph.mobile, 
          nph.email, 
          nph.gst_no, 
          JSON_OBJECT(
            'zone_id', zone.id,
            'zone_name', zone.name
          ) AS zone,
          JSON_OBJECT(
            'address_line1', address.address_line1,
            'address_line2', address.address_line2,
            'city_block', address.city_block,
            'district', address.district,
            'state', address.state,
            'zipcode', address.zipcode
          ) AS address,
          JSON_OBJECT(
            'proof_type', id_proof.proof_type,
            'proof_no', id_proof.proof_no,
            'proof', id_proof.proof
          ) AS nabl_license,
          JSON_OBJECT(
            'name', support_doc.name,
            'document', support_doc.document
          ) AS supporting_docs
        FROM 
          nph 
        INNER JOIN 
          address ON nph.address_id = address.id
        INNER JOIN 
          id_proof ON nph.nabl_license_id = id_proof.id
        INNER JOIN 
          support_doc ON nph.support_doc_id = support_doc.id
        INNER JOIN
          zone ON nph.zone_id = zone.id
        WHERE 
          nph.id = ?`,
      [id]
    )

    if (results.length === 0) {
      return res.status(404).json({ message: "NPH record not found" })
    }

    return res.status(200).json(results[0])
  } catch (error) {
    console.error("Error fetching NPH record:", error)
    return res.status(500).json({
      message: "Error fetching NPH record",
      error: error.message || "Unknown error",
    })
  }
}

const updateNPH = async (req, res) => {
  const { id } = req.params
  const {
    business_name,
    owner_name,
    mobile,
    email,
    gst_no,
    address,
    nabl_license,
    supporting_docs,
    zone_id,
  } = req.body

  try {
    // Start a transaction
    await pool.query("START TRANSACTION")

    // Update address
    await pool.query(
      "UPDATE address SET address_line1 = ?, address_line2 = ?, city_block = ?, district = ?, state = ?, zipcode = ? WHERE id = (SELECT address_id FROM nph WHERE id = ?)",
      [
        address.address_line1,
        address.address_line2,
        address.city_block,
        address.district,
        address.state,
        address.zipcode,
        id,
      ]
    )

    // Update ID proof for nabl_license
    await pool.query(
      "UPDATE id_proof SET proof_type = ?, proof_no = ?, proof = ? WHERE id = (SELECT nabl_license_id FROM nph WHERE id = ?)",
      [nabl_license.proof_type, nabl_license.proof_no, nabl_license.proof, id]
    )

    // Update supporting documents
    await pool.query(
      "UPDATE support_doc SET name = ?, document = ? WHERE id = (SELECT support_doc_id FROM nph WHERE id = ?)",
      [supporting_docs.name, supporting_docs.document, id]
    )

    // Update Nodal Patholab House
    await pool.query(
      "UPDATE nph SET business_name = ?, owner_name = ?, mobile = ?, email = ?, gst_no = ?, zone_id = ? WHERE id = ?",
      [business_name, owner_name, mobile, email, gst_no, zone_id, id]
    )

    // Commit the transaction
    await pool.query("COMMIT")

    return res.status(200).json({
      message: "Nodal Patholab House updated successfully",
    })
  } catch (error) {
    // Rollback the transaction in case of error
    await pool.query("ROLLBACK")

    // Log the error and return a more detailed message
    console.error("Error updating Nodal Patholab House:", error)

    return res.status(500).json({
      message: "Error updating Nodal Patholab House",
      error: error.message || "Unknown error",
    })
  }
}

const deleteNPH = async (req, res) => {
  const { id } = req.params

  try {
    // Start a transaction
    await pool.query("START TRANSACTION")

    // Delete the Nodal Patholab House
    await pool.query("DELETE FROM nph WHERE id = ?", [id])

    // Commit the transaction
    await pool.query("COMMIT")

    return res.status(200).json({
      message: "Nodal Patholab House deleted successfully",
    })
  } catch (error) {
    // Rollback the transaction in case of error
    await pool.query("ROLLBACK")

    // Log the error and return a more detailed message
    console.error("Error deleting Nodal Patholab House:", error)

    return res.status(500).json({
      message: "Error deleting Nodal Patholab House",
      error: error.message || "Unknown error",
    })
  }
}

module.exports = {
  updateNPH,
  deleteNPH,
  getNPHById,
  getAllNPH,
  addNPH,
}
