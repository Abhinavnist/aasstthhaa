const pool = require("../config/db")

exports.addZone = async (req, res) => {
  const { zone_name, state_id, zipcode, district } = req.body

  if (!zone_name || typeof zone_name !== "string") {
    return res.status(400).json({ error: 'Invalid or missing "zone_name".' })
  }

  if (!state_id || !Number.isInteger(state_id)) {
    return res.status(400).json({ error: 'Invalid or missing "state_id".' })
  }

  if (!zipcode || typeof zipcode !== "string" || zipcode.length > 10) {
    return res.status(400).json({ error: 'Invalid "zipcode".' })
  }

  if (!district || typeof district !== "string") {
    return res.status(400).json({ error: 'Invalid "district".' })
  }

  let connection
  try {
    connection = await pool.getConnection()

    // Check if the state_id exists in state_code
    const [stateRows] = await connection.query(
      "SELECT * FROM state_code WHERE id = ?",
      [state_id]
    )

    if (stateRows.length === 0) {
      connection.release()
      return res
        .status(400)
        .json({ error: "Invalid state_id. No matching state found." })
    }

    // Insert the new zone into the zone table
    const [result] = await connection.query(
      "INSERT INTO zone (name, state_id, zipcode, district) VALUES (?, ?, ?, ?)",
      [zone_name, state_id, zipcode, district]
    )

    connection.release()

    res.status(201).json({
      message: "Zone added successfully",
      zoneId: result.insertId,
    })
  } catch (err) {
    if (connection) connection.release()
    console.error("Error adding zone:", err)
    res.status(500).json({ error: err.message })
  }
}

exports.getAllZones = async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()

    // Fetch all zones and their related state information
    const [zones] = await connection.query(
      `SELECT 
          zone.id AS zone_id, 
          zone.name AS zone_name, 
          zone.district,
          zone.zipcode,
          state_code.id AS state_id, 
          state_code.code AS state_code, 
          state_code.state AS state_name
        FROM zone
        JOIN state_code ON zone.state_id = state_code.id`
    )

    connection.release()

    res.status(200).json(zones)
  } catch (err) {
    if (connection) connection.release()
    console.error("Error fetching zones:", err)
    res.status(500).json({ error: err.message })
  }
}

exports.getZoneById = async (req, res) => {
  const { id } = req.params

  let connection
  try {
    connection = await pool.getConnection()

    // Fetch the zone by its ID and related state information
    const [zone] = await connection.query(
      `SELECT 
          zone.id AS zone_id, 
          zone.name AS zone_name, 
          zone.district, 
          state_code.id AS state_id, 
          state_code.code AS state_code, 
          state_code.state AS state_name
        FROM zone
        JOIN state_code ON zone.state_id = state_code.id
        WHERE zone.id = ?`,
      [id]
    )

    connection.release()

    if (zone.length === 0) {
      return res.status(404).json({ message: "Zone not found" })
    }

    res.status(200).json(zone[0])
  } catch (err) {
    if (connection) connection.release()
    console.error("Error fetching zone by ID:", err)
    res.status(500).json({ error: err.message })
  }
}

// Get all states
exports.getAllStates = async (req, res) => {
  try {
    const [states] = await pool.execute("SELECT * FROM state_code")
    res.status(200).json(states)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error fetching states" })
  }
}

// Add a new state (optional if you want to allow adding states)
exports.addState = async (req, res) => {
  const { code, state } = req.body

  if (!code || !state) {
    return res.status(400).json({ message: "Code and State are required" })
  }

  try {
    const result = await pool.execute(
      "INSERT INTO state_code (code, state) VALUES (?, ?)",
      [code, state]
    )
    res
      .status(201)
      .json({ message: "State added", stateId: result[0].insertId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error adding state" })
  }
}
