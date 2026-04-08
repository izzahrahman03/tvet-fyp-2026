// components/userTable/tableConfig.js

export const COLUMNS = {
  applicant:           ["name", "email", "status", "date"],
  student:             ["name", "email", "phone", "matric_number", "intake_name", "status", "date"],
  // company_name + contact_person_name are both returned by the list query
  industry_partner:    ["company_name", "contact_person_name", "email", "phone", "industry_sector", "location", "status", "date"],
  // company is inherited from industry_partners via JOIN; no separate company column on supervisors
  industry_supervisor: ["name", "email", "phone", "company", "position", "status", "date"],
  // vacancy: company_name is populated via JOIN on partner_id
  vacancy:             ["position_name", "company_name", "capacity", "start_date", "end_date", "status"],
  manager:             ["name", "email", "phone", "status", "date"],
  application:         ["name", "email", "phone", "status", "created_at"],
};

export const COL_LABEL = {
  name:                 "Name",
  contact_person_name:  "Contact Person",
  company_name:         "Company Name",
  ic_number:            "IC Number",
  date_of_birth:        "Date of Birth",
  gender:               "Gender",
  race:                 "Race",
  marital_status:       "Marital Status",
  email:                "Email",
  phone:                "Phone Number",
  contact_person_phone: "Contact Person Phone",
  street_address:       "Address",
  city:                 "City",
  postal_code:          "Postal Code",
  state:                "State",
  country:              "Country",
  status:               "Status",
  updated_at:           "Last Updated",
  industry_sector:      "Industry Sector",
  location:             "Location",
  company:              "Company",
  position:             "Position",
  date:                 "Joined",
  created_at:          "Applied On",
  matric_number:        "Matric Number",
  intake_name:          "Intake",
  interview_datetime:   "Interview Date & Time",
  venue:                "Venue",
  interviewer_name:     "Interviewer",
  remarks:              "Remarks",
  hear_about_us:        "How They Heard About Us",
  // ── Vacancy ─────────────────────────────────────────────
  position_name:        "Position",
  capacity:             "Capacity",
  description:          "Description",
  responsibilities:     "Responsibilities",
  start_date:           "Start Date",
  end_date:             "End Date",
};

// ── "How did you hear about us" display labels ────────────
export const HEAR_ABOUT_LABEL = {
  social_tiktok:    "Social Media – TikTok",
  social_instagram: "Social Media – Instagram",
  social_facebook:  "Social Media – Facebook",
  friends_family:   "Friends / Family Recommendation",
  school_teacher:   "School Teacher / Counsellor Recommendation",
  vitrox_website:   "ViTrox TVET's Website",
  events:           "Events (Education / Career Fair, School Visit)",
};