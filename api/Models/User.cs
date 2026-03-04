using System.ComponentModel.DataAnnotations.Schema;

namespace PraxisApi.Models;

[Table("users")]
public class User
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("username")]
    public string Username { get; set; } = string.Empty;

    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [Column("profile_image_url")]
    public string? ProfileImageUrl { get; set; }
}