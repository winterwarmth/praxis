using System.ComponentModel.DataAnnotations.Schema;

namespace PraxisApi.Models;

[Table("users")]
public class User
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("supabase_id")]
    public string SupabaseId { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("username")]
    public string Username { get; set; } = string.Empty;

    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [Column("role")]
    public string Role { get; set; } = "student";

    [Column("bio")]
    public string? Bio { get; set; }

    [Column("profile_image_url")]
    public string? ProfileImageUrl { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("username_changed_at")]
    public DateTime? UsernameChangedAt { get; set; }

    [Column("preferred_payment_methods")]
    public string PreferredPaymentMethods { get; set; } = "";

    [Column("is_banned")]
    public bool IsBanned { get; set; }

    [Column("banned_at")]
    public DateTime? BannedAt { get; set; }

    [Column("ban_reason")]
    public string? BanReason { get; set; }

    [Column("show_courses")]
    public bool ShowCourses { get; set; }

    [Column("show_email")]
    public bool ShowEmail { get; set; }

    [Column("auto_payment_filter")]
    public bool AutoPaymentFilter { get; set; }
}
