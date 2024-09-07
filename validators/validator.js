const { z } = require("zod")

const addressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required."),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required."),
  district: z.string().min(1, "District is required."),
  state: z.string().min(1, "State is required."),
  zipcode: z
    .string()
    .min(5, "Zipcode is required.")
    .max(10, "Zipcode must be between 5 and 10 characters."),
})

const proofSchema = z.object({
  type: z.number().min(1).optional(),
  number: z.string().min(1).optional(),
  document: z.string().min(1).optional(),
})

const commonUserSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required."),
  gender: z.string().min(1, "Gender is required."),
  dob: z.string().min(1, "Date of birth is required."),
  email: z.string().email("Invalid email format."),
  // contact: z.string().min(1, "Contact number is required."),
})

const addAdminSchema = commonUserSchema.extend({
  address: addressSchema,
  idProof: proofSchema,
  //   roleId: z.number().int().positive("Role ID must be a positive integer."),
})

const addCP_Schema = commonUserSchema.extend({
  personalMobile: z.string().min(1, "Personal mobile is required."),
  consultationMobile: z.string().optional(),
  address: addressSchema,
  proof: proofSchema,
  category: z.number().min(1, "Category is required."),
  degree: z.string().optional(),
  specialty: z.string().optional(),
  subSpecialty: z.string().optional(),
  superSpecialty: z.string().optional(),
  fellowship: z.string().optional(),
})

const addTelehealthProviderSchema = commonUserSchema.extend({
  permanentAddress: addressSchema,
  presentAddress: addressSchema,
  idProof: proofSchema,
  zone: z.number().int().positive("Zone ID must be a positive integer."),
})

const addCFEclinicSchema = commonUserSchema.extend({
  permanentAddress: addressSchema,
  presentAddress: addressSchema,
  idProof: proofSchema,
  eclinicId: z.string().min(1, "Eclinic ID is required."),
})

const addCFCP_Schema = commonUserSchema.extend({
  address: addressSchema,
  idProof: proofSchema,
  assignedCPs: z.array(z.object({ id: z.number().int().positive() })),
  assignedZones: z.array(z.object({ id: z.number().int().positive() })),
})

// Define a schema for partial updates
const updateCFCPSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  gender: z.enum(["M", "F", "O"]).optional(),
  dob: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .optional(),
  contact: z
    .string()
    .min(10, "Contact number should be at least 10 digits")
    .optional(),
  address: z
    .object({
      street: z.string().min(1, "Street is required").optional(),
      city: z.string().min(1, "City is required").optional(),
      state: z.string().min(1, "State is required").optional(),
      zip: z.string().min(5, "ZIP code should be at least 5 digits").optional(),
    })
    .optional(),
  idProof: z
    .object({
      type: z.string().min(1, "ID proof type is required").optional(),
      number: z.string().min(1, "ID proof number is required").optional(),
      document: z.string().min(1, "Proof document is required.").optional(),
    })
    .optional(),
  assignedCPs: z.array(z.object({ id: z.number().positive() })).optional(),
  assignedZones: z.array(z.object({ id: z.number().positive() })).optional(),
})

module.exports = {
  addAdminSchema,
  addCP_Schema,
  addTelehealthProviderSchema,
  addCFEclinicSchema,
  addCFCP_Schema,
  updateCFCPSchema,
}
