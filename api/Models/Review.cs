using System.ComponentModel.DataAnnotations.Schema;

namespace PraxisApi.Models;

[Table("reviews")]
public class Review
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("reviewer_id")]
    public Guid ReviewerId { get; set; }

    [Column("reviewee_id")]
    public Guid RevieweeId { get; set; }

    [Column("transaction_id")]
    public Guid? TransactionId { get; set; }

    [Column("rating")]
    public int Rating { get; set; }

    [Column("comment")]
    public string? Comment { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? Reviewer { get; set; }
    public User? Reviewee { get; set; }
}
