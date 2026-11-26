using System.ComponentModel.DataAnnotations;

namespace MELIO.Api.Dtos;

public sealed class RegisterRequestDto
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; init; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string Password { get; init; } = string.Empty;
}

public sealed class LoginRequestDto
{
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; init; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string Password { get; init; } = string.Empty;
}

public sealed record UserResponseDto(Guid Id, string Name, string Email, DateTime CreatedAt);

public sealed record AuthResponseDto(string AccessToken, DateTime ExpiresAt, UserResponseDto User);
