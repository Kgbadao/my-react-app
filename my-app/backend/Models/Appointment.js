const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true,
  },
  patientId: {
    type: String,
    required: true,
  },
  date: {
    type: String, // or Date if you want to store it as a date object
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  notes: String,
}, {
  timestamps: true
});

module.exports = mongoose.model("Appointment", appointmentSchema);
