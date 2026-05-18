// 실제 Supabase 마이그레이션 SQL 기준 1:1 정렬 (auth.users.id == public.users.id 가정).
// 미생성 테이블(conversations / conversation_messages / relationship_states) 는 Database 스키마에 등록하지 않는다.

export type Gender = 'male' | 'female';

export type DisclosureKind = 'region' | 'age' | 'photo' | 'contact';

export type RelationshipStage =
  | 'pre_disclosure'
  | 'region'
  | 'age'
  | 'photo'
  | 'contact'
  | 'full';

export type ConversationStatus = 'active' | 'left' | 'blocked' | 'archived';

export type MessageKind =
  | 'regular'
  | 'disclosure_request'
  | 'disclosure_accepted'
  | 'disclosure_declined'
  | 'disclosure_info';

export type Iso = string; // ISO 8601 timestamp

// ──────────────────────────────────────────────────────────────────────────
// users
// ──────────────────────────────────────────────────────────────────────────
export type DbUser = {
  id: string;
  phone: string | null;
  phone_verified: boolean | null;
  status: string | null;
  created_at: Iso;
  updated_at: Iso | null;
};

// ──────────────────────────────────────────────────────────────────────────
// user_profiles
// ──────────────────────────────────────────────────────────────────────────
export type DbUserProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  gender: Gender | null;
  birth_year: number | null;
  bio: string | null;
  region: string | null;
  visibility_stage: string | null;
  created_at: Iso;
  updated_at: Iso | null;
};

// ──────────────────────────────────────────────────────────────────────────
// profile_photos
// ──────────────────────────────────────────────────────────────────────────
export type DbProfilePhoto = {
  id: string;
  user_id: string;
  profile_id: string | null;
  storage_path: string;
  photo_order: number;
  is_primary: boolean | null;
  is_blurred: boolean | null;
  visibility_stage: string | null;
  created_at: Iso;
};

// ──────────────────────────────────────────────────────────────────────────
// posts
// ──────────────────────────────────────────────────────────────────────────
export type DbPost = {
  id: string;
  user_id: string;
  category: string;
  title: string | null;
  body: string;
  comment_count: number | null;
  max_comments: number | null;
  status: string | null;
  visibility: string | null;
  // 작성자 성별을 row 자체에 박아 두는 비정규화 컬럼.
  // create-post Edge Function 이 user_profiles.gender 를 읽어 자동으로 채운다.
  // 이성 간 답글 정책의 빠른 검증을 위해 별도 컬럼으로 저장한다 (조인 회피).
  author_gender: Gender | null;
  created_at: Iso;
  updated_at: Iso | null;
};

// ──────────────────────────────────────────────────────────────────────────
// post_comments
// ──────────────────────────────────────────────────────────────────────────
export type DbPostComment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  status: string | null;
  created_at: Iso;
  updated_at: Iso | null;
};

// ──────────────────────────────────────────────────────────────────────────
// conversation_invites
// (sender_id, reply_id) 가 unique. status 4종.
// ──────────────────────────────────────────────────────────────────────────
export type ConversationInviteStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'withdrawn';

export type DbConversationInvite = {
  id: string;
  post_id: string;
  reply_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  status: ConversationInviteStatus;
  created_at: Iso;
  responded_at: Iso | null;
};

export type DbConversationInviteInsert = Partial<DbConversationInvite> & {
  post_id: string;
  reply_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
};
export type DbConversationInviteUpdate = Partial<DbConversationInvite>;

// ──────────────────────────────────────────────────────────────────────────
// content_reports — 신고 데이터
// 운영자는 Supabase SQL editor 로 status='open' 항목을 검토한다.
// ──────────────────────────────────────────────────────────────────────────
export type DbContentReport = {
  id: string;
  reporter_id: string;
  target_type: string; // 'user' | 'post' | 'reply' | 'message' | 'conversation'
  target_id: string;
  reason_kind: string; // 'hate' | 'sexual' | 'spam' | 'private_info' | 'self_harm' | 'other'
  reason_detail: string | null;
  status: string; // 'open' | 'reviewed' | 'dismissed'
  created_at: Iso;
};

export type DbContentReportInsert = Partial<DbContentReport> & {
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason_kind: string;
};

// ──────────────────────────────────────────────────────────────────────────
// user_blocks — 사용자 차단 데이터 (양방향이 아닌, 단방향 차단)
// ──────────────────────────────────────────────────────────────────────────
export type DbUserBlock = {
  blocker_id: string;
  blocked_id: string;
  created_at: Iso;
};

export type DbUserBlockInsert = Partial<DbUserBlock> & {
  blocker_id: string;
  blocked_id: string;
};

// ──────────────────────────────────────────────────────────────────────────
// 미생성 테이블 (임시 타입, Database 스키마 비등록)
// ──────────────────────────────────────────────────────────────────────────
export type DbConversation = {
  id: string;
  post_id: string;
  invite_id: string | null;
  user_a_id: string;
  user_b_id: string;
  status: ConversationStatus;
  last_message_at: Iso | null;
  created_at: Iso;
  updated_at: Iso;
};

export type DbConversationMessage = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  kind: MessageKind;
  disclosure_kind: DisclosureKind | null;
  original_language: string | null;
  original_content: string;
  created_at: Iso;
};

export type DbRelationshipState = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  current_stage: RelationshipStage;
  can_reveal_profile: boolean;
  can_reveal_photo: boolean;
  region_revealed: boolean;
  age_revealed: boolean;
  photo_revealed: boolean;
  contact_revealed: boolean;
  created_at: Iso;
  updated_at: Iso;
};

// ──────────────────────────────────────────────────────────────────────────
// Insert / Update
// NOT NULL 등 DB 측 제약은 서버에 맡기고, 타입 시스템에서는 보수적으로 처리한다.
// 호출부에서 명확히 요구되는 필드만 required 로 둔다.
// ──────────────────────────────────────────────────────────────────────────
export type DbUserInsert = Partial<DbUser>;
export type DbUserUpdate = Partial<DbUser>;

export type DbUserProfileInsert = Partial<DbUserProfile> & { user_id: string };
export type DbUserProfileUpdate = Partial<DbUserProfile>;

export type DbProfilePhotoInsert = Partial<DbProfilePhoto> & {
  user_id: string;
  storage_path: string;
  photo_order: number;
};
export type DbProfilePhotoUpdate = Partial<DbProfilePhoto>;

export type DbPostInsert = Partial<DbPost> & {
  user_id: string;
  category: string;
  body: string;
};
export type DbPostUpdate = Partial<DbPost>;

export type DbPostCommentInsert = Partial<DbPostComment> & {
  post_id: string;
  user_id: string;
  body: string;
};
export type DbPostCommentUpdate = Partial<DbPostComment>;

// 미생성 테이블용 - 인터페이스 유지만.
export type DbConversationInsert = Partial<DbConversation> & {
  post_id: string;
  user_a_id: string;
  user_b_id: string;
};
export type DbConversationUpdate = Partial<DbConversation>;

export type DbConversationMessageInsert = Partial<DbConversationMessage> & {
  conversation_id: string;
  original_content: string;
};
export type DbConversationMessageUpdate = Partial<DbConversationMessage>;

export type DbRelationshipStateInsert = Partial<DbRelationshipState> & {
  user_a_id: string;
  user_b_id: string;
};
export type DbRelationshipStateUpdate = Partial<DbRelationshipState>;

type EmptyMap = { [_ in never]: never };

// supabase-js GenericSchema 호환을 위해 Views/Functions/Enums/CompositeTypes 도 빈 entry 채움.
// 미생성 테이블은 일부러 제외 → 강한 타입 연결 방지.
export type Database = {
  public: {
    Tables: {
      users: {
        Row: DbUser;
        Insert: DbUserInsert;
        Update: DbUserUpdate;
        Relationships: [];
      };
      user_profiles: {
        Row: DbUserProfile;
        Insert: DbUserProfileInsert;
        Update: DbUserProfileUpdate;
        Relationships: [];
      };
      profile_photos: {
        Row: DbProfilePhoto;
        Insert: DbProfilePhotoInsert;
        Update: DbProfilePhotoUpdate;
        Relationships: [];
      };
      posts: {
        Row: DbPost;
        Insert: DbPostInsert;
        Update: DbPostUpdate;
        Relationships: [];
      };
      post_comments: {
        Row: DbPostComment;
        Insert: DbPostCommentInsert;
        Update: DbPostCommentUpdate;
        Relationships: [];
      };
      conversation_invites: {
        Row: DbConversationInvite;
        Insert: DbConversationInviteInsert;
        Update: DbConversationInviteUpdate;
        Relationships: [];
      };
      conversations: {
        Row: DbConversation;
        Insert: DbConversationInsert;
        Update: DbConversationUpdate;
        Relationships: [];
      };
      content_reports: {
        Row: DbContentReport;
        Insert: DbContentReportInsert;
        Update: Partial<DbContentReport>;
        Relationships: [];
      };
      user_blocks: {
        Row: DbUserBlock;
        Insert: DbUserBlockInsert;
        Update: Partial<DbUserBlock>;
        Relationships: [];
      };
    };
    Views: EmptyMap;
    Functions: EmptyMap;
    Enums: EmptyMap;
    CompositeTypes: EmptyMap;
  };
};
