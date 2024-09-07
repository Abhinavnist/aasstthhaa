const pool = require("../config/db")
const { hashPassword } = require("../services/common")
const generateRandomPassword = require("../utils/randomPassword")

const addNDH = async (req, res) => {
  const {
    business_name,
    owner_name,
    email,
    mobile,
    gst_no,
    address,
    drug_license,
    support_docs,
    zone_id,
    photo,
  } = req.body

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // Insert address details
    const [addressResult] = await connection.query(
      `INSERT INTO address (address_line1, address_line2, city_block, district, state, zipcode)
             VALUES (?, ?, ?, ?, ?, ?)`,
      [
        address.address_line1,
        address.address_line2,
        address.city_block,
        address.district,
        address.state,
        address.zipcode,
      ]
    )
    const address_id = addressResult.insertId

    // Insert drug license
    const [drugLicenseResult] = await connection.query(
      `INSERT INTO id_proof (proof_type, proof_no, proof) VALUES (?, ?, ?)`,
      [drug_license.proof_type, drug_license.proof_no, drug_license.proof]
    )
    const drug_license_id = drugLicenseResult.insertId

    // Insert support documents if they exist
    let support_doc_id = null
    if (support_docs && support_docs.length > 0) {
      // Assuming you only need to insert the first document as shown in your example
      const [supportDocResult] = await connection.query(
        `INSERT INTO support_doc (name, document) VALUES (?, ?)`,
        [support_docs[0].name, support_docs[0].document]
      )
      support_doc_id = supportDocResult.insertId
    }

    // Insert NDH details
    const [ndhResult] = await connection.query(
      `INSERT INTO ndh (business_name, owner_name, email, mobile, gst_no, address_id, drug_license_id, support_doc_id, zone_id, photo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        business_name,
        owner_name,
        email,
        mobile,
        gst_no,
        address_id,
        drug_license_id,
        support_doc_id,
        zone_id,
        photo,
      ]
    )
    const ndhId = ndhResult.insertId

    // Hash password (assuming you have a hashing function available)
    const hashedPassword = await hashPassword(generateRandomPassword(8))

    const roleId = 8 // Role ID for eclinic

    const [userResult] = await connection.query(
      `INSERT INTO users (email, password, role_id, ref_id)
       VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, roleId, ndhId]
    )

    await connection.commit()
    res.status(201).json({ message: "Nodal Drug House added successfully" })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res
      .status(500)
      .json({ message: "Error adding Nodal Drug House", error: error.message })
  } finally {
    connection.release()
  }
}

const getNDH = async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await pool.query(
      `SELECT 
                ndh.id,
                ndh.business_name,
                ndh.owner_name,
                ndh.email,
                ndh.mobile,
                ndh.gst_no,
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
                ) AS drug_license,
                JSON_OBJECT(
                    'name', support_doc.name,
                    'document', support_doc.document
                ) AS supporting_docs,
                ndh.zone_id,
                ndh.photo
            FROM ndh
            JOIN address ON ndh.address_id = address.id
            JOIN id_proof ON ndh.drug_license_id = id_proof.id
            LEFT JOIN support_doc ON ndh.support_doc_id = support_doc.id
            WHERE ndh.id = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "Nodal Drug House not found" })
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Error retrieving Nodal Drug House",
      error: error.message,
    })
  }
}

const getAllNDHs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
                ndh.id,
                ndh.business_name,
                ndh.owner_name,
                ndh.email,
                ndh.mobile,
                ndh.gst_no,
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
                ) AS drug_license,
                JSON_OBJECT(
                    'name', support_doc.name,
                    'document', support_doc.document
                ) AS supporting_docs,
                ndh.zone_id,
                ndh.photo
            FROM ndh
            JOIN address ON ndh.address_id = address.id
            JOIN id_proof ON ndh.drug_license_id = id_proof.id
            LEFT JOIN support_doc ON ndh.support_doc_id = support_doc.id`
    )

    res.status(200).json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Error retrieving Nodal Drug Houses",
      error: error.message,
    })
  }
}

const updateNDH = async (req, res) => {
  const { id } = req.params
  const {
    business_name,
    owner_name,
    mobile,
    gst_no,
    address,
    drug_license,
    support_docs,
    zone_id,
    photo,
  } = req.body

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // Update address details
    await connection.query(
      `UPDATE address 
             SET address_line1 = ?, address_line2 = ?, city_block = ?, district = ?, state = ?, zipcode = ?
             WHERE id = (SELECT address_id FROM ndh WHERE id = ?)`,
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

    // Update drug license details
    await connection.query(
      `UPDATE id_proof 
             SET proof_type = ?, proof_no = ?, proof = ?
             WHERE id = (SELECT drug_license_id FROM ndh WHERE id = ?)`,
      [drug_license.proof_type, drug_license.proof_no, drug_license.proof, id]
    )

    // Update support documents if provided
    if (support_docs && support_docs.length > 0) {
      await connection.query(
        `UPDATE support_doc 
                 SET name = ?, document = ?
                 WHERE id = (SELECT support_doc_id FROM ndh WHERE id = ?)`,
        [support_docs[0].name, support_docs[0].document, id]
      )
    }

    // Update NDH details
    await connection.query(
      `UPDATE ndh 
             SET business_name = ?, owner_name = ?, mobile = ?, gst_no = ?, zone_id = ?, photo = ?
             WHERE id = ?`,
      [business_name, owner_name, mobile, gst_no, zone_id, photo, id]
    )

    await connection.commit()
    res.status(200).json({ message: "Nodal Drug House updated successfully" })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res.status(500).json({
      message: "Error updating Nodal Drug House",
      error: error.message,
    })
  } finally {
    connection.release()
  }
}

const deleteNDH = async (req, res) => {
  const { id } = req.params

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // Retrieve the IDs for related records (address, drug license, and support docs)
    const [rows] = await connection.query(
      `SELECT address_id, drug_license_id, support_doc_id FROM ndh WHERE id = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "Nodal Drug House not found" })
    }

    const { address_id, drug_license_id, support_doc_id } = rows[0]

    // Delete related records
    await connection.query(`DELETE FROM address WHERE id = ?`, [address_id])
    await connection.query(`DELETE FROM id_proof WHERE id = ?`, [
      drug_license_id,
    ])
    if (support_doc_id) {
      await connection.query(`DELETE FROM support_doc WHERE id = ?`, [
        support_doc_id,
      ])
    }

    // Delete the NDH record
    await connection.query(`DELETE FROM ndh WHERE id = ?`, [id])

    await connection.commit()
    res.status(200).json({ message: "Nodal Drug House deleted successfully" })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res.status(500).json({
      message: "Error deleting Nodal Drug House",
      error: error.message,
    })
  } finally {
    connection.release()
  }
}

module.exports = {
  addNDH,
  getNDH,
  updateNDH,
  getAllNDHs,
  deleteNDH,
}
