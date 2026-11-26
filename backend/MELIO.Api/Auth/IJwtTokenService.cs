using MELIO.Api.Models;

namespace MELIO.Api.Auth;

public interface IJwtTokenService
{
    IssuedToken CreateToken(User user);
}

public sealed record IssuedToken(string AccessToken, DateTime ExpiresAt);
