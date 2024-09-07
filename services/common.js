const bcrypt = require("bcryptjs")

const insertAddress = async (connection, address) => {
  const [result] = await connection.query(
    "INSERT INTO address (address_line1, address_line2, city_block, district, state, zipcode) VALUES (?, ?, ?, ?, ?, ?)",
    [
      address.line1,
      address.line2,
      address.city,
      address.district,
      address.state,
      address.zipcode,
    ]
  )
  return result.insertId
}

const updateAddress = async (connection, addressId, address) => {
  const addressData = {
    address_line1: address.line1,
    address_line2: address.line2,
    city_block: address.city,
    district: address.district,
    state: address.state,
    zipcode: address.zipcode,
  }

  await connection.query(
    "UPDATE address SET address_line1 = COALESCE(?, address_line1), address_line2 = COALESCE(?, address_line2), city_block = COALESCE(?, city_block), district = COALESCE(?, district), state = COALESCE(?, state), zipcode = COALESCE(?, zipcode) WHERE id = ?",
    [
      addressData.address_line1,
      addressData.address_line2,
      addressData.city_block,
      addressData.district,
      addressData.state,
      addressData.zipcode,
      addressId,
    ]
  )
}

const insertProof = async (connection, proof) => {
  const [result] = await connection.query(
    "INSERT INTO id_proof (proof_type, proof_no, proof) VALUES (?, ?, ?)",
    [proof.type, proof.number, proof.document]
  )
  return result.insertId
}

const updateProof = async (connection, proofId, proof) => {
  await connection.query(
    "UPDATE id_proof SET proof_type = COALESCE(?, proof_type), proof_no = COALESCE(?, proof_no), proof = COALESCE(?, proof) WHERE id = ?",
    [proof.type, proof.number, proof.document, proofId]
  )
}

const insertUser = async (connection, { email, password, roleId, refId }) => {
  await connection.query(
    "INSERT INTO users (email, password, role_id, ref_id) VALUES (?, ?, ?, ?)",
    [email, password, roleId, refId]
  )
}

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10)
}

// Check if a user with the given email already exists
const checkUserExists = async (email, connection) => {
  const [results] = await connection.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  )
  return results
}

module.exports = {
  insertAddress,
  insertProof,
  insertUser,
  hashPassword,
  checkUserExists,
  updateProof,
  updateAddress,
}
