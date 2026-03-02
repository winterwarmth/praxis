using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PraxisApi.Models;

[Table("listing_images")]
public class ListingImage
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("listing_id")]
    public Guid ListingId { get; set; }

    [Column("image_url")]
    public required string ImageUrl { get; set; }

    [Column("display_order")]
    public int DisplayOrder { get; set; }

    public Listing Listing { get; set; } = null!;
}
