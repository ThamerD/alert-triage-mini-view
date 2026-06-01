// Review-only ASP.NET stub backing the alert status change.
// Not wired to the Next.js app (in-memory updates are sufficient for the exercise).
//
// Endpoint shape:  PATCH /api/alerts/{id}/status
// Body         :   { "status": "In Progress", "note": "optional" }
// Response     :   200 with updated Alert, 400 / 404 / 409 / 412 on errors

using System;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AlertTriage.Api;

public enum AlertStatus
{
    New,
    InProgress,
    Escalated,
    Resolved,
    Suppressed,
}

public sealed record Alert(
    string Id,
    string Title,
    string Severity,
    AlertStatus Status,
    string Source,
    DateTimeOffset CreatedAt,
    string? Assignee,
    string Description,
    string Entity,
    byte[] RowVersion);

public sealed record StatusChangeRequest(
    [Required] AlertStatus Status,
    [StringLength(500)] string? Note);

public interface IAlertsRepository
{
    Task<Alert?> GetAsync(string id, CancellationToken ct);

    // Returns updated row on success, null if id not found,
    // throws DbUpdateConcurrencyException on rowversion mismatch.
    Task<Alert?> UpdateStatusAsync(
        string id,
        AlertStatus newStatus,
        string? note,
        string changedBy,
        byte[] expectedRowVersion,
        CancellationToken ct);
}

[ApiController]
[Authorize]                                       // PROD: enforce auth; analyst role required
[Route("api/alerts")]
[Produces("application/json")]
public sealed class AlertsController : ControllerBase
{
    private readonly IAlertsRepository _repo;
    private readonly ILogger<AlertsController> _logger;

    public AlertsController(IAlertsRepository repo, ILogger<AlertsController> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    /// <summary>Update an alert's triage status.</summary>
    [HttpPatch("{id}/status")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(Alert), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status412PreconditionFailed)]
    public async Task<IActionResult> UpdateStatus(
        [FromRoute] string id,
        [FromBody] StatusChangeRequest body,
        [FromHeader(Name = "If-Match")] string? ifMatch,
        CancellationToken ct)
    {
        // PROD: rate-limit per analyst (e.g. 60 status changes / min) — burst caps stop runaway scripts.

        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        // PROD: Require If-Match (rowversion) so two analysts can't silently overwrite each other.
        if (string.IsNullOrEmpty(ifMatch))
            return Problem(statusCode: StatusCodes.Status428PreconditionRequired,
                title: "If-Match header (rowversion) is required.");

        if (!TryDecodeRowVersion(ifMatch, out var expectedRowVersion))
            return BadRequest(new { error = "Malformed If-Match header." });

        var user = User.Identity?.Name ?? throw new InvalidOperationException("Authenticated user required.");

        try
        {
            var updated = await _repo.UpdateStatusAsync(
                id,
                body.Status,
                body.Note,
                changedBy: user,
                expectedRowVersion: expectedRowVersion,
                ct: ct);

            if (updated is null) return NotFound();

            // PROD: emit domain event ("alert.status.changed") to bus for downstream consumers
            //       (SOAR playbooks, SLA timers, metrics, audit pipeline).
            _logger.LogInformation(
                "Alert {AlertId} status -> {Status} by {User}",
                id, body.Status, user);

            return Ok(updated);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Row has changed since the analyst loaded it.
            return Conflict(new { error = "Alert was modified by another user. Reload and retry." });
        }
    }

    private static bool TryDecodeRowVersion(string ifMatch, out byte[] result)
    {
        // Convention: clients send the rowversion as a base64 ETag in quotes.
        try
        {
            result = Convert.FromBase64String(ifMatch.Trim('"'));
            return result.Length == 8;
        }
        catch
        {
            result = Array.Empty<byte>();
            return false;
        }
    }
}

// Stub so the file compiles without EF Core in scope.
public sealed class DbUpdateConcurrencyException : Exception { }
