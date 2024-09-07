const pool = require("../config/db")
const {
  insertAddress,
  updateAddress,
  hashPassword,
} = require("../services/common")
const generateRandomPassword = require("../utils/randomPassword")

// Create a new eclinic
// const createEclinic = async (req, res) => {
//   const { elinic_name, mobile, gst_no, address, zone_id, photo } = req.body

//   const connection = await pool.getConnection()
//   try {
//     await connection.beginTransaction()

//     const addressId = await insertAddress(connection, address)

//     const [result] = await connection.query(
//       `INSERT INTO eclinic (elinic_name, mobile, gst_no, address_id, zone_id, photo)
//             VALUES (?, ?, ?, ?, ?, ?)`,
//       [elinic_name, mobile, gst_no, addressId, zone_id, photo]
//     )

//     await connection.commit()
//     res
//       .status(201)
//       .json({ id: result.insertId, message: "Eclinic created successfully" })
//   } catch (error) {
//     await connection.rollback()
//     console.error(error)
//     res
//       .status(500)
//       .json({ message: "Error creating eclinic", error: error.message })
//   } finally {
//     connection.release()
//   }
// }
const createEclinic = async (req, res) => {
  const {
    elinic_name,
    mobile,
    gst_no,
    address,
    zone_id,
    photo,
    email,
    password,
  } = req.body

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // Insert address and get addressId
    const addressId = await insertAddress(connection, address)

    // Insert into eclinic and get eclinicId
    const [eclinicResult] = await connection.query(
      `INSERT INTO eclinic (elinic_name, email, mobile, gst_no, address_id, zone_id, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [elinic_name, email, mobile, gst_no, addressId, zone_id, photo]
    )
    const eclinicId = eclinicResult.insertId

    // Hash password (assuming you have a hashing function available)
    const hashedPassword = await hashPassword(generateRandomPassword(8))
    console.log(hashedPassword)

    // Insert user with role_id for eclinic
    const roleId = 6 // Role ID for eclinic
    const [userResult] = await connection.query(
      `INSERT INTO users (email, password, role_id, ref_id)
       VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, roleId, eclinicId]
    )

    // Commit the transaction
    await connection.commit()

    // Respond with success
    res.status(201).json({
      eclinicId,
      userId: userResult.insertId,
      message: "Eclinic and user created successfully",
    })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res
      .status(500)
      .json({ message: "Error creating eclinic", error: error.message })
  } finally {
    connection.release()
  }
}

const getAllEclinics = async (req, res) => {
  try {
    const [results] = await pool.query(`
            SELECT 
                e.id,
                e.elinic_name AS business_name,
                e.mobile,
                e.email,
                e.gst_no,
                e.photo,
                JSON_OBJECT(
                    'address_line1', a.address_line1,
                    'address_line2', a.address_line2,
                    'city_block', a.city_block,
                    'district', a.district,
                    'state', a.state,
                    'zipcode', a.zipcode
                ) AS address,
                z.name AS zone_name,
                z.district AS zone_district,
                z.state_id AS zone_state_id
            FROM 
                eclinic e
            JOIN 
                address a ON e.address_id = a.id
            JOIN 
                zone z ON e.zone_id = z.id
        `)

    res.status(200).json(results)
  } catch (error) {
    console.error("Error fetching eclinics:", error)
    res
      .status(500)
      .json({ message: "Error fetching eclinics", error: error.message })
  }
}

// Get a single eclinic by ID
const getEclinicById = async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.elinic_name,e.email, e.mobile, e.gst_no, e.photo, e.zone_id,
            JSON_OBJECT(
                'address_line1', a.address_line1,
                'address_line2', a.address_line2,
                'city_block', a.city_block,
                'district', a.district,
                'state', a.state,
                'zipcode', a.zipcode
            ) AS address
            FROM eclinic e
            JOIN address a ON e.address_id = a.id
            WHERE e.id = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "Eclinic not found" })
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ message: "Error retrieving eclinic", error: error.message })
  }
}

// Update an existing eclinic
const updateEclinic = async (req, res) => {
  const { id } = req.params
  const { elinic_name, mobile, gst_no, address, zone_id, photo } = req.body

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [eclinicRows] = await connection.query(
      `SELECT address_id FROM eclinic WHERE id = ?`,
      [id]
    )

    if (eclinicRows.length === 0) {
      return res.status(404).json({ message: "Eclinic not found" })
    }

    await connection.query(
      `UPDATE address 
               SET address_line1 = ?, address_line2 = ?, city_block = ?, district = ?, state = ?, zipcode = ?
               WHERE id = (SELECT address_id FROM eclinic WHERE id = ?)`,
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

    await connection.query(
      `UPDATE eclinic SET elinic_name = ?, mobile = ?, gst_no = ?, zone_id = ?, photo = ?
            WHERE id = ?`,
      [elinic_name, mobile, gst_no, zone_id, photo, id]
    )

    await connection.commit()
    res.status(200).json({ message: "Eclinic updated successfully" })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res
      .status(500)
      .json({ message: "Error updating eclinic", error: error.message })
  } finally {
    connection.release()
  }
}

// Delete an eclinic by ID
const deleteEclinic = async (req, res) => {
  const { id } = req.params

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [rows] = await connection.query(
      `SELECT address_id FROM eclinic WHERE id = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "Eclinic not found" })
    }

    const addressId = rows[0].address_id

    await connection.query(`DELETE FROM address WHERE id = ?`, [addressId])
    await connection.query(`DELETE FROM eclinic WHERE id = ?`, [id])

    await connection.commit()
    res.status(200).json({ message: "Eclinic deleted successfully" })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res
      .status(500)
      .json({ message: "Error deleting eclinic", error: error.message })
  } finally {
    connection.release()
  }
}

module.exports = {
  createEclinic,
  getAllEclinics,
  getEclinicById,
  updateEclinic,
  deleteEclinic,
}
