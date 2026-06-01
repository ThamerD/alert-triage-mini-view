-- Migration: Alert triage core tables
-- Date: 2026-05-31
-- Description:
--   1. Create Alerts table with rowversion for optimistic concurrency
--   2. Create AlertStatusHistory audit table (append-only)
--   3. Indexes tuned for the list view's filter + sort patterns
--   4. Show the parameterized UPDATE that the C# repo would call,
--      using OUTPUT INTO to insert the history row in the same statement.
--
-- Target engine: Azure SQL / SQL Server 2019+.
-- Equivalent Postgres notes are at the bottom.

-- =====================================================
-- UP Migration
-- =====================================================

CREATE TABLE dbo.Alerts (
    Id              VARCHAR(16)      NOT NULL,                 -- e.g. 'ALT-00042'
    Title           NVARCHAR(300)    NOT NULL,
    Severity        VARCHAR(10)      NOT NULL,
    [Status]        VARCHAR(20)      NOT NULL,
    Source          VARCHAR(20)      NOT NULL,
    CreatedAt       DATETIME2(0)     NOT NULL,
    Assignee        VARCHAR(254)     NULL,
    Description     NVARCHAR(2000)   NOT NULL,
    Entity          NVARCHAR(300)    NOT NULL,
    RowVersion      ROWVERSION       NOT NULL,                 -- optimistic concurrency
    CONSTRAINT PK_Alerts PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT CK_Alerts_Severity CHECK (Severity IN ('Critical','High','Medium','Low')),
    CONSTRAINT CK_Alerts_Status   CHECK ([Status]  IN ('New','In Progress','Escalated','Resolved','Suppressed')),
    CONSTRAINT CK_Alerts_Source   CHECK (Source    IN ('EDR','SIEM','IDS','Email Gateway','Cloud Audit','Identity'))
);

-- Filtered list view: open alerts ordered by created desc.
-- Most analysts spend time on Status IN ('New','In Progress','Escalated').
CREATE INDEX IX_Alerts_Status_Severity_Created
    ON dbo.Alerts ([Status], Severity, CreatedAt DESC)
    INCLUDE (Title, Source, Assignee, Entity);

-- Free-text search uses LIKE on title in this stub; in prod we'd add a
-- full-text catalog or a denormalized search column with computed token vector.
CREATE INDEX IX_Alerts_Assignee_Status
    ON dbo.Alerts (Assignee, [Status])
    WHERE Assignee IS NOT NULL;

-- Append-only audit. One row per transition. Joins back to Alerts on Id.
CREATE TABLE dbo.AlertStatusHistory (
    HistoryId       BIGINT IDENTITY(1,1) NOT NULL,
    AlertId         VARCHAR(16)          NOT NULL,
    PreviousStatus  VARCHAR(20)          NOT NULL,
    NewStatus       VARCHAR(20)          NOT NULL,
    ChangedBy       VARCHAR(254)         NOT NULL,
    ChangedAt       DATETIME2(0)         NOT NULL CONSTRAINT DF_AlertStatusHistory_ChangedAt DEFAULT SYSUTCDATETIME(),
    Note            NVARCHAR(500)        NULL,
    RequestId       UNIQUEIDENTIFIER     NULL,                                                -- correlation id
    SourceIp        VARCHAR(45)          NULL,
    CONSTRAINT PK_AlertStatusHistory PRIMARY KEY CLUSTERED (HistoryId),
    CONSTRAINT FK_AlertStatusHistory_Alert FOREIGN KEY (AlertId) REFERENCES dbo.Alerts(Id)
);

CREATE INDEX IX_AlertStatusHistory_AlertId
    ON dbo.AlertStatusHistory (AlertId, ChangedAt DESC);


-- =====================================================
-- Status-change UPDATE (called by IAlertsRepository.UpdateStatusAsync)
-- =====================================================
--
-- Parameters supplied by the C# repo:
--   @Id              VARCHAR(16)
--   @NewStatus       VARCHAR(20)
--   @ExpectedVersion BINARY(8)        -- the rowversion the analyst loaded
--   @ChangedBy       VARCHAR(254)
--   @Note            NVARCHAR(500)
--   @RequestId       UNIQUEIDENTIFIER
--   @SourceIp        VARCHAR(45)
--
-- Atomic: the OUTPUT clause emits the prior status which is then inserted
-- into AlertStatusHistory in the same INSERT...SELECT. The whole batch runs
-- in one transaction. If the rowversion does not match (another analyst
-- changed it first), zero rows are updated, the history insert is a no-op,
-- and the C# repo translates @@ROWCOUNT = 0 into DbUpdateConcurrencyException.

SET XACT_ABORT ON;
BEGIN TRANSACTION;

    DECLARE @audit TABLE (
        AlertId        VARCHAR(16),
        PreviousStatus VARCHAR(20),
        NewStatus      VARCHAR(20)
    );

    UPDATE dbo.Alerts
       SET [Status] = @NewStatus
    OUTPUT inserted.Id, deleted.[Status], inserted.[Status]
        INTO @audit (AlertId, PreviousStatus, NewStatus)
     WHERE Id = @Id
       AND RowVersion = @ExpectedVersion
       -- State-machine guard, also enforced in code for testability:
       AND NOT (deleted.[Status] = 'Suppressed' AND @NewStatus = 'New');

    IF @@ROWCOUNT = 0
    BEGIN
        ROLLBACK TRANSACTION;
        -- Caller (C#) treats this as 409 Conflict or 404 (after a follow-up SELECT).
        RETURN;
    END

    INSERT INTO dbo.AlertStatusHistory
        (AlertId, PreviousStatus, NewStatus, ChangedBy, Note, RequestId, SourceIp)
    SELECT a.AlertId, a.PreviousStatus, a.NewStatus, @ChangedBy, @Note, @RequestId, @SourceIp
      FROM @audit a;

COMMIT TRANSACTION;

-- After commit the repo SELECTs the row (including the new RowVersion) and returns it.


-- =====================================================
-- DOWN Migration (Rollback)
-- =====================================================
--
-- DROP INDEX IX_AlertStatusHistory_AlertId ON dbo.AlertStatusHistory;
-- DROP TABLE dbo.AlertStatusHistory;
-- DROP INDEX IX_Alerts_Assignee_Status ON dbo.Alerts;
-- DROP INDEX IX_Alerts_Status_Severity_Created ON dbo.Alerts;
-- DROP TABLE dbo.Alerts;


-- =====================================================
-- Production-readiness notes
-- =====================================================
--
-- - Partition Alerts on CreatedAt monthly once ingestion volume justifies it;
--   the IX_Alerts_Status_Severity_Created index aligns with that partition key.
-- - AlertStatusHistory grows unbounded — move rows older than N days to a
--   cold archive (Synapse / external table) via nightly job.
-- - For Postgres: replace ROWVERSION with xmin or an explicit BIGINT version
--   column incremented in the UPDATE. The OUTPUT clause becomes RETURNING and
--   the audit insert moves into a CTE chain or a row-level AFTER UPDATE trigger.
-- - Avoid triggers for audit if you want the write path testable end-to-end
--   without DB plumbing — keeping the audit in the same statement is cleaner.
-- - Add a covering index on (Assignee, Status, CreatedAt DESC) once "my queue"
--   becomes a hot path; the existing IX_Alerts_Assignee_Status is just the seed.
