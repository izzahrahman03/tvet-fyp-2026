// components/userTable/tableConfig.js

export const COLUMNS = {
  applicant:           ["name", "email", "status", "date"],
  student:             ["name", "email", "matric_number", "intake_name", "status", "date"],
  industry_partner:    ["company_name", "email", "phone", "industry_sector", "location", "status", "date"],
  industry_supervisor: ["name", "email", "phone", "company", "position", "status", "date"],
};

export const COL_LABEL = {
  name:               "Name",
  company_name:       "Company",
  ic_number:          "IC Number",
  date_of_birth:      "Date of Birth",
  gender:             "Gender",
  race:               "Race",
  marital_status:     "Marital Status",
  email:              "Email",
  phone:              "Phone",
  street_address:     "Address",
  city:               "City",
  postal_code:        "Postal Code",
  state:              "State",
  country:            "Country",
  status:             "Status",
  updated_at:         "Last Updated",
  company_name:       "Company Name",
  industry_sector:    "Industry Sector",
  location:           "Location",
  company:            "Company",
  position:           "Position",
  date:               "Joined",
  matric_number:      "Matric Number",
  intake_name:        "Intake",
  interview_datetime: "Interview Date & Time",
  venue:              "Venue",
  interviewer_name:   "Interviewer",
  remarks:            "Remarks",
};