export interface User {
  id: string
  username: string
  email: string
  role?:
    | "super_admin"
    | "system_admin"
    | "org_admin"
    | "data_manager"
    | "supervisor"
    | "admin"
    | "agent"
    | "viewer"
  organization_id?: string
  created_at: string
  last_login?: string
  status?: "active" | "inactive"
  // Extended fields that might be returned by /users/me
  roles?: UserRole[]
  permissions?: UserPermission[]
}

export interface FormFieldValidation {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
}

export interface FormField {
  id: string
  type:
    | "text"
    | "textarea"
    | "email"
    | "number"
    | "date"
    | "select"
    | "radio"
    | "checkbox"
    | "gps"
    | "file"
    | "phone"
    | "url"
    | "color"
    | "range"
    | "rating"
    | "signature"
  label: string
  required: boolean
  placeholder?: string
  helpText?: string
  options?: FormFieldOption[]
  allowOther?: boolean
  accept?: string
  validation?: FormFieldValidation
  min?: number
  max?: number
  step?: number
  defaultValue?: any
}

export interface FormFieldOption {
  label: string
  value: string
}

export interface FormBranding {
  logo_url?: string
  banner_url?: string
  primary_color?: string
  accent_color?: string
  header_text?: string
  footer_text?: string
}

export interface Form {
  id: string
  title: string
  description?: string
  organization_id: string
  status: "draft" | "active" | "archived" | "decommissioned"
  version: number
  schema: {
    fields: FormField[]
    branding?: FormBranding
  }
  created_by: string
  created_at: string
  updated_at?: string
  published_at?: string
}

export interface GPSCoordinates {
  latitude: number
  longitude: number
  accuracy: number
}

export interface FormResponseData {
  [key: string]: any
}

export interface FormResponse {
  id: string
  form_id: string
  submitted_by: string
  submitted_at: string
  data: FormResponseData
  attachments?: Record<string, string>
}

export interface AuthState {
  token: string | null
  user: User | null
  isLoading: boolean
  error: string | null
}

// Roles and Permissions
export interface Role {
  id: string
  name: string
  description: string
  level: number
  is_system_role: boolean
  organization_id?: string
  created_at: string
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string
  created_at: string
}

export interface UserRole {
  id: string
  name: string
  description: string
  level: number
  assigned_at: string
  expires_at?: string
}

export interface UserPermission {
  id?: string
  name: string
  resource: string
  action: string
  description: string
  created_at?: string
}

// User preferences
export interface NotificationPreferences {
  email_notifications: boolean
  form_assignments: boolean
  responses: boolean
  system_updates: boolean
}

export interface ThemePreferences {
  theme: "light" | "dark" | "system"
  compact_mode: boolean
}

export interface PresignedUrlResponse {
  upload_url: string
  file_url: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
  permissions: UserPermission[]
  roles: UserRole[]
}

export interface Organization {
  id: string
  name: string
  logo_url?: string
  primary_color?: string
  created_at: string
}

// API Input Types
export interface CreateFormInput {
  title: string
  description?: string
  organization_id: string
  form_schema: {
    fields: FormField[]
    branding?: FormBranding
  }
  version: number
  status: "draft" | "active" | "archived" | "decommissioned"
}

export interface UpdateFormInput extends Partial<CreateFormInput> {}

export interface CreateResponseInput {
  form_id: string
  data: FormResponseData
  attachments?: Record<string, string>
}

export interface UpdateUserInput {
  username?: string
  email?: string
}

export interface UpdatePreferencesInput {
  theme?: ThemePreferences
  notifications?: NotificationPreferences
}

export interface UpdateNotificationPreferencesInput extends Partial<NotificationPreferences> {}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean
  data: T | null
  message?: string
  errors?: Record<string, string[]>
  timestamp?: string
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// RBAC Types
export interface RoleWithCounts {
  id: string
  name: string
  description?: string
  level: number
  created_at: string
  updated_at?: string
  permission_count: number
  user_count: number
}

export interface RoleWithPermissions {
  id: string
  name: string
  description?: string
  level: number
  created_at: string
  updated_at?: string
  permissions: UserPermission[]
}

export interface CreateRoleInput {
  name: string
  description?: string
  level?: number
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  level?: number
}

export interface CreatePermissionInput {
  name: string
  resource: string
  action: string
  description?: string
}

export interface AssignPermissionsInput {
  permission_ids: string[]
}

export interface AssignRoleInput {
  role_id: string
}

export interface UserWithRoles {
  id: string
  username: string
  email: string
  roles: UserRole[]
}

export interface EffectivePermissions {
  user_id: string
  username: string
  permissions: UserPermission[]
}

// Session Management
export interface UserSession {
  id: string
  device: string
  ip_address: string
  location?: string
  last_active: string
  created_at: string
  is_current: boolean
  user_agent: string
}

// Two-Factor Authentication
export interface TwoFactorStatus {
  enabled: boolean
  methods: string[]
  backup_codes_remaining: number
}

export interface TwoFactorSetup {
  method: string
  secret: string
  qr_code_url: string
  backup_codes: string[]
}

// API Keys
export interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at?: string
  expires_at?: string
  scopes: string[]
}

export interface CreateApiKeyInput {
  name: string
  scopes: string[]
  expires_in_days?: number
}

export interface ApiKeyWithSecret extends ApiKey {
  key: string
}

// Audit Logs
export interface AuditLog {
  id: string
  user_id: string
  username: string
  action_type: string
  resource_type?: string
  resource_id?: string
  severity: "info" | "warning" | "critical"
  ip_address: string
  user_agent: string
  details: Record<string, any>
  timestamp: string
}

// Webhooks
export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  enabled: boolean
  secret: string
  created_at: string
  last_triggered_at?: string
}

export interface CreateWebhookInput {
  name: string
  url: string
  events: string[]
  enabled?: boolean
}

// ============================================
// ELECTIONS & VOTING TYPES
// ============================================

export type ElectionType = "election" | "poll" | "survey" | "referendum"
export type VotingMethod = "single_choice" | "multi_choice" | "ranked_choice"
export type VerificationLevel = "anonymous" | "registered" | "verified"
export type ResultsVisibility = "real_time" | "after_close"
export type ElectionStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "closed"
  | "cancelled"

export interface ElectionBranding {
  logo_url?: string
  primary_color?: string
  header_text?: string
  footer_text?: string
}

export interface ElectionSettings {
  allow_write_in?: boolean
  randomize_candidates?: boolean
  show_party_affiliation?: boolean
  [key: string]: any
}

export interface Election {
  id: string
  organization_id: string
  organization_name?: string
  title: string
  description?: string
  election_type: ElectionType
  voting_method: VotingMethod
  verification_level: VerificationLevel
  require_national_id: boolean
  require_phone_otp: boolean
  results_visibility: ResultsVisibility
  show_voter_count: boolean
  start_date: string
  end_date: string
  status: ElectionStatus
  linked_form_id?: string
  settings: ElectionSettings
  branding: ElectionBranding
  created_by: string
  created_at: string
  updated_at?: string
  deleted: boolean
  // Nested data from detail endpoint
  positions?: ElectionPosition[]
  poll_options?: PollOption[]
}

export interface ElectionPosition {
  id: string
  election_id: string
  title: string
  description?: string
  max_selections: number
  display_order: number
  created_at: string
  candidates?: Candidate[]
}

export interface CandidatePolicies {
  [key: string]: string
}

export interface CandidateExperience {
  title?: string
  organization?: string
  years?: number
  description?: string
  [key: string]: any
}

export interface Candidate {
  id: string
  position_id: string
  position_title?: string
  election_id?: string
  name: string
  photo_url?: string
  party?: string
  bio?: string
  manifesto?: string
  policies: CandidatePolicies
  experience: CandidateExperience
  endorsements: string[]
  display_order: number
  created_at: string
  updated_at?: string
}

export interface PollOption {
  id: string
  election_id: string
  option_text: string
  description?: string
  display_order: number
  created_at: string
}

// Election Input Types
export interface CreateElectionInput {
  title: string
  description?: string
  election_type: ElectionType
  voting_method: VotingMethod
  verification_level?: VerificationLevel
  require_national_id?: boolean
  require_phone_otp?: boolean
  results_visibility?: ResultsVisibility
  show_voter_count?: boolean
  start_date: string
  end_date: string
  linked_form_id?: string
  settings?: ElectionSettings
  branding?: ElectionBranding
}

export interface UpdateElectionInput extends Partial<CreateElectionInput> {
  status?: ElectionStatus
}

export interface CreatePositionInput {
  title: string
  description?: string
  max_selections?: number
  display_order?: number
}

export interface UpdatePositionInput extends Partial<CreatePositionInput> {}

export interface CreateCandidateInput {
  name: string
  photo_url?: string
  party?: string
  bio?: string
  manifesto?: string
  policies?: CandidatePolicies
  experience?: CandidateExperience
  endorsements?: string[]
  display_order?: number
}

export interface UpdateCandidateInput extends Partial<CreateCandidateInput> {}

export interface CreatePollOptionInput {
  option_text: string
  description?: string
  display_order?: number
}

export interface UpdatePollOptionInput extends Partial<CreatePollOptionInput> {}

// Voting Types
export interface VoteSelection {
  position_id?: string
  candidate_id?: string
  poll_option_id?: string
  rank?: number
}

export interface CastVotesInput {
  votes: VoteSelection[]
  voter_token?: string
}

export interface VoteReceipt {
  election_id: string
  election_title: string
  election_type: ElectionType
  voter_hash: string
  votes_cast: number
  voted_at: string
  confirmation_code: string
}

// Election Results Types
export interface CandidateResult {
  candidate_id: string
  name: string
  party?: string
  photo_url?: string
  votes: number
  percentage: number
  rank: number
  rounds?: RankedChoiceRound[]
}

export interface RankedChoiceRound {
  round: number
  candidates: {
    candidate_id: string
    name: string
    votes: number
    percentage: number
  }[]
}

export interface PositionResult {
  position_id: string
  title: string
  max_selections: number
  total_votes: number
  candidates: CandidateResult[]
}

export interface PollOptionResult {
  option_id: string
  option_text: string
  description?: string
  votes: number
  percentage: number
  rank: number
}

export interface ElectionResults {
  election_id: string
  election_title: string
  election_type: ElectionType
  voting_method: VotingMethod
  status: ElectionStatus
  total_voters: number
  results_hidden?: boolean
  message?: string
  positions?: PositionResult[]
  options?: PollOptionResult[]
  finalized?: boolean
  finalized_by?: string
}

// Election Analytics Types
export interface DemographicBreakdown {
  election_id: string
  by_region: { region: string; votes: number }[]
  by_age_group: { age_group: string; votes: number }[]
  by_hour: { hour: string; votes: number }[]
}

export interface VotingTrend {
  period: string
  votes: number
  unique_voters: number
  cumulative_votes: number
}

export interface VotingTrends {
  election_id: string
  granularity: "minute" | "hour" | "day"
  trend: VotingTrend[]
}

export interface TurnoutStats {
  election_id: string
  registered_voters: number
  votes_cast: number
  unique_voters: number
  turnout_rate: number
  by_region: {
    region: string
    registered: number
    voted: number
    turnout_rate: number
  }[]
}

export interface ElectionPredictions {
  election_id: string
  time_progress: number
  current_votes: number
  voting_velocity: number
  projected_total_votes: number
  remaining_hours: number
  confidence: "low" | "medium" | "high"
  projected_winners?: {
    position_id: string
    position_title: string
    projected_winner: string
    current_lead: number
  }[]
}

export interface CandidateComparison {
  candidate_id: string
  name: string
  party?: string
  position: string
  bio?: string
  policies: CandidatePolicies
  experience: CandidateExperience
  endorsements: string[]
  vote_stats: {
    total_votes: number
    regions_present: number
  }
  top_regions: { region: string; votes: number }[]
}

export interface ElectionAnalytics {
  election: {
    id: string
    title: string
    type: ElectionType
    status: ElectionStatus
    voting_method: VotingMethod
  }
  results: ElectionResults
  demographics: DemographicBreakdown
  trends: VotingTrends
  turnout: TurnoutStats
}

export interface ElectionsDashboard {
  status_summary: Record<ElectionStatus, number>
  active_elections: {
    id: string
    title: string
    type: ElectionType
    end_date: string
    votes: number
  }[]
  upcoming_elections: {
    id: string
    title: string
    type: ElectionType
    start_date: string
  }[]
  recent_closed: {
    id: string
    title: string
    end_date: string
    total_votes: number
  }[]
}

export interface ElectionAuditLog {
  id: string
  election_id: string
  action: string
  actor_id?: string
  actor_name?: string
  details?: Record<string, any>
  ip_address?: string
  created_at: string
}

// ============================================
// POLITICAL PARTIES
// ============================================

export type PartyStatus = "active" | "inactive" | "suspended" | "dissolved"

export interface PoliticalParty {
  id: string
  organization_id: string
  name: string
  abbreviation?: string
  slogan?: string
  description?: string
  logo_url?: string
  color_primary?: string
  color_secondary?: string
  headquarters_address?: string
  website?: string
  email?: string
  phone?: string
  social_links?: Record<string, string>
  leader_name?: string
  founded_date?: string
  registration_number?: string
  total_candidates: number
  total_elections_participated: number
  total_wins: number
  status: PartyStatus
  deleted?: boolean
  deleted_at?: string
  created_at: string
  updated_at: string
  election_history?: PartyElectionHistory[]
}

export interface PartyElectionHistory {
  party_id: string
  party_name: string
  abbreviation?: string
  election_id: string
  election_title: string
  election_type: ElectionType
  election_date: string
  candidates_fielded: number
  seats_won: number
  total_votes: number
  avg_vote_percentage: number
}

export interface CreatePartyInput {
  name: string
  abbreviation?: string
  slogan?: string
  description?: string
  logo_url?: string
  color_primary?: string
  color_secondary?: string
  headquarters_address?: string
  website?: string
  email?: string
  phone?: string
  social_links?: Record<string, string>
  leader_name?: string
  founded_date?: string
  registration_number?: string
}

export interface UpdatePartyInput extends Partial<CreatePartyInput> {
  status?: PartyStatus
}

export interface PartyStats {
  party: PoliticalParty
  candidates: {
    total: number
    active: number
  }
  elections: {
    total_participations: number
    total_wins: number
    total_votes_received: number
  }
  by_election_type: Record<
    string,
    {
      elections: number
      candidates: number
      wins: number
      votes: number
    }
  >
}

export interface PartyLeaderboardEntry {
  rank: number
  id: string
  name: string
  abbreviation?: string
  logo_url?: string
  color_primary?: string
  total_candidates: number
  total_elections_participated: number
  total_wins: number
}

// ============================================
// CANDIDATE PROFILES
// ============================================

export type CandidateProfileStatus = "active" | "inactive" | "suspended" | "deceased"
export type CandidacyStatus = "nominated" | "confirmed" | "withdrawn" | "disqualified"

export interface CandidateProfile {
  id: string
  organization_id: string
  name: string
  photo_url?: string
  email?: string
  phone?: string
  date_of_birth?: string
  party_id?: string
  party?: string
  bio?: string
  manifesto?: string
  policies?: Record<string, string[]>
  experience?: Record<string, string>
  endorsements?: string[]
  education?: Array<{
    institution: string
    degree: string
    year: string
  }>
  social_links?: Record<string, string>
  status: CandidateProfileStatus
  total_elections: number
  total_wins: number
  total_votes_received: number
  highest_vote_percentage: number
  last_election_date?: string
  created_at: string
  updated_at: string
  election_history?: CandidateElectionHistory[]
  // Joined fields
  party_name?: string
  party_abbreviation?: string
}

export interface CandidateElectionHistory {
  candidate_profile_id: string
  candidate_name: string
  election_id: string
  election_title: string
  election_type: ElectionType
  election_date: string
  position_id: string
  position_title: string
  display_name: string
  votes_received: number
  vote_percentage: number
  rank: number
  is_winner: boolean
  candidacy_status: CandidacyStatus
  party_name?: string
  party_abbreviation?: string
}

export interface CreateCandidateProfileInput {
  name: string
  photo_url?: string
  email?: string
  phone?: string
  date_of_birth?: string
  party_id?: string
  party?: string
  bio?: string
  manifesto?: string
  policies?: Record<string, string[]>
  experience?: Record<string, string>
  endorsements?: string[]
  education?: Array<{
    institution: string
    degree: string
    year: string
  }>
  social_links?: Record<string, string>
}

export interface UpdateCandidateProfileInput extends Partial<CreateCandidateProfileInput> {
  status?: CandidateProfileStatus
}

export interface AssignCandidateInput {
  candidate_profile_id: string
  position_id: string
  display_name?: string
  campaign_photo_url?: string
  campaign_slogan?: string
  campaign_manifesto?: string
  ballot_number?: number
}

export interface CandidateAssignment {
  id: string
  candidate_profile_id: string
  position_id: string
  election_id: string
  display_name?: string
  campaign_photo_url?: string
  campaign_slogan?: string
  campaign_manifesto?: string
  ballot_number?: number
  candidacy_status: CandidacyStatus
  votes_received: number
  vote_percentage: number
  is_winner: boolean
  created_at: string
  updated_at: string
}

export interface CandidateStats {
  candidate: CandidateProfile
  elections: {
    total: number
    wins: number
    win_rate: number
  }
  votes: {
    total: number
    highest: number
    highest_percentage: number
    average: number
  }
  by_election_type: Record<
    string,
    {
      count: number
      wins: number
      total_votes: number
    }
  >
}

export interface CandidateLeaderboardEntry {
  rank: number
  id: string
  name: string
  photo_url?: string
  party_name?: string
  party_abbreviation?: string
  total_elections: number
  total_wins: number
  total_votes_received: number
  win_rate: number
}

// ============================================
// COLLATION SYSTEM TYPES
// ============================================

export interface Region {
  id: string
  name: string
  code: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Constituency {
  id: string
  name: string
  code: string
  region_id: string
  region_name?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface ElectoralArea {
  id: string
  name: string
  code: string
  constituency_id: string
  constituency_name?: string
  region_name?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface PollingStation {
  id: string
  name: string
  code: string
  electoral_area_id: string
  electoral_area_name?: string
  constituency_name?: string
  region_name?: string
  address?: string
  gps_coordinates?: string
  registered_voters: number
  metadata?: Record<string, unknown>
  created_at: string
}

export interface CollationCenter {
  id: string
  name: string
  center_type: "electoral_area" | "constituency" | "regional" | "national"
  electoral_area_id?: string
  constituency_id?: string
  region_id?: string
  address?: string
  gps_coordinates?: string
  electoral_area_name?: string
  constituency_name?: string
  region_name?: string
  created_at: string
}

export interface CollationOfficer {
  id: string
  user_id: string
  officer_type: "presiding" | "returning" | "deputy_returning" | "collation_clerk"
  national_id?: string
  phone?: string
  is_active: boolean
  username?: string
  email?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface OfficerAssignment {
  id: string
  officer_id: string
  election_id: string
  polling_station_id?: string
  collation_center_id?: string
  role: "presiding_officer" | "returning_officer" | "collation_clerk"
  officer_name?: string
  officer_type?: string
  polling_station_name?: string
  polling_station_code?: string
  collation_center_name?: string
  created_at: string
}

export type ResultSheetStatus = "draft" | "submitted" | "verified" | "approved" | "certified"
export type ResultSheetType = "polling_station" | "electoral_area" | "constituency" | "regional" | "national"

export interface ResultSheet {
  id: string
  election_id: string
  polling_station_id?: string
  collation_center_id?: string
  sheet_type: ResultSheetType
  status: ResultSheetStatus
  total_registered_voters?: number
  total_votes_cast?: number
  total_valid_votes?: number
  total_rejected_votes?: number
  polling_station_name?: string
  polling_station_code?: string
  collation_center_name?: string
  electoral_area_name?: string
  constituency_name?: string
  region_name?: string
  election_title?: string
  created_by: string
  created_by_username?: string
  submitted_at?: string
  submitted_by?: string
  verified_at?: string
  verified_by?: string
  approved_at?: string
  approved_by?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at?: string
}

export interface ResultSheetEntry {
  id: string
  result_sheet_id: string
  position_id?: string
  candidate_id?: string
  poll_option_id?: string
  votes: number
  votes_in_words?: string
  position_title?: string
  candidate_name?: string
  candidate_party?: string
  poll_option_text?: string
  created_at: string
}

export interface ResultSheetAttachment {
  id: string
  result_sheet_id: string
  attachment_type: "pink_sheet" | "photo" | "signature" | "other"
  file_url: string
  file_name?: string
  uploaded_by: string
  uploaded_by_username?: string
  uploaded_at: string
}

export interface CollationWorkflowLog {
  id: string
  result_sheet_id: string
  action: string
  performed_by: string
  performed_by_username?: string
  notes?: string
  metadata?: Record<string, unknown>
  performed_at: string
}

export interface CollationIncident {
  id: string
  election_id: string
  polling_station_id?: string
  collation_center_id?: string
  incident_type: "violence" | "equipment_failure" | "irregularity" | "protest" | "other"
  severity: "low" | "medium" | "high" | "critical"
  description: string
  status: "reported" | "investigating" | "resolved"
  evidence_urls?: string[]
  reported_by: string
  reported_by_username?: string
  resolved_by?: string
  resolved_by_username?: string
  resolved_at?: string
  resolution_notes?: string
  polling_station_name?: string
  collation_center_name?: string
  reported_at: string
}

export interface CollationDiscrepancy {
  id: string
  result_sheet_id: string
  discrepancy_type: string
  expected_value?: string
  actual_value?: string
  description: string
  status: "detected" | "investigating" | "resolved"
  resolved_by?: string
  resolved_by_username?: string
  resolved_at?: string
  resolution_notes?: string
  sheet_type?: string
  polling_station_name?: string
  detected_at: string
}

export interface CollationDashboard {
  election: {
    id: string
    title: string
    status: string
  }
  summary: {
    total_stations: number
    completed: number
    in_progress: number
    pending: number
    completion_percentage: number
  }
  status_breakdown: {
    draft: number
    submitted: number
    verified: number
    approved: number
    certified: number
  }
  regional_breakdown: Array<{
    region_id: string
    region_name: string
    total_stations: number
    completed_stations: number
    total_votes: number
  }>
  top_candidates: Array<{
    candidate_name: string
    party: string
    total_votes: number
  }>
  last_updated: string
}

export interface CollationLiveFeedItem {
  id: string
  action: string
  performed_at: string
  notes?: string
  performed_by: string
  sheet_type: string
  polling_station_name?: string
  polling_station_code?: string
  electoral_area_name?: string
  constituency_name?: string
  region_name?: string
}

export interface SubmissionProgress {
  total_stations: number
  sheets_created: number
  drafts: number
  submitted: number
  verified: number
  approved: number
  certified: number
  completion_rate: number
}
