-- =============================================================================
-- SI-PD BPHL WILAYAH XI BANJARBARU — SKEMA SQL AWAL (TAHAP 1 & 2 REVISED)
-- File: migrations/001_initial_schema.sql
-- Keterangan: DDL PostgreSQL lengkap untuk kontrak domain SI-PD V2.0
-- =============================================================================

-- Enable gen_random_uuid (Native PostgreSQL ANSI Standard)

-- -----------------------------------------------------------------------------
-- 1. ENUM TYPES DEFINITION
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('admin', 'validator', 'verifikator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_status_type AS ENUM ('DRAFT', 'BERJALAN', 'MENUNGGU_LAPORAN', 'SELESAI', 'DIBATALKAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status_type AS ENUM (
        'DRAFT', 
        'DIAJUKAN_VERIFIKASI', 
        'PERLU_REVISI', 
        'TERVERIFIKASI', 
        'MENUNGGU_VALIDASI', 
        'DIKEMBALIKAN_VALIDATOR', 
        'DISETUJUI', 
        'DIBATALKAN'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE review_action_type AS ENUM ('REVISION_REQUESTED', 'VERIFIED', 'VALIDATION_RETURNED', 'APPROVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attachment_provider_type AS ENUM ('LOCAL_PRIVATE', 'GDRIVE_SHARED', 'EXTERNAL_LEGACY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE staff_study_status_type AS ENUM ('DRAFT', 'DIAJUKAN', 'DISETUJUI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 2. CORE TABLES DEFINITION
-- -----------------------------------------------------------------------------

-- Table: users (Pegawai / Pengguna System)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nip VARCHAR(30) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    pangkat VARCHAR(100),
    golongan VARCHAR(20),
    jabatan VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role_type NOT NULL DEFAULT 'user',
    password_hash VARCHAR(255) NOT NULL,
    requires_password_reset BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    tmt_pangkat DATE,
    tmt_jabatan DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: attachments (Metadata Lampiran & Dokumen Terkontrol)
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID,
    report_id UUID,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    provider attachment_provider_type NOT NULL DEFAULT 'LOCAL_PRIVATE',
    file_id_ref TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: assignments (Surat Tugas Resmi)
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_st VARCHAR(100) UNIQUE NOT NULL,
    tanggal_st DATE NOT NULL,
    file_st_id UUID REFERENCES attachments(id) ON DELETE SET NULL,
    pemberi_tugas_nama VARCHAR(255) NOT NULL,
    pemberi_tugas_jabatan VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: activities (Kegiatan Induk Pekerjaan)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE RESTRICT,
    jenis_kegiatan_id VARCHAR(50) NOT NULL,
    nama_kegiatan TEXT NOT NULL,
    pelaku_usaha_id VARCHAR(50),
    lokasi TEXT NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    status activity_status_type NOT NULL DEFAULT 'DRAFT',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_kegiatan_dates CHECK (tanggal_selesai >= tanggal_mulai)
);

-- Add Foreign Key activity_id to attachments
ALTER TABLE attachments 
    DROP CONSTRAINT IF EXISTS fk_attachments_activity,
    ADD CONSTRAINT fk_attachments_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;

-- Table: activity_members (Anggota Tim Pelaksana Kegiatan)
CREATE TABLE IF NOT EXISTS activity_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    peran_dalam_tim VARCHAR(20) NOT NULL DEFAULT 'ANGGOTA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_activity_member UNIQUE (activity_id, user_id)
);

-- Table: reviewer_assignments (Penugasan Verifikator Khusus per Kegiatan)
CREATE TABLE IF NOT EXISTS reviewer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    ditugaskan_oleh UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_activity_reviewer UNIQUE (activity_id, reviewer_user_id)
);

-- Table: reports (Laporan Perjalanan Dinas Utama)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL UNIQUE REFERENCES activities(id) ON DELETE RESTRICT,
    current_version_id UUID,
    status report_status_type NOT NULL DEFAULT 'DRAFT',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add Foreign Key report_id to attachments
ALTER TABLE attachments 
    DROP CONSTRAINT IF EXISTS fk_attachments_report,
    ADD CONSTRAINT fk_attachments_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;

-- Table: report_versions (Snapshot Versi Laporan - Immutable)
CREATE TABLE IF NOT EXISTS report_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    judul_laporan TEXT NOT NULL,
    maksud_tujuan TEXT,
    hasil_kegiatan TEXT,
    kesimpulan TEXT,
    saran TEXT,
    snapshot_data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_hash VARCHAR(64),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_report_version UNIQUE (report_id, version_number)
);

-- Add Foreign Key current_version_id to reports
ALTER TABLE reports
    DROP CONSTRAINT IF EXISTS fk_reports_current_version,
    ADD CONSTRAINT fk_reports_current_version FOREIGN KEY (current_version_id) REFERENCES report_versions(id) ON DELETE SET NULL;

-- Table: review_comments (Catatan Pemeriksaan & Revisi Verifikator/Validator - Append Only)
CREATE TABLE IF NOT EXISTS review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_version_id UUID NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action review_action_type NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: staff_studies (Naskah Telaahan Staf)
CREATE TABLE IF NOT EXISTS staff_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approved_report_version_id UUID REFERENCES report_versions(id) ON DELETE RESTRICT,
    legacy_report_id_ref VARCHAR(100),
    is_legacy_unapproved BOOLEAN NOT NULL DEFAULT false,
    judul TEXT NOT NULL,
    persoalan TEXT NOT NULL,
    praanggapan TEXT NOT NULL,
    fakta TEXT NOT NULL,
    analisis TEXT NOT NULL,
    kesimpulan TEXT NOT NULL,
    saran TEXT NOT NULL,
    tanggal_telaahan DATE NOT NULL DEFAULT CURRENT_DATE,
    status staff_study_status_type NOT NULL DEFAULT 'DRAFT',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. INDEXES FOR HIGH PERFORMANCE QUERYING
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activities_assignment ON activities(assignment_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activity_members_user ON activity_members(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_user ON reviewer_assignments(reviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_activity ON reports(activity_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_report_versions_report ON report_versions(report_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_version ON review_comments(report_version_id);
CREATE INDEX IF NOT EXISTS idx_attachments_activity ON attachments(activity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_report ON attachments(report_id);
CREATE INDEX IF NOT EXISTS idx_staff_studies_report_version ON staff_studies(approved_report_version_id);

-- -----------------------------------------------------------------------------
-- 4. DATABASE-LEVEL BUSINESS CONSTRAINT TRIGGERS
-- -----------------------------------------------------------------------------

-- Trigger 4.1: Automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

DROP TRIGGER IF EXISTS update_assignments_modtime ON assignments;
CREATE TRIGGER update_assignments_modtime BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

DROP TRIGGER IF EXISTS update_activities_modtime ON activities;
CREATE TRIGGER update_activities_modtime BEFORE UPDATE ON activities FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

DROP TRIGGER IF EXISTS update_reports_modtime ON reports;
CREATE TRIGGER update_reports_modtime BEFORE UPDATE ON reports FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

DROP TRIGGER IF EXISTS update_staff_studies_modtime ON staff_studies;
CREATE TRIGGER update_staff_studies_modtime BEFORE UPDATE ON staff_studies FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- Trigger 4.2: Immutability of report_versions and review_comments (Prevent Update/Delete)
CREATE OR REPLACE FUNCTION prevent_immutable_record_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'LKP_IMMUTABLE_ERROR: Snapshot versi laporan dan catatan review bersifat append-only dan tidak dapat diubah/dihapus.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_report_versions ON report_versions;
CREATE TRIGGER trg_immutable_report_versions 
    BEFORE UPDATE OR DELETE ON report_versions 
    FOR EACH ROW EXECUTE PROCEDURE prevent_immutable_record_modification();

DROP TRIGGER IF EXISTS trg_immutable_review_comments ON review_comments;
CREATE TRIGGER trg_immutable_review_comments 
    BEFORE UPDATE OR DELETE ON review_comments 
    FOR EACH ROW EXECUTE PROCEDURE prevent_immutable_record_modification();

-- Trigger 4.3: Match current_version_id to same report_id
CREATE OR REPLACE FUNCTION check_report_current_version_match()
RETURNS TRIGGER AS $$
DECLARE
    target_report_id UUID;
BEGIN
    IF NEW.current_version_id IS NOT NULL THEN
        SELECT report_id INTO target_report_id FROM report_versions WHERE id = NEW.current_version_id;
        IF target_report_id IS NULL OR target_report_id <> NEW.id THEN
            RAISE EXCEPTION 'LKP_VERSION_MATCH_ERROR: current_version_id (%) harus menunjuk ke versi milik laporan yang sama (%).', NEW.current_version_id, NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_report_current_version ON reports;
CREATE TRIGGER trg_check_report_current_version 
    BEFORE INSERT OR UPDATE OF current_version_id ON reports 
    FOR EACH ROW EXECUTE PROCEDURE check_report_current_version_match();

-- Trigger 4.4: Staff Study Creation Lock
-- Post-cutover staff studies MUST have approved_report_version_id pointing to report in status DISETUJUI.
-- Legacy unapproved staff studies are allowed ONLY when is_legacy_unapproved = true and approved_report_version_id IS NULL.
CREATE OR REPLACE FUNCTION check_staff_study_report_status()
RETURNS TRIGGER AS $$
DECLARE
    parent_report_status report_status_type;
BEGIN
    -- Legacy unapproved exception handling
    IF NEW.is_legacy_unapproved = true THEN
        IF NEW.approved_report_version_id IS NOT NULL THEN
            RAISE EXCEPTION 'LKP_STAFF_STUDY_LOCK_ERROR: Record legacy unapproved tidak boleh menunjuk ke approved_report_version_id.';
        END IF;
        RETURN NEW;
    END IF;

    -- Strict post-cutover enforcement
    IF NEW.approved_report_version_id IS NULL THEN
        RAISE EXCEPTION 'LKP_STAFF_STUDY_LOCK_ERROR: Telaahan Staf baru wajib merujuk ke approved_report_version_id yang sah.';
    END IF;

    SELECT r.status INTO parent_report_status 
    FROM report_versions rv 
    JOIN reports r ON rv.report_id = r.id 
    WHERE rv.id = NEW.approved_report_version_id;

    IF parent_report_status IS NULL OR parent_report_status <> 'DISETUJUI' THEN
        RAISE EXCEPTION 'LKP_STAFF_STUDY_LOCK_ERROR: Telaahan Staf hanya dapat dibuat dari versi laporan yang berstatus DISETUJUI (Status saat ini: %).', COALESCE(parent_report_status::text, 'TIDAK_ADA');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_staff_study_report_status ON staff_studies;
CREATE TRIGGER trg_check_staff_study_report_status 
    BEFORE INSERT ON staff_studies 
    FOR EACH ROW EXECUTE PROCEDURE check_staff_study_report_status();

-- Trigger 4.5: State Machine Report Status Transition Guard
CREATE OR REPLACE FUNCTION check_report_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow unchanged status
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Allowed State Machine Transitions:
    -- DRAFT -> DIAJUKAN_VERIFIKASI, DIBATALKAN
    IF OLD.status = 'DRAFT' AND NEW.status NOT IN ('DIAJUKAN_VERIFIKASI', 'DIBATALKAN') THEN
        RAISE EXCEPTION 'LKP_STATE_MACHINE_ERROR: Transisi tidak sah dari DRAFT ke %', NEW.status;
    END IF;

    -- DIAJUKAN_VERIFIKASI -> PERLU_REVISI, TERVERIFIKASI, DIBATALKAN
    IF OLD.status = 'DIAJUKAN_VERIFIKASI' AND NEW.status NOT IN ('PERLU_REVISI', 'TERVERIFIKASI', 'DIBATALKAN') THEN
        RAISE EXCEPTION 'LKP_STATE_MACHINE_ERROR: Transisi tidak sah dari DIAJUKAN_VERIFIKASI ke %', NEW.status;
    END IF;

    -- PERLU_REVISI -> DRAFT, DIBATALKAN
    IF OLD.status = 'PERLU_REVISI' AND NEW.status NOT IN ('DRAFT', 'DIBATALKAN') THEN
        RAISE EXCEPTION 'LKP_STATE_MACHINE_ERROR: Transisi tidak sah dari PERLU_REVISI ke %', NEW.status;
    END IF;

    -- TERVERIFIKASI -> MENUNGGU_VALIDASI, DIBATALKAN
    IF OLD.status = 'TERVERIFIKASI' AND NEW.status NOT IN ('MENUNGGU_VALIDASI', 'DIBATALKAN') THEN
        RAISE EXCEPTION 'LKP_STATE_MACHINE_ERROR: Transisi tidak sah dari TERVERIFIKASI ke %', NEW.status;
    END IF;

    -- MENUNGGU_VALIDASI -> DIKEMBALIKAN_VALIDATOR, DISETUJUI, DIBATALKAN
    IF OLD.status = 'MENUNGGU_VALIDASI' AND NEW.status NOT IN ('DIKEMBALIKAN_VALIDATOR', 'DISETUJUI', 'DIBATALKAN') THEN
        RAISE EXCEPTION 'LKP_STATE_MACHINE_ERROR: Transisi tidak sah dari MENUNGGU_VALIDASI ke %', NEW.status;
    END IF;

    -- DIKEMBALIKAN_VALIDATOR -> DRAFT, DIBATALKAN
    IF OLD.status = 'DIKEMBALIKAN_VALIDATOR' AND NEW.status NOT IN ('DRAFT', 'DIBATALKAN') THEN
        RAISE EXCEPTION 'LKP_STATE_MACHINE_ERROR: Transisi tidak sah dari DIKEMBALIKAN_VALIDATOR ke %', NEW.status;
    END IF;

    -- DISETUJUI -> Cannot transition out (Final approved state unless cancelled by explicit authority)
    IF OLD.status = 'DISETUJUI' AND NEW.status NOT IN ('DIBATALKAN') THEN
        RAISE EXCEPTION 'LKP_STATE_MACHINE_ERROR: Laporan yang sudah DISETUJUI tidak dapat diubah statusnya ke %', NEW.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_report_status_transition ON reports;
CREATE TRIGGER trg_check_report_status_transition 
    BEFORE UPDATE OF status ON reports 
    FOR EACH ROW EXECUTE PROCEDURE check_report_status_transition();
