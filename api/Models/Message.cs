using System.ComponentModel.DataAnnotations.Schema;

namespace PraxisApi.Models;

[Table("messages")]
public class Message
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("sender_id")]
    public Guid SenderId { get; set; }

    [Column("receiver_id")]
    public Guid ReceiverId { get; set; }

    [Column("listing_id")]
    public Guid? ListingId { get; set; }

    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [Column("is_read")]
    public bool IsRead { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("SenderId")]
    public User? Sender { get; set; }

    [ForeignKey("ReceiverId")]
    public User? Receiver { get; set; }

    [ForeignKey("ListingId")]
    public Listing? Listing { get; set; }
}