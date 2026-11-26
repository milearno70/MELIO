using System.ComponentModel.DataAnnotations;

namespace MELIO.Api.DTOs;

/// <summary>Payload for creating a task.</summary>
public sealed record CreateTaskRequest
{
    [Required]
    [StringLength(120, MinimumLength = 1)]
    public required string Title { get; init; }

    [Required]
    [StringLength(60, MinimumLength = 1)]
    public required string Category { get; init; }
}

/// <summary>Payload for updating a task's completion state.</summary>
public sealed record UpdateTaskRequest
{
    [Required]
    public required bool? IsCompleted { get; init; }
}

/// <summary>A task belonging to the authenticated user.</summary>
public sealed record TaskResponse(
    Guid Id,
    string Title,
    string Category,
    bool IsCompleted,
    DateTimeOffset CreatedAt);
