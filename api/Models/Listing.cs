using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PraxisApi.Models;

[Table("listings")]
public class Listing
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("seller_id")]
    public Guid SellerId { get; set; }

    [Column("title")]
    public required string Title { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("price")]
    public decimal Price { get; set; }

    [Column("category")]
    public required string Category { get; set; }

    [Column("condition")]
    public string? Condition { get; set; }

    [Column("status")]
    public required string Status { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
