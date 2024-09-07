const pool = require("../config/db")
const bcrypt = require("bcryptjs")

const jwt = require("jsonwebtoken")

const formatDate = require("../utils/formateDate")

exports.login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" })
  }

  let connection
  try {
    connection = await pool.getConnection()

    // Check if user exists
    const [user] = await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    )

    if (user.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const userData = user[0]

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: userData.id,
        email: userData.email,
        roleId: userData.role_id,
        refId: userData.ref_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )

    // Send response with token and basic user info
    res.status(200).json({
      token,
      user: {
        id: userData.id,
        email: userData.email,
        roleId: userData.role_id,
        refId: userData.ref_id,
      },
    })
  } catch (err) {
    console.error("Error:", err)
    res.status(500).json({ error: err.message })
  } finally {
    if (connection) connection.release()
  }
}

// Get user data based on role
exports.getUserData = async (req, res) => {
  const { id, roleId, refId } = req.user
  console.log(req.user)
  let connection
  try {
    connection = await pool.getConnection()

    let userData
    if (roleId === 2) {
      // CP role
      const [cpData] = await connection.query(
        `SELECT 
          users.id AS user_id,
          users.email,
          JSON_OBJECT(
      'line1', address.address_line1,
      'line2', address.address_line2,
      'city_block', address.city_block,
      'district', address.district,
      'state', address.state,
      'zipcode', address.zipcode
    ) AS address,
    JSON_OBJECT(
      'proof_type', id_proof.proof_type,
      'proof_no', id_proof.proof_no,
      'proof', id_proof.proof
    ) AS id_proof,
          cp.*
        FROM users
        JOIN cp ON users.ref_id = cp.id
        JOIN id_proof ON id_proof.id = cp.proof_id
        JOIN address ON address.id = cp.address_id
        WHERE users.id = ? AND users.ref_id = ?`,
        [id, refId]
      )
      userData = cpData[0]
    } else if (roleId === 3) {
      // CP role
      const [cfcpData] = await connection.query(
        `SELECT 
          users.id AS user_id,
          users.email,
          JSON_OBJECT(
      'line1', address.address_line1,
      'line2', address.address_line2,
      'city_block', address.city_block,
      'district', address.district,
      'state', address.state,
      'zipcode', address.zipcode
    ) AS address,
    JSON_OBJECT(
      'proof_type', id_proof.proof_type,
      'proof_no', id_proof.proof_no,
      'proof', id_proof.proof
    ) AS id_proof,
          employee.*,
          GROUP_CONCAT(DISTINCT cp.first_name, ' ', cp.last_name) AS assigned_cps,
          GROUP_CONCAT(DISTINCT zone.name) AS assigned_zones
        FROM users
        JOIN employee ON users.ref_id = employee.id
        JOIN address ON address.id = employee.address_id
        JOIN id_proof ON id_proof.id = employee.proof_id
        LEFT JOIN cfcp_assigned_cp ON employee.id = cfcp_assigned_cp.employee_id
        LEFT JOIN cp ON cfcp_assigned_cp.assigned_cp = cp.id
        LEFT JOIN cfcp_assigned_zone ON employee.id = cfcp_assigned_zone.employee_id
        LEFT JOIN zone ON cfcp_assigned_zone.zone_id = zone.id
        WHERE users.id = ? AND users.ref_id = ? AND users.role_id = 3
        GROUP BY users.id, employee.id, address.id, id_proof.id`,
        [id, refId]
      )
      userData = cfcpData[0]

      // Transform assigned CPs into an array
      if (userData.assigned_cps) {
        userData.assigned_cps = userData.assigned_cps
          .split(",")
          .map((cpName) => cpName.trim())
      } else {
        userData.assigned_cps = []
      }

      // Transform assigned zones into an array
      if (userData.assigned_zones) {
        userData.assigned_zones = userData.assigned_zones
          .split(",")
          .map((zoneName) => zoneName.trim())
      } else {
        userData.assigned_zones = []
      }
    } else if (roleId === 4) {
      // CF_Eclinic role
      const [cfEclinicData] = await connection.query(
        `SELECT 
          users.id AS user_id,
          users.email,
          employee.id,
          employee.role_id,
          employee.first_name,
          employee.middle_name,
          employee.last_name,
          employee.gender,
          employee.dob,
          employee.photo,
          employee.mobile,
          employee.created_at,
          employee.updated_at,
          employee.cf_eclinic,
          employee.tele_health_provider,
          employee.eclinic_id,
          -- Grouping permanent address
          JSON_OBJECT(
            'line1', pa.address_line1,
            'line2', pa.address_line2,
            'city_block', pa.city_block,
            'district', pa.district,
            'state', pa.state,
            'zipcode', pa.zipcode
          ) AS permanent_address,
          -- Grouping present address
          JSON_OBJECT(
            'line1', prea.address_line1,
            'line2', prea.address_line2,
            'city_block', prea.city_block,
            'district', prea.district,
            'state', prea.state,
            'zipcode', prea.zipcode
          ) AS present_address,
          -- Grouping ID proof
          JSON_OBJECT(
            'proof_type', id_proof.proof_type,
            'proof_no', id_proof.proof_no,
            'proof', id_proof.proof
          ) AS id_proof,
          eclinic.name AS eclinic_name
        FROM users
        JOIN employee ON users.ref_id = employee.id
        JOIN cf_eclinic ON cf_eclinic.id = employee.cf_eclinic
        JOIN address AS pa ON pa.id = cf_eclinic.permanent_address_id
        JOIN address AS prea ON prea.id = cf_eclinic.present_address_id
        JOIN id_proof ON id_proof.id = employee.proof_id
        JOIN eclinic ON eclinic.id = cf_eclinic.eclinic_id
        WHERE users.id = ? AND users.ref_id = ? AND users.role_id = 4`,
        [id, refId]
      )
      userData = cfEclinicData[0]
    } else if (roleId === 5) {
      // Tele Health Provider role
      const [teleHealthProviderData] = await connection.query(
        `SELECT 
          users.id AS user_id,
          users.email,
          employee.*,
           -- Grouping permanent address
          JSON_OBJECT(
            'line1', pa.address_line1,
            'line2', pa.address_line2,
            'city_block', pa.city_block,
            'district', pa.district,
            'state', pa.state,
            'zipcode', pa.zipcode
          ) AS permanent_address,
          -- Grouping present address
          JSON_OBJECT(
            'line1', prea.address_line1,
            'line2', prea.address_line2,
            'city_block', prea.city_block,
            'district', prea.district,
            'state', prea.state,
            'zipcode', prea.zipcode
          ) AS present_address,
          -- Grouping ID proof
          JSON_OBJECT(
            'proof_type', id_proof.proof_type,
            'proof_no', id_proof.proof_no,
            'proof', id_proof.proof
          ) AS id_proof,
          tele_health_provider.zone_id,
          zone.name AS zone_name
        FROM users
        JOIN employee ON users.ref_id = employee.id
        JOIN tele_health_provider ON tele_health_provider.id = employee.tele_health_provider
        JOIN address AS pa ON pa.id = tele_health_provider.permanent_address_id
        JOIN address AS prea   ON prea.id = tele_health_provider.present_address_id
        JOIN id_proof ON id_proof.id = employee.proof_id
        JOIN zone ON zone.id = tele_health_provider.zone_id
        WHERE users.id = ? AND users.ref_id = ? AND users.role_id = 5`,
        [id, refId]
      )
      userData = teleHealthProviderData[0]
    } else if (roleId == 6) {
      //eclinic
    } else if (roleId == 7) {
      //nph
      const [results] = await pool.query(
        `SELECT 
            users.id AS user_id,
            users.email,
            nph.id AS nphId, 
            nph.business_name, 
            nph.owner_name, 
            nph.mobile, 
            nph.email AS nph_email, 
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
            users
          INNER JOIN 
            nph ON users.ref_id = nph.id  -- Use ref_id to reference nph
          INNER JOIN 
            address ON nph.address_id = address.id
          INNER JOIN 
            id_proof ON nph.nabl_license_id = id_proof.id
          INNER JOIN 
            support_doc ON nph.support_doc_id = support_doc.id
          INNER JOIN
            zone ON nph.zone_id = zone.id
          WHERE 
            users.id = ? AND users.ref_id = ? AND users.role_id = 7`,
        [id, refId]
      )
      userData = results[0]
    }
    if (userData) {
      // Format date fields
      userData.dob = formatDate(userData.dob)
      userData.created_at = formatDate(userData.created_at)
      userData.updated_at = formatDate(userData.updated_at)
    }

    connection.release()

    if (!userData) {
      return res.status(404).json({ message: "User data not found" })
    }

    res.status(200).json(userData)
  } catch (err) {
    if (connection) connection.release()
    console.error("Error:", err)
    res.status(500).json({ error: err.message })
  }
}
